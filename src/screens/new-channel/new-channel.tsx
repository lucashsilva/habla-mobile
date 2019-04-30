import * as React from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, TextInput, ActivityIndicator} from 'react-native'
import { FontAwesome } from '@expo/vector-icons';
import THEME from '../../theme/theme';
import i18n from 'i18n-js';
import { client } from '../../services/client';
import gql from 'graphql-tag';

export default class NewChannelScreen extends React.Component<NewChannelScreenProps, NewChannelScreenState>{
    constructor(props: NewChannelScreenProps) {
        super(props);
    
        this.state = { channel: { name: null }, creating: false };
    }

    componentWillMount() {
        this.resetChannel();
    }

    dismiss = () => {
        this.props.onDismiss && this.props.onDismiss();
    }

    handleChannelInput = (text: string) => {
      text = text.trim().replace('#', '');
      
      this.setState({ channel: { ...this.state.channel, name: text }});
    }

    sendChannel = async() => {
        this.setState({ creating: true });
    
        try {
          const response = await client.mutate({
            variables: { 
              channel: this.state.channel
            },
            mutation: gql(`
              mutation CreateChannel ($channel: ChannelInput!) {
                createChannel(channel: $channel) {
                  id,
                  name
                }
              }
            `),
            context: {
            }
          });
    
          this.props.onSuccess && this.props.onSuccess(response.data.createChannel);
        } catch (error) {
          console.log(error);
        } 
    
        this.setState({ creating: false });
    }

      resetChannel() {
        this.setState({
          channel: {
            
          }
        });
      }

    render() {
        return (
            <View style={styles.newChannel.container}>
                <StatusBar hidden={true}></StatusBar>
                <View style={styles.header.container}>
                    <TouchableOpacity onPress={this.dismiss}>
                        <FontAwesome name="chevron-left" size={35} color={THEME.colors.primary.default}></FontAwesome>
                    </TouchableOpacity>
                </View>
                <TextInput style={styles.newChannel.input}
                  onChangeText={this.handleChannelInput}
                  value={this.state.channel.name && `#${this.state.channel.name}`}
                  placeholderTextColor="white"
                  placeholder={i18n.t('screens.newChannel.inputPlaceholder')}
                  editable={!this.state.creating}
                  multiline={true}
                  underlineColorAndroid="rgba(0,0,0,0)"/>
                <TouchableOpacity style={styles.newChannel.sendButton}
                        onPress={this.sendChannel}
                        disabled={this.state.creating || !this.state.channel.name || this.state.channel.name.trim() == ''}
                          activeOpacity={1}>
                     {this.state.creating? <ActivityIndicator color="white"/>: <Text style={styles.newChannel.sendButtonText}>{ i18n.t('screens.newPost.buttons.submit') }</Text>}
                </TouchableOpacity>
            </View>

        );
    }
}

const styles = {
    header: StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            justifyContent: 'space-between'
        }
    }),
    newChannel: StyleSheet.create({
        container: {
            backgroundColor: THEME.colors.secondary.light,
            flexGrow: 1,
        },
        input: {
            marginTop: 5,
            padding: 16,
            backgroundColor: THEME.colors.secondary.light,
            color: 'white',
            flex: 1,
            fontSize: 25,
            flexGrow: 1,
            fontWeight: "bold",
            textAlignVertical: "top"
          },
          sendButton: {
            paddingHorizontal: 16,
            paddingVertical: 16,
            backgroundColor: THEME.colors.primary.default,
            width: '100%',
          },
          sendButtonText: {
            fontSize: 18,
            textAlign: 'center',
            color: 'white',
            fontWeight: "bold"
          },
    })
}

interface NewChannelScreenProps{
    navigation: any;
    onSuccess: Function;
    onDismiss: Function;

}

interface NewChannelScreenState{
    creating: boolean;
    channel: any;
}