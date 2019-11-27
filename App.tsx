import React from 'react';
import TimelineScreen from './src/screens/timeline/timeline';
import { createBottomTabNavigator, createStackNavigator, createSwitchNavigator, createAppContainer, NavigationActions } from 'react-navigation';
import { FontAwesome } from '@expo/vector-icons';
import firebase from 'firebase';
import LoginScreen from './src/screens/login/login';
import ProfileScreen from './src/screens/profile/profile';
import PostScreen from './src/screens/post/post';
import AppLoadingScreen from './src/screens/app-loading/app-loading';
import ProfileCreationScreen from './src/screens/profile-creation/profile-creation';
import ChannelsScreen from './src/screens/channels/channels';
import ProfileEditionScreen from './src/screens/profile-edition/profile-edition';
import THEME from './src/theme/theme';
import NotificationsScreen from './src/screens/notifications/notifications';
import i18n from 'i18n-js';
import moment from 'moment';
import 'moment/min/locales';
import * as Localization from 'expo-localization';

// languages
import en from './src/locales/en';
import pt from './src/locales/pt';

const firebaseConfig = require('./firebase.json');

firebase.initializeApp(firebaseConfig);

Localization.getLocalizationAsync().then(localization => {
  const locale = localization.locale;

  i18n.fallbacks = true;
  i18n.translations = { en, pt };
  i18n.locale = locale;

  if (moment.locales().find(l => l === locale.toLowerCase())) {
    moment.locale(locale.toLowerCase());
  } else {
    moment.locale('en');
  }
});

const TabsNavigator = createBottomTabNavigator({
  TimelineStack: createStackNavigator({
    TimelineScreen,
    ProfileScreen,
    PostScreen,
    NotificationsScreen
  }, {
    defaultNavigationOptions: {
      headerTintColor: 'white',
    }
  }),
  ChannelsStack: createStackNavigator({
    ChannelsScreen,
    TimelineScreen,
    ProfileScreen,
    PostScreen
  }, {
    defaultNavigationOptions: {
      headerTintColor: 'white',
    }
  }),
  ProfileStack: createStackNavigator({
    ProfileScreen,
    PostScreen,
    ProfileEditionScreen
  }, {
    defaultNavigationOptions: {
      headerTintColor: 'white',
    }
  })
}, 
{
  defaultNavigationOptions: ({ navigation }) => ({
    tabBarOptions: {
      showLabel: false,
      activeTintColor: THEME.colors.primary.default,
      style: {
        backgroundColor: '#F5F5F5',
        height: 60
      },
    },
    headerTintColor: 'white',
    tabBarIcon: ({ focused, tintColor }) => {
      const { routeName } = navigation.state;
      const size = focused? 30: 25;

      if (routeName === 'TimelineStack') {
        return <FontAwesome name="home" size={size} color={tintColor}/>;
      } else if (routeName === 'ChannelsStack') {
        return <FontAwesome name="hashtag" size={size} color={tintColor}/>;
      } else if (routeName === 'ProfileStack') {
        return <FontAwesome name="user" size={size} color={tintColor}/>;
      }
    },
  })
});

const AppContainer = createAppContainer(createSwitchNavigator({
  AppLoadingScreen,
  LoginScreen,
  TabsNavigator,
  ProfileCreationScreen
}));

class HablaApp extends React.Component<any, any> {
  navigator: any;

  constructor(props) {
    super(props);

    // Linking.parseInitialURLAsync().then(this.handleLink);
    // Linking.addEventListener('url', event => this.handleLink(Linking.parse(event.url)));
  }

  render() {
    return <AppContainer ref={navigator => this.navigator = navigator}/>
  }

  // handleLink = (link) => {
  //   if (link.path === "post") {
  //     this.navigator.dispatch(NavigationActions.navigate("LoginScreen", { postId: link.queryParams.postId }));
  //   }
  // }
}

export default HablaApp;
  
