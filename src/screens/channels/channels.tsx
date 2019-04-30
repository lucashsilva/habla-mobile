import * as React from 'react';
import { StyleSheet, Text, FlatList, RefreshControl, TouchableOpacity, View, Platform } from 'react-native';
import { client } from '../../services/client';
import gql from 'graphql-tag';
import THEME from '../../theme/theme';
import i18n from 'i18n-js';
import { Location, Permissions } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import Modal from "react-native-modal";
import NewChannelScreen from '../new-channel/new-channel';
import { SearchBar } from 'react-native-elements';

export default class ChannelsScreen extends React.Component<ChannelsScreenProps, ChannelsScreenState> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('screens.channels.title'), 
      headerStyle: {
        backgroundColor: THEME.colors.primary.default,
        borderBottomWidth: 0,
      },
      headerTitleStyle: {
        color: '#F5F5F5'
      },
      headerRight: (
        <TouchableOpacity onPress={navigation.getParam('newChannelTapped')} style={styles.page.newChannelButton}>
          <Ionicons name="ios-create" size={30} color="white"/>
        </TouchableOpacity>
      )
    }
  };

  currentRefreshPromise: Promise<any>;

  constructor(props) {
    super(props);

    this.state = { channels: [], refreshing: false, showNewChannelModal: false, loadingMoreChannels: false, searchString: '' };

    this.props.navigation.setParams({ newChannelTapped: this.newChannelTapped });
  }

  componentWillMount() {
    this.refresh();
  }

  newChannelTapped = () => {
    this.setState({ showNewChannelModal: true });
  }

  refresh = () => {
    let refreshPromise = new Promise(async(resolve, reject) => {
      await this.setState({ refreshing: true });

      let channels;
    
      try {
        channels = await this.fetchChannels({ limit: 20, searchString: this.state.searchString });
      } catch (error) {
        console.log(error);
        reject(error);
      }

      if (this.currentRefreshPromise == refreshPromise) {
        this.setState({ channels, refreshing: false });
      } else {
        console.log('oi')
      }

      resolve();
    });

    this.currentRefreshPromise = refreshPromise;

    return refreshPromise;
  }

  loadMoreChannels = async() => {
    if (this.state.loadingMoreChannels) return;

    this.setState({ loadingMoreChannels: true });

    try {
      let channels = await this.fetchChannels({ limit: 10, ignoreIds: this.state.channels.map(c => c.id), searchString: this.state.searchString });
      this.setState({ channels: [...this.state.channels, ...channels] });
    } catch (error) {
      console.log(error);
    } finally {
      this.setState({ loadingMoreChannels: false });
    }
  }

  fetchChannels = async(options: FetchChannelsOptions = { limit: 20, ignoreIds: [] }) => {
    try {
      await Permissions.askAsync(Permissions.LOCATION);
      const location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
      
      const response = await client.query<any>({
        variables: {
          limit: options.limit,
          ignoreIds: options.ignoreIds,
          searchString: options.searchString
        },
        query: gql(`
          query Channels($limit: Int, $ignoreIds: [ID!], $searchString: String) {
            channels(limit: $limit, ignoreIds: $ignoreIds, searchString: $searchString) {
              id,
              name,
              postsCount
            }
          }
        `),
        context: {
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          },
        },
        fetchPolicy: 'no-cache'
      });

      return response.data.channels;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  onChannelCreated = (channel) => {
    this.setState({ showNewChannelModal: false, channels: [channel, ...this.state.channels] });
    
    this.props.navigation.navigate('TimelineScreen', { channel: channel });
  }

  handleSearch = (text) => {
    this.setState({ searchString: text, loadingMoreChannels: true }, this.refresh);
  }

  render() {
    return (
      <View style={styles.page.container}>
        <SearchBar
          placeholder="Type here..."
          onChangeText={this.handleSearch}
          autoCorrect={false}
          autoCapitalize="none"
          value={this.state.searchString}
          showLoading={this.state.refreshing && !!this.state.searchString}
          cancelButtonTitle={null}
          platform={Platform.OS === 'ios'? 'ios' : 'android'}
        />
        <FlatList data={this.state.channels}
                  keyExtractor={(item) => item.id.toString()}
                  onEndReached={this.loadMoreChannels}
                  onEndReachedThreshold={0.5}
                  // ListFooterComponent={() => {
                  //   return this.state.loadingMoreChannels? 
                  //     <View style={styles.page.listFooter} >
                  //       <ActivityIndicator size="large"/>
                  //     </View>: null;
                  // }}
                  refreshControl={
                    <RefreshControl
                      refreshing={this.state.refreshing && !this.state.searchString}
                      onRefresh={this.refresh}
                    />
                  }
                  renderItem={({item}) =>(
                    <TouchableOpacity style={styles.channel.container}
                                      onPress={() => this.props.navigation.navigate('TimelineScreen', { channel: item })}>
                      <Text style={styles.channel.channelTitle}>#{ item.name }</Text>
                      <View style={styles.channel.channelBadge}>
                        <Text style={styles.channel.channelBadgeText}>{ item.postsCount }</Text>
                      </View>
                    </TouchableOpacity>
        )}/>
        <Modal isVisible={this.state.showNewChannelModal}
               avoidKeyboard={true}
               style={styles.page.newChannelModal}
               animationInTiming={400}
               animationOutTiming={400}>
               <NewChannelScreen navigation={this.props.navigation} 
                         onSuccess={this.onChannelCreated}
                         onDismiss={() => this.setState({ showNewChannelModal: false })}/>
        </Modal>
      </View>
    );
  }
}

const styles = {
  page: StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff'
    },
    newChannelModal: {
      width: '100%',
      margin: 0,
      padding: 0
    },
    newChannelButton: {
      marginRight: 10
    },
    listFooter: {
      padding: 10
    },
    searchBarContainer: {
      backgroundColor: '#fff',
      borderBottomWidth: 0
    },
    searchBarInput: {
      backgroundColor: '#eee'
    },
    searchBarText: {
      color: '#000'
    }
  }),
  channel: StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      padding: 12,
      marginTop: 2,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      justifyContent: 'space-between'
    },
    channelTitle: {
      fontSize: 22,
      fontWeight: 'bold'
    },
    channelBadge: {
      padding: 10,
      backgroundColor: '#eee',
      borderRadius: 10
    },
    channelBadgeText: { 
      fontWeight: 'bold'
    }
  })
};

interface ChannelsScreenState {
  channels: any[];
  refreshing: boolean;
  loadingMoreChannels: boolean;
  showNewChannelModal: boolean;
  searchString: string;
}

interface ChannelsScreenProps {
  navigation: any;
}

interface FetchChannelsOptions {
  limit?: number;
  ignoreIds?: number[]; 
  searchString?: string;
}