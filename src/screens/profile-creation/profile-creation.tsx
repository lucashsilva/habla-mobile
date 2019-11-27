import React from "react";
import { Text, StyleSheet, View, SafeAreaView, StatusBar, Image, TextInput, TouchableOpacity, ActivityIndicator, Picker, ScrollView, Dimensions, Platform } from "react-native";
import { client } from "../../services/client";
import gql from "graphql-tag";
import THEME from "../../theme/theme";
import i18n from 'i18n-js';
import ChangePhotoComponent from '../../components/change-photo/change-photo'
import KeyboardSpacer from 'react-native-keyboard-spacer';
import { getTranslatedGenderFromEnum } from "../../util";
import { Ionicons } from '@expo/vector-icons';

export default class ProfileCreationScreen extends React.Component<any, any> {
  constructor(props: any) {
    super(props);

    let propsProfile;

    if (this.props.navigation.state.params && this.props.navigation.state.params.profile) {
      propsProfile = {
        name: this.props.navigation.state.params.profile.name
      };
    }

    this.state = {
      profile: propsProfile || {
        name: "",
        username: "",
        bio: "",
        website: "",
        phone: "",
        gender: ""
      },
      loading: false,
      expandGenderPicker: false
    };
  }

  submit = async () => {
    this.setState({ loading: true });

    try {
      const response = await client.mutate({
        variables: {
          profile: this.state.profile,
          photo: this.state.photo && this.state.photo.uri && this.state.photo.uri.startsWith('data') && this.state.photo.uri
        },
        mutation: gql(`
          mutation UpdateProfile ($profile: ProfileInput!, $photo: Upload) {
            updateProfile(profile: $profile, photo: $photo) {
              uid
            }
          }
        `)
      });

      this.props.navigation.navigate("TabsNavigator");
    } catch (error) {
      this.setState({ loading: false });
      const errorMessage = error.networkError? i18n.t('screens.profileCreation.errors.connection'):i18n.t('screens.profileCreation.errors.unexpected');
      this.setState({ errorMessage });
      console.log(JSON.stringify(error));
    }
  }

  changePhoto = async (profilePhoto) => {
    if (!profilePhoto) return; 
    
    this.setState({ photo: { uri: profilePhoto }});
  }

  render() {
    const photoDefault = require('../../../assets/avatar-placeholder.png');

    return (
      <SafeAreaView style={styles.AndroidSafeArea}> 
        <StatusBar barStyle="dark-content" />
        {this.state.errorMessage &&
          <View style={styles.page.error.errorView}>
            <Ionicons name="ios-sad" size={100} color="white" />
            <Text style={styles.page.error.errorText}>{this.state.errorMessage}</Text>
          </View>}
        <ScrollView style={styles.page.container.view}>
          <View>
            <View style={styles.page.header.row}>
              <View style={styles.page.header.left}>
                <Text style={styles.page.header.viewTitle}>
                  {i18n.t('screens.profileCreation.title')}
                </Text>
                <Text style={styles.page.header.viewSubtitle}>
                  {this.state.profile.name? i18n.t('screens.profileCreation.subtitleWithName', { name: this.state.profile.name }): i18n.t('screens.profileCreation.subtitle')}
                </Text>
              </View>
              <View style={styles.page.header.right}>
                <ChangePhotoComponent onPhotoSelected={this.changePhoto} enabled={!this.state.saving} squared>
                  <Image width={100} height={100} source={this.state.photo || photoDefault} style={styles.page.form.photo} />
                </ChangePhotoComponent>
              </View>
            </View>
          </View>
          <View style={styles.page.form.row}>
            <Text style={styles.page.form.label}>{i18n.t('screens.profileCreation.labels.name')}</Text>
            <TextInput style={styles.page.form.textInput}
              placeholder={i18n.t('screens.profileCreation.labels.name')}
              value={this.state.profile.name}
              onChangeText={text => this.setState({ profile: { ...this.state.profile, name: text } })}
              underlineColorAndroid="rgba(0, 0, 0, 0)"
              editable={!this.state.loading} />
          </View>

          <View style={styles.page.form.row}>
            <Text style={styles.page.form.label}>{i18n.t('screens.profileCreation.labels.username')}</Text>
            <TextInput style={styles.page.form.textInput}
              placeholder={i18n.t('screens.profileCreation.labels.username')}
              value={this.state.profile.username}
              onChangeText={text => this.setState({ profile: { ...this.state.profile, username: text } })}
              underlineColorAndroid="rgba(0, 0, 0, 0)"
              autoCapitalize="none"
              keyboardType="twitter"
              editable={!this.state.loading} />
          </View>

          <View style={styles.page.form.row}>
            <Text style={styles.page.form.label}>{i18n.t('screens.profileCreation.labels.bio')}</Text>
            <TextInput style={styles.page.form.textInput}
              placeholder={i18n.t('screens.profileCreation.labels.bio')}
              value={this.state.profile.bio}
              onChangeText={text => this.setState({ profile: { ...this.state.profile, bio: text } })}
              underlineColorAndroid="rgba(0, 0, 0, 0)"
              editable={!this.state.loading} />
          </View>

          <View style={styles.page.form.row}>
            <Text style={styles.page.form.label}>{i18n.t('screens.profileCreation.labels.website')}</Text>
            <TextInput style={styles.page.form.textInput}
              placeholder={i18n.t('screens.profileCreation.labels.website')}
              value={this.state.profile.website}
              onChangeText={text => this.setState({ profile: { ...this.state.profile, website: text } })}
              underlineColorAndroid="rgba(0, 0, 0, 0)"
              autoCapitalize="none"
              editable={!this.state.loading} />
          </View>

          <View style={styles.page.form.row}>
            <Text style={styles.page.form.label}>{i18n.t('screens.profileCreation.labels.phone')}</Text>
            <TextInput style={styles.page.form.textInput}
              placeholder={i18n.t('screens.profileCreation.labels.phone')}
              value={this.state.profile.phone}
              onChangeText={text => this.setState({ profile: { ...this.state.profile, phone: text } })}
              underlineColorAndroid="rgba(0, 0, 0, 0)"
              keyboardType="numeric"
              editable={!this.state.loading} />
          </View>

          <View style={styles.page.form.row}>
            <Text style={styles.page.form.label}>{i18n.t('global.enums.gender.gender')}</Text>
            <View style={styles.page.form.textInput}>
              {Platform.OS === 'ios' && <TouchableOpacity onPress={() => {Platform.OS === 'ios' && this.setState({ expandGenderPickerIOS: !this.state.expandGenderPickerIOS });}}>
                <Text style={{ fontSize: 18 }}>{ getTranslatedGenderFromEnum((this.state.profile.gender || 'MALE').toLowerCase()) }</Text>
              </TouchableOpacity>}
              {(Platform.OS === 'android' || this.state.expandGenderPickerIOS) && <Picker
                style={styles.page.form.picker}
                selectedValue={this.state.profile.gender}
                onValueChange={text => this.setState({ profile: { ...this.state.profile, gender: text } })}>

                <Picker.Item label={i18n.t('global.enums.gender.male')} value="MALE" />
                <Picker.Item label={i18n.t('global.enums.gender.female')} value="FEMALE"/>
                <Picker.Item label={i18n.t('global.enums.gender.other')} value="OTHER"/>
              </Picker>}
            </View>
          </View>

          <TouchableOpacity style={styles.page.form.submitButton}
            onPress={this.submit}
            disabled={this.state.loading}
            activeOpacity={1}>
            {this.state.loading ?
              (<ActivityIndicator color="white"
                size="small" />)
              : (<Text style={styles.page.form.submitButtonText}>{i18n.t('screens.profileCreation.buttons.next')}</Text>)}
          </TouchableOpacity>
          <KeyboardSpacer/>
        </ScrollView>
      </SafeAreaView>
    );
  }
}


const styles = {
  page: {
    container: StyleSheet.create({
      view: {
        padding: 16
      },
    }),
    error: StyleSheet.create({
      errorView: {
        padding: 20,
        backgroundColor: THEME.colors.error.default,
        justifyContent: 'center',
        alignItems: 'center'
      },
      errorText: {
        color: 'white',
        textAlign: 'center'
      }
    }),
    form: StyleSheet.create({
      row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 15,
        borderBottomColor: '#eee',
        borderBottomWidth: 1
      },
      label: {
        fontSize: 18,
        fontWeight: "bold"
      },
      photo: {
        width: 100,
        height: 100,
        borderRadius: 50
      },
      textInput: {
        width: "70%",
        fontSize: 18
      },
      picker: {
        flexGrow: 1,
        marginTop: -12
      },
      submitButton: {
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: THEME.colors.primary.default,
        width: '100%',
        borderRadius: 5,
        alignItems: "center",
        marginBottom: 30
      },
      submitButtonText: {
        fontSize: 18,
        textAlign: 'center',
        color: "#FFFFFF",
        fontWeight: "bold"
      },
      textChangePhoto: {
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 'bold',
        paddingVertical: 10
      }
    }),
    header: StyleSheet.create({
      row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        width: '100%'
      },
      viewTitle: {
        fontSize: 35,
        fontWeight: "bold",
        color: THEME.colors.primary.dark
      },
      viewSubtitle: {
        fontSize: 20,
        textAlign: 'justify'
      },
      right: {
        marginTop: 16,
        width: 100,
        height: 100
      },
      left: {
        width: Dimensions.get('screen').width - 150
      }
    })
  },
  AndroidSafeArea: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  }
};