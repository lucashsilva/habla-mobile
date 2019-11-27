import * as React from 'react';
import { FlatList, View, StyleSheet, TouchableOpacity, RefreshControl, StatusBar, Text, AsyncStorage, Button, TouchableHighlight, ActivityIndicator } from 'react-native';
import PostComponent from '../../components/post/post';
import { Platform } from 'react-native';
import ActionButton from 'react-native-action-button';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import Modal from "react-native-modal";
import NewPostScreen from '../new-post/new-post';
import * as Permissions from 'expo-permissions';
import * as Location from "expo-location";
import { client } from '../../services/client';
import gql from 'graphql-tag';
import THEME from '../../theme/theme';
import i18n from 'i18n-js';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import { sortPostsByPopularity, getReverseLocationFromCoords, getCitiesContainingString, getLocationGeocodeByPlaceId } from '../../util';
import _ from 'lodash';
import { SearchBar } from 'react-native-elements';

export default class TimelineScreen extends React.Component<TimelineProps, TimelineState> {
  static navigationOptions = ({ navigation }) => {
    let params = navigation.state.params || {};

    let { changeLocationOpen, loadingLocationInfo, currentLocationName } = params;

    return {
      title: params && params.channel ? `#${params.channel.name}` : i18n.t('screens.timeline.title'),
      headerTitle: (
        <TouchableOpacity style={styles.page.headerTouchable} onPress={changeLocationOpen}>
          {(loadingLocationInfo || !currentLocationName) ?
            <ActivityIndicator size="small" style={styles.page.locationLoading} color="white" /> :
            <View style={styles.page.headerTouchableLocation}>
              <Ionicons name="md-pin" color="white" size={20} />
              <Text style={{ color: 'white', marginLeft: 5, fontWeight: "400", fontSize: 18 }}>{currentLocationName}</Text>
            </View>
          }
        </TouchableOpacity>
      ),
      headerRight: !(params && params.channel) ? (
        <TouchableOpacity onPress={() => navigation.navigate('NotificationsScreen')} style={styles.page.notificationButton}>
          <MaterialIcons name="notifications" size={30} color="white" />
        </TouchableOpacity>
      ) : null,
      headerStyle: {
        backgroundColor: THEME.colors.primary.default,
        borderBottomWidth: 0,
      },
      headerTitleStyle: {
        color: '#F5F5F5',
        alignSelf: 'center'
      }
    }
  };

  currentRefreshPromise: Promise<any>;

  constructor(props: TimelineProps) {
    super(props);

    this.state = {
      currentLocation: [],
      availableLocations: [],
      posts: [],
      refreshing: true,
      loadingMorePosts: false,
      showNewPostModal: false,
      canLoadMorePosts: false,
      selectedIndex: 0,
      showChangeLocationModal: false,
      searchLocation: '',
      loadingMoreLocations: false,
      listLocationsFound: []
    };

    this.props.navigation.setParams({ changeLocationOpen: this.changeLocationOpen, loadingLocationInfo: true });
  }

  componentWillMount = async () => {
    let lastLocation: any = await AsyncStorage.getItem('last-location');

    lastLocation = lastLocation ? JSON.parse(lastLocation) : null;

    if (lastLocation) {
      this.props.navigation.setParams({ currentLocationName: lastLocation.city || lastLocation.street });
    }

    if (!this.hasChannel()) {
      let cachedPosts: any = await AsyncStorage.getItem('cached-timeline');

      this.setState({ posts: cachedPosts ? JSON.parse(cachedPosts) : [] });
    }

    await this.refresh({ resetCurrentLocation: true });
  }

  refresh = (options: RefreshOptions = {}) => {
    let refreshPromise = new Promise(async (resolve, reject) => {
      this.setState({ refreshing: true });

      let cachedProfile: any = await AsyncStorage.getItem('cached-profile');

      cachedProfile = cachedProfile && JSON.parse(cachedProfile);

      await Permissions.askAsync(Permissions.LOCATION);

      const location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
      const currentLocation = [location.coords.latitude, location.coords.longitude];

      const locationHasChanged = options.setLocation || options.resetCurrentLocation;

      const availableLocations = cachedProfile && cachedProfile.home ? [currentLocation, cachedProfile.home] : [currentLocation];

      this.props.navigation.setParams({ availableLocations });

      this.setState({
        currentLocation: options.resetCurrentLocation ? currentLocation : (options.setLocation || this.state.currentLocation),
        availableLocations: availableLocations,
        canLoadMorePosts: true
      }, async () => {
        if (locationHasChanged) {
          this.props.navigation.setParams({ loadingLocationInfo: true });

          let currentLocationName;

          try {
            currentLocationName = await this.getLocalInfo(this.state.currentLocation);
          } finally {
            this.props.navigation.setParams({ currentLocationName, loadingLocationInfo: false });
          }
        }
      });

      let posts;

      try {
        posts = await this.fetchPosts({ limit: 20 });
      } catch (error) {
        console.log(error);
        reject(error);
        this.setState({ refreshing: false });
        return;
      }

      if (this.currentRefreshPromise == refreshPromise) {
        this.setState({ posts, refreshing: false, errorMessage: null }, async () => {
          if (!this.hasChannel() && this.state.currentLocation == this.state.availableLocations[0]) await AsyncStorage.setItem('cached-timeline', JSON.stringify(posts));
        });
      }

      resolve();
    });

    this.currentRefreshPromise = refreshPromise;

    return refreshPromise;
  }

  loadMorePosts = async () => {
    if (this.state.refreshing || this.state.loadingMorePosts) return;

    this.setState({ loadingMorePosts: true });

    try {
      let posts = await this.fetchPosts({ limit: 10, ignoreIds: this.state.posts.map(c => c.id) });

      this.setState({ posts: [...this.state.posts, ...posts], errorMessage: null });
    } catch (error) {
      console.log(error);
    } finally {
      this.setState({ loadingMorePosts: false });
    }
  }

  fetchPosts = async (options: FetchPostsOptions = { limit: 20, ignoreIds: [] }) => {
    try {
      const location = this.state.currentLocation;
      const channelId = this.props.navigation.state.params && this.props.navigation.state.params.channel ? this.props.navigation.state.params.channel.id : null;

      const response = await client.query<any>({
        variables: {
          limit: options.limit,
          ignoreIds: options.ignoreIds
        },
        query: gql(`
         query Posts($limit: Int, $ignoreIds: [ID!]) {
          posts(limit: $limit, ignoreIds: $ignoreIds, channelId: ${channelId}) {
                id
                body
                distance
                exactDistance
                createdAt
                commentsCount
                rate
                photoURL
                anonymous
                profilePostVote {
                  type
                }
                profileFollowPost{
                  postId
                  profileUid
                }
                profileRevealPosts{
                  profileUid
                  postId
                  type
                  post {
                    exactDistance
                  }
                }
                owner {
                  uid
                  username
                  photoURL
                }
                channels {
                  id
                  name
                }
              }
            }
          `),
        context: {
          location: {
            latitude: location[0],
            longitude: location[1]
          }
        },
        fetchPolicy: 'no-cache'
      });

      return this.state.selectedIndex === 1 ? sortPostsByPopularity(response.data.posts) : response.data.posts;
    } catch (error) {
      const errorMessage = error.networkError ? i18n.t('screens.timeline.errors.fetchingPosts.connection') : i18n.t('screens.timeline.errors.fetchingPosts.unexpected');

      this.setState({ errorMessage });

      console.log(error);
    }
  }

  openChannel = (channel) => {
    if (!this.hasChannel() || this.currentChannel.id !== channel.id) this.props.navigation.push('TimelineScreen', { channel: channel });
  }

  openProfile = (profile) => {
    this.props.navigation.push('ProfileScreen', { profile: profile });
  }

  openPost = (post) => {
    this.props.navigation.push('PostScreen', { post: post, onPostDeleted: this.onPostDeleted });
  }

  onPostDeleted = (post) => {
    _.remove(this.state.posts, (p: any) => p.id === post.id);

    this.setState({
      posts: this.state.posts
    }); // force update
  }

  newPost = () => {
    this.setState({ showNewPostModal: true });
  }

  onPostSent = (post) => {
    this.setState({ showNewPostModal: false });

    if (!this.hasChannel() || (post.channels.find(c => c.name == this.currentChannel.name))) {
      this.setState({ posts: [post, ...this.state.posts] });
    }
  }

  hasChannel() {
    return !!this.currentChannel;
  }

  get currentChannel() {
    return this.props.navigation.state.params && this.props.navigation.state.params.channel;
  }

  getLocalInfo = async (location) => {
    let local: any = await getReverseLocationFromCoords({ latitude: location[0], longitude: location[1] });
    return local[0].city || local[0].street;
  }

  showPostsAtHome = () => {
    this.setState({ showChangeLocationModal: false });

    return this.refresh({ resetCurrentLocation: false, setLocation: this.state.availableLocations[1] });
  }

  showPostsAtCurrentLocation = () => {
    this.setState({ showChangeLocationModal: false });

    return this.refresh({ resetCurrentLocation: false, setLocation: this.state.availableLocations[0] });
  }

  handleSelectedIndex = (index) => {
    this.setState({ selectedIndex: index });

    return this.refresh({ resetCurrentLocation: false });
  }

  changeLocationOpen = () => {
    this.setState({ showChangeLocationModal: true });
  }

  changeLocationClose = async(locationFromGoogle) => {
    this.setState({ showChangeLocationModal: false, searchLocation: null, listLocationsFound: [] });

    if (!locationFromGoogle) return;

    let location = await getLocationGeocodeByPlaceId(locationFromGoogle.place_id);

    location = location.results && location.results[0] && location.results[0].geometry && location.results[0].geometry.location && [location.results[0].geometry.location.lat, location.results[0].geometry.location.lng];

    if (location) this.refresh({ resetCurrentLocation: false, setLocation: location });
  }

  handleLocationSearch = async(text) => {
    this.setState({ searchLocation: text, loadingMoreLocations: true });

    let cities = await getCitiesContainingString(text);
    
    this.setState({
      listLocationsFound: cities.predictions
    });
  }

  renderSeparator = () => {
    return (
      <View
        style={{
          height: 1,
          width: '86%',
          backgroundColor: '#CED0CE',
        }}
      />
    );
  };

  render() {
    return (
      <View style={styles.page.container}>
        <View style={styles.page.container}>
          <StatusBar barStyle="light-content" />
          {this.state.errorMessage &&
            <View style={styles.page.errorView}>
              <Ionicons name="ios-sad" size={100} color="white" />
              <Text style={styles.page.errorText}>{this.state.errorMessage}</Text>
            </View>}
          {this.currentChannel &&
            <View style={styles.page.currentChannelView}>
              <Text style={styles.page.currentChannelText}>#{this.currentChannel.name}</Text>
            </View>}
          <FlatList data={this.state.posts}
            keyExtractor={(item) => item.id.toString()}
            onEndReached={this.loadMorePosts}
            onEndReachedThreshold={0.5}
            refreshing={this.state.refreshing}
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={() => this.refresh({ resetCurrentLocation: false })}
              />
            }
            ListHeaderComponent={<SegmentedControlTab
              values={[i18n.t("screens.timeline.tabs.recent"), i18n.t("screens.timeline.tabs.trending")]}
              selectedIndex={this.state.selectedIndex}
              onTabPress={this.handleSelectedIndex}
              tabsContainerStyle={styles.page.tabsContainer}
              tabStyle={styles.page.tabStyle}
              activeTabStyle={styles.page.activeTabStyle}
              tabTextStyle={styles.page.tabTextStyle}
            />}
            ListFooterComponent={!this.state.refreshing && this.state.posts && this.state.posts.length === 0 && <Text style={styles.page.noPosts}>{i18n.t("screens.timeline.empty")}</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => this.openPost(item)}>
                <PostComponent post={item}
                  showPostHeader={true}
                  onOpenProfile={this.openProfile}
                  onOpenChannel={this.openChannel}
                  onPostDeleted={this.onPostDeleted} />
              </TouchableOpacity>
            )} />
        </View>
        <ActionButton buttonColor={THEME.colors.secondary.light}
          position="center"
          hideShadow={true}
          offsetY={10}
          onPress={this.newPost}
          renderIcon={() => <FontAwesome name="plus" size={28} color={'#F5F5F5'} />} />

        <Modal isVisible={this.state.showChangeLocationModal}
        onBackButtonPress={() => this.setState({ showChangeLocationModal: false })}>
          <View style={styles.changeLocation.modalContent}>
            <SearchBar
              placeholder={i18n.t("screens.timeline.newLocation.searchPlaceholder")}
              onChangeText={this.handleLocationSearch}
              autoCapitalize="none"
              value={this.state.searchLocation}
              showLoading={this.state.refreshing && !!this.state.searchLocation}
              cancelButtonTitle={null}
              platform={Platform.OS === 'ios' ? 'ios' : 'android'}
            /> 
            {(this.state.listLocationsFound.length > 0? <FlatList data={this.state.listLocationsFound}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={this.renderSeparator}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => this.changeLocationClose(item)}>
                  <View>
                    <Text style={styles.changeLocation.cityNames}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
            )}/>: 
            <View>
              {this.state.availableLocations[0] && 
                         <TouchableOpacity onPress={this.showPostsAtCurrentLocation} style={styles.changeLocation.button}>
                         <Text style={styles.changeLocation.buttonText}>{i18n.t("screens.timeline.newLocation.buttons.seePostsAtCurrentLocation")}</Text>
                       </TouchableOpacity>}
              {this.state.availableLocations[1] && 
                          <TouchableOpacity onPress={this.showPostsAtHome} style={styles.changeLocation.button}>
                          <Text style={styles.changeLocation.buttonText}>{i18n.t("screens.timeline.newLocation.buttons.seePostsAroundHome")}</Text>
                        </TouchableOpacity>}
            </View>
            )}
            <TouchableOpacity onPress={this.changeLocationClose} style={styles.changeLocation.button}>
              <Text style={styles.changeLocation.buttonText}>{i18n.t("screens.timeline.newLocation.buttons.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Modal isVisible={this.state.showNewPostModal}
          avoidKeyboard={true}
          style={styles.page.newPostModal}
          animationInTiming={400}
          onBackButtonPress={() => this.setState({ showNewPostModal: false })}
          animationOutTiming={400}>
          <NewPostScreen navigation={this.props.navigation}
            onSuccess={this.onPostSent}
            onDismiss={() => this.setState({ showNewPostModal: false })}
            customLocation={this.state.currentLocation}
            channel={this.props.navigation.state.params && this.props.navigation.state.params.channel} />
        </Modal>
      </View>
    );
  }
}

const styles = {
  page: StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      flexGrow: 1
    },
    tabsContainer: {
      padding: 16
    },
    tabStyle: {
      borderColor: THEME.colors.secondary.light
    },
    activeTabStyle: {
      backgroundColor: THEME.colors.secondary.light,
      borderColor: THEME.colors.secondary.light
    },
    tabTextStyle: {
      fontSize: 16,
      fontWeight: "400",
      color: THEME.colors.secondary.default
    },
    newPostModal: {
      width: '100%',
      margin: 0,
      padding: 0
    },
    errorView: {
      padding: 20,
      backgroundColor: THEME.colors.error.default,
      justifyContent: 'center',
      alignItems: 'center'
    },
    errorText: {
      color: 'white',
      textAlign: 'center'
    },
    notificationButton: {
      marginRight: 10
    },
    locationLoading: {
      margin: 5
    },
    headerTouchable: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: THEME.colors.primary.dark,
      borderRadius: 10,
      paddingVertical: 5,
      paddingHorizontal: 10,
      marginLeft: Platform.OS === 'android' ? 10 : null
    },
    headerTouchableLocation: {
      flexDirection: 'row'
    },
    noPosts: {
      padding: 20,
      fontSize: 20,
      fontWeight: "200",
      textAlign: 'center'
    },
    currentChannelView: {
      paddingTop: 10,
      backgroundColor: THEME.colors.primary.default,
      alignItems: "center",
      paddingBottom: 20
    },
    currentChannelText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 20
    }
  }),
  changeLocation: StyleSheet.create({
    modalContent: {
      backgroundColor: 'white',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      borderRadius: 4,
      borderColor: THEME.colors.secondary.light,
    },
    button: {
      borderColor: THEME.colors.secondary.light,
      padding: 6,
      margin: 6,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 4,
    },
    buttonText: {
      color: THEME.colors.secondary.light,
      textAlign: 'center'
    },
    cityNames: {
      fontSize: 16,
      padding: 5,
      margin: 5,
    }
  }),
};

interface TimelineState {
  currentLocation: any[];
  availableLocations: any[];
  posts: any[];
  refreshing: boolean;
  loadingMorePosts: boolean;
  showNewPostModal: boolean;
  canLoadMorePosts: boolean;
  selectedIndex: number;
  errorMessage?: string;
  showChangeLocationModal: boolean;
  searchLocation: string;
  loadingMoreLocations: boolean;
  listLocationsFound: any[];
}

interface TimelineProps {
  navigation: any;
}

interface FetchPostsOptions {
  limit?: number;
  ignoreIds?: number[];
}

interface RefreshOptions {
  resetCurrentLocation?: boolean;
  setLocation?: number[];
}