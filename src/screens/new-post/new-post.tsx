import * as React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator, StatusBar } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Permissions, Location } from 'expo';
import { client } from '../../services/client';
import gql from 'graphql-tag';
import THEME from '../../theme/theme';
import i18n from 'i18n-js';
import { CheckBox } from 'react-native-elements';

export default class NewPostScreen extends React.Component<NewPostScreenProps, NewPostScreenState> {
  constructor(props: NewPostScreenProps) {
    super(props);

    this.state = { post: { body: null }, anonymous: false, posting: false };
  }

  componentWillMount() {
    this.resetPost();
  }

  handlePostInput = (text: string) => {
    this.setState({ post: { ...this.state.post, body: text } });
  }

  sendPost = async () => {
    this.setState({ posting: true });

    await Permissions.askAsync(Permissions.LOCATION);
    const location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });

    try {
      const response = await client.mutate({

        variables: {
          post: this.state.post,
          channelId: this.props.channel ? this.props.channel.id : null,
          anonymous: this.state.anonymous
        },
        mutation: gql(`
          mutation CreatePost ($channelId: ID, $post: PostInput!, $anonymous: Boolean) {
            createPost(channelId: $channelId, post: $post, anonymous: $anonymous) {
              id,
              body,
              distance,

              createdAt
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
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          }
        }
      });

      this.props.onSuccess && this.props.onSuccess(response.data.createPost);
    } catch (error) {
      if (error.graphQLErrors.find(e => e.code == 'INSUFFICENT_SCORE_ERROR')) {
        const errorMessage = i18n.t('screens.newPost.errors.insufficentScore');

        this.setState({ errorMessage });
        console.log(error);
      }
    }

    this.setState({ posting: false });
  }

  resetPost() {
    this.setState({
      post: {
        body: this.props.channel && `#${this.props.channel.name}`

      }
    });
  }

  dismiss = () => {
    this.props.onDismiss && this.props.onDismiss();
  }

  render() {
    return (
      <View style={styles.newPost.container}>
        <StatusBar hidden={true}></StatusBar>
        {this.state.errorMessage &&
          <View style={styles.newPost.errorView}>
            <Ionicons name="ios-sad" size={100} color="white" />
            <Text style={styles.newPost.errorText}>{this.state.errorMessage}</Text>
          </View>}
        <View style={styles.header.container}>
          <TouchableOpacity onPress={this.dismiss}>
            <FontAwesome name="chevron-left" size={35} color={THEME.colors.primary.default}></FontAwesome>
          </TouchableOpacity>
          <CheckBox
            title={i18n.t('screens.newPost.anonymous')}
            checked={this.state.anonymous}
            checkedColor={THEME.colors.primary.default}
            uncheckedColor={THEME.colors.primary.default}
            textStyle={styles.newPost.anonymousText}
            containerStyle={styles.newPost.anonymousButton}
            onPress={() => this.setState({ anonymous: !this.state.anonymous })}
          />
          <TouchableOpacity>
            <FontAwesome name="image" size={35} color={THEME.colors.primary.default}></FontAwesome>
          </TouchableOpacity>
        </View>
        <TextInput style={styles.newPost.input}
          onChangeText={this.handlePostInput}
          value={this.state.post.body}
          placeholderTextColor="white"
          placeholder={i18n.t('screens.newPost.inputPlaceholder')}
          editable={!this.state.posting}
          multiline={true}
          underlineColorAndroid="rgba(0,0,0,0)" />
        <TouchableOpacity style={styles.newPost.sendButton}
          onPress={this.sendPost}
          disabled={this.state.posting || !this.state.post.body || this.state.post.body.trim() == ''}
          activeOpacity={1}>
          {this.state.posting ? <ActivityIndicator color="white" /> : <Text style={styles.newPost.sendButtonText}>{i18n.t('screens.newPost.buttons.submit')}</Text>}
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
  newPost: StyleSheet.create({
    container: {
      backgroundColor: THEME.colors.secondary.light,
      flexGrow: 1,
    },
    anonymousButton: {
      backgroundColor: THEME.colors.secondary.light,
      borderWidth: 0
    },
    anonymousText:{
      color: 'white'
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
    }
  })
};

interface NewPostScreenState {
  posting: boolean;
  post: any;
  anonymous: boolean;
  errorMessage?: string;
}

interface NewPostScreenProps {
  navigation: any;
  onSuccess: Function;
  onDismiss: Function;
  channel: any;
}
