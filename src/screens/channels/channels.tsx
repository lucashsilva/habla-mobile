import * as React from 'react';
import { StyleSheet, Text, ScrollView, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { client } from '../../services/client';
import gql from 'graphql-tag';
import THEME from '../../theme/theme';
import i18n from 'i18n-js';
import ActionButton from 'react-native-action-button';
import { FontAwesome} from '@expo/vector-icons';
import Modal from "react-native-modal";
import NewChannelScreen from '../new-channel/new-channel';


export default class ChannelsScreen extends React.Component<ChannelsScreenProps, ChannelsScreenState> {
  static navigationOptions = () => {
    return {
      title: i18n.t('screens.channels.title'), 
      headerStyle: {
        backgroundColor: THEME.colors.primary.default,
        borderBottomWidth: 0,
      },
      headerTitleStyle: {
        color: '#F5F5F5'
      }
    }
  };

  constructor(props) {
    super(props);

    this.state = { channels: [], refreshing: false, showNewChannelModal: false };
  }

  componentWillMount() {
    this.refresh();
  }

  newChannel = () => {
    this.setState({ showNewChannelModal: true });
  }

  refresh = async() => {
    this.setState({ refreshing: true });
    
    try {
      await this.fetchChannels();
    } catch (error) {
      console.log(error);
    }
      
    this.setState({ refreshing: false });
  }

  fetchChannels = async() => {
    try {
      const response = await client.query<any>({
        query: gql(`
          {
            channels {
              id,
              name
            }
          }
        `)
      });
    
      this.setState({ channels: response.data.channels });
    } catch (error) {
      console.log(error);
    }
  }

  onPostSent = (channel) => {
    this.setState({ showNewChannelModal: false });
    
    this.setState({ channels: [channel, ...this.state.channels]});
  }

  render() {
    return (
      <ScrollView contentContainerStyle={styles.page.container}
                  bounces={false}>
        <FlatList data={this.state.channels}
                  keyExtractor={(item) => item.id.toString()}
                  refreshControl={
                    <RefreshControl
                      refreshing={this.state.refreshing}
                      onRefresh={this.refresh}
                    />
                  }
                  renderItem={({item}) =>(
                    <TouchableOpacity style={styles.channel.container}
                                      onPress={() => this.props.navigation.navigate('TimelineScreen', { channel: item })}>
                      <Text style={styles.channel.channelTitle}>#{ item.name }</Text>
                    </TouchableOpacity>
        )}/>
        <ActionButton buttonColor={THEME.colors.secondary.default}
                      position="right"
                      hideShadow={true}
                      offsetY={10}
                      onPress={this.newChannel}
                      renderIcon={() => <FontAwesome name="plus" size={28} color={'#F5F5F5'}/>}/>
        <Modal isVisible={this.state.showNewChannelModal}
               avoidKeyboard={true}
               style={styles.page.newChannelModal}
               animationInTiming={400}
               animationOutTiming={400}>
               <NewChannelScreen navigation={this.props.navigation} 
                         onSuccess={this.onPostSent}
                         onDismiss={() => this.setState({ showNewChannelModal: false })}/>
        </Modal>
      </ScrollView>
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
  }),
  channel: StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      padding: 12,
      marginTop: 2
    },
    channelTitle: {
      fontSize: 22,
      fontWeight: 'bold'
    }
  })
};

interface ChannelsScreenState {
  channels: any[];
  refreshing: boolean;
  showNewChannelModal: boolean
}

interface ChannelsScreenProps {
  navigation: any;
}