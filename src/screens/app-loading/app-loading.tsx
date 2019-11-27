import * as React from "react";
import firebase from 'firebase';
import { client } from "../../services/client";
import gql from "graphql-tag";
import { AsyncStorage, Text, View, StyleSheet, ActivityIndicator, TouchableOpacity, AppState, StatusBar } from "react-native";
import THEME from "../../theme/theme";
import { Linking, Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import { Ionicons } from '@expo/vector-icons';
import i18n from 'i18n-js';
import { getReverseLocationFromCoords } from "../../util";
import * as Location from "expo-location";

export default class AppLoadingScreen extends React.Component<any, AppLoadingState> {
  _notificationsSubscription;

  constructor(props) {
    super(props);

    console.disableYellowBox = true;

    this.state = {
      loading: true,
      location: null
    };
  }

  componentWillMount = async () => {
    await this.init();
  }

  init = async () => {
    try {
      await this.checkLocationServices();
    } catch (error) {
      console.log(error)
      let handler = async (event) => {
        if (event === 'active') {
          AppState.removeEventListener('change', handler);
          await this.init();
        }
      };

      AppState.addEventListener('change', handler);

      return;
    }

    await this.checkAuthentication();
  }

  checkLocationServices = async () => {
    let lastLocation = await AsyncStorage.getItem('last-location');

    if (lastLocation) {
      lastLocation = JSON.parse(lastLocation);

      this.setState({ location: lastLocation });
    }

    try {
      this.setState({ loading: true });

      await Location.requestPermissionsAsync();

      this.setState({ locationNotAuthorized: false });
    } catch (error) {
      this.setState({ locationNotAuthorized: true, loading: false });

      throw error;
    }

    const coords = (await Location.getCurrentPositionAsync({ enableHighAccuracy: true })).coords;

    // handle timeout

    let location: any = await getReverseLocationFromCoords({ latitude: coords.latitude, longitude: coords.longitude });

    console.log(location);

    if (location && location[0]) {
      location = location[0];
    }

    location && await AsyncStorage.setItem('last-location', JSON.stringify(location));

    this.setState({ location: location });
  }

  checkAuthentication = async () => {
    firebase.auth().onAuthStateChanged(async user => {
      if (user) {
        let token = await firebase.auth().currentUser.getIdToken();
        console.log(token)

        const storedProfile = await AsyncStorage.getItem('cached-profile');
        
        let profile = storedProfile? JSON.parse(await AsyncStorage.getItem('cached-profile')): null;

        profile && await this.handleSuccessProfileFetch(profile);
        
        try {
          profile = await this.fetchProfile(user);
        } catch (error) {
          if (error.graphQLErrors.find(e => e.code === 'NOT_FOUND_ERROR')) {
            this.props.navigation.navigate('ProfileCreationScreen', {
              profile: {
                name: user.displayName,
                photoURL: user.photoURL
              }
            });

            await AsyncStorage.removeItem('cached-profile');
          }
        }

        profile && await this.handleSuccessProfileFetch(profile);
      } else {
        this.props.navigation.navigate('LoginScreen');
        await AsyncStorage.removeItem('cached-profile');
      }
    });
  }

  fetchProfile = async (firebaseUser) => {
    const response = await client.query({
      query: gql(`
        {
          profile(uid: "${firebaseUser.uid}") {
            uid
            name
            username
            bio
            website
            phone
            gender
            home
          }
        }
      `),
      fetchPolicy: 'no-cache'
    });
    
    const profile = (response.data as any).profile;

    return profile;
  }
  
  handleSuccessProfileFetch = async(profile) => {
    if (!profile) return;
    
    await AsyncStorage.setItem('cached-profile', JSON.stringify(profile));
    this.props.navigation.navigate('TabsNavigator');

    await this.registerForNotifications();
  }

  registerForNotifications = async () => {
    if (this.props.exp && this.props.exp.notification) {
      console.log("notification in props")
      console.log(this.props.exp.notification);
    }

    const { status: existingStatus } = await Permissions.getAsync(
      Permissions.NOTIFICATIONS
    );

    let finalStatus = existingStatus;

    // only ask if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    if (existingStatus !== 'granted') {
      // Android remote notification permissions are granted during the app
      // install, so this will only ask on iOS
      const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
      finalStatus = status;
    }

    // Stop here if the user did not grant permissions
    if (finalStatus !== 'granted') {
      return;
    }

    // Get the token that uniquely identifies this device
    let token = await Notifications.getExpoPushTokenAsync();

    // POST the token to your backend server from where you can retrieve it to send push notifications.
    try {
      const response = await client.mutate({
        variables: {
          token: token
        },
        mutation: gql(`
          mutation UpdateExpoPushToken ($token: String) {
            updateExpoPushToken(token: $token)
          }
        `)
      });

      if (response.data.updateExpoPushToken) {
        console.log("Expo push token updated.");
      }

      this._notificationsSubscription = Notifications.addListener(this.handleNotification);
    } catch (error) {
      if (error.graphQLErrors.find(e => e.code == 'INTERNAL_SERVER_ERROR')) {
        const errorMessage = i18n.t('screens.appLoading.errors.updateExpoPushToken.internalServerError');
        this.setState({ errorMessage });
        console.log(error);
      }
    }
  }


  handleNotification = async(notification) => {
    let postNotifications = ["COMMENT_ON_OWNED_POST", "VOTE_ON_OWNED_POST", 
                              "COMMENT_ON_THIRD_PARTY_POST", "COMMENT_ON_THIRD_PARTY_POST_ANONYMOUS"]
    if (notification.origin == "selected" && postNotifications.includes(notification.data.type)){
      this.props.navigation.navigate("PostScreen", { postId: notification.data.postId });
    }
  }

  render() {
    return (
      <View style={styles.page.container}>
        <StatusBar barStyle="light-content" />
        {this.state.errorMessage ? 
          <View style={styles.page.errorView}>
            <Ionicons name="ios-sad" size={100} color="white" />
            <Text style={styles.page.errorText}>{this.state.errorMessage}</Text>
              <Text style={styles.retry.text} onPress={this.init}>Retry</Text>
          </View>: 
          <View>
          { this.state.loading && <ActivityIndicator color="white" size="large"/>}
          { this.state.location && !this.state.locationNotAuthorized && <Text style={styles.page.text}>{ i18n.t('screens.appLoading.greeting', { location: this.state.location.city || this.state.location.street }) }</Text> }
          { this.state.locationNotAuthorized &&
            <View style={styles.page.locationNotAuthorizedView}>
              <Ionicons name="ios-sad" size={100} color="white" />
              <Text style={styles.page.text}>{i18n.t('screens.appLoading.locationNotAuthorized.message')}</Text>
              <TouchableOpacity style={styles.button.touchable} onPress={() => Linking.openURL('app-settings:')}>
                <Text style={styles.button.text}>{i18n.t('screens.appLoading.locationNotAuthorized.buttons.openSettings')}</Text>
              </TouchableOpacity>
            </View>}
          </View>}
        <StatusBar barStyle="light-content"/>
      </View>
    );
  }
}

const styles = {
  page: StyleSheet.create({
    container: {
      flex: 1,
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: THEME.colors.secondary.light
    },
    text: {
      padding: 20,
      color: 'white',
      fontWeight: 'bold',
      fontSize: 20,
      textAlign: 'center'
    },
    locationNotAuthorizedView: {
      justifyContent: 'center',
      alignItems: 'center'
    },
    errorView: {
      padding: 20,
      justifyContent: 'center',
      alignItems: 'center'
    },
    errorText: {
      color: 'white',
      textAlign: 'center'
    }
  }),
  button: StyleSheet.create({
    text: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16
    },
    touchable: {
      backgroundColor: THEME.colors.primary.default,
      padding: 12,
      borderRadius: 10
    },
  }),
  retry: StyleSheet.create({
    text: {
      color: "white",
      fontWeight: "bold",
      padding: 4
    }
  })
};

interface AppLoadingState {
  loading: boolean;
  location?: any;
  locationNotAuthorized?: boolean;
  errorMessage?: string;
}