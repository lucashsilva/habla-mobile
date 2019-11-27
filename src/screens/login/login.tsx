import * as React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput } from "react-native";
import KeyboardSpacer from 'react-native-keyboard-spacer';
import firebase from 'firebase';
import * as Facebook from "expo-facebook";
import { FontAwesome } from '@expo/vector-icons';
import THEME from "../../theme/theme";
import i18n from 'i18n-js';
import { Ionicons } from '@expo/vector-icons';

export default class LoginScreen extends React.Component<{}, LoginState> {
    static navigationOptions = {
        header: null
    };

    constructor(props) {
        super(props);

        this.state = { loggingInWithCredentials: false, loggingInWithFacebook: false, credentials: {} };
    }

    render() {
        return (
            <View style={styles.page.container}>
                <Text style={styles.login.headerText}>Habla!</Text>
                <TextInput placeholder={i18n.t('screens.login.inputs.email.placeholder')}
                    style={styles.login.input}
                    editable={!(this.state.loggingInWithCredentials || this.state.loggingInWithFacebook)}
                    underlineColorAndroid='rgba(0,0,0,0)'
                    autoCapitalize="none"
                    onChangeText={text => this.setState({ credentials: { ...this.state.credentials, email: text } })}></TextInput>
                <TextInput placeholder={i18n.t('screens.login.inputs.password.placeholder')}
                    style={styles.login.input}
                    editable={!(this.state.loggingInWithCredentials || this.state.loggingInWithFacebook || this.state.signingUpWithCredentials)}
                    secureTextEntry={true}
                    onChangeText={text => this.setState({ credentials: { ...this.state.credentials, password: text } })}></TextInput>
                <View style={styles.login.signInSignUpButtonsView}>
                    <TouchableOpacity style={styles.login.loginButton}
                        onPress={this.signInWithEmailAndPassword}
                        disabled={this.state.loggingInWithCredentials || this.state.loggingInWithFacebook || this.state.signingUpWithCredentials}
                        activeOpacity={1}>
                        {this.state.loggingInWithCredentials ?
                            (<ActivityIndicator color="white"
                                size="small" />)
                            : (<Text style={styles.login.loginButtonText}>{i18n.t('screens.login.buttons.signInWithCredentials')}</Text>)}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.login.signUpButton}
                        onPress={this.signUpWithEmailAndPassword}
                        disabled={this.state.signingUpWithCredentials || this.state.loggingInWithFacebook || this.state.signingUpWithCredentials}
                        activeOpacity={1}>
                        {this.state.signingUpWithCredentials ?
                            (<ActivityIndicator color="white"
                                size="small" />)
                            : (<Text style={styles.login.loginButtonText}>{i18n.t('screens.login.buttons.signUpWithCredentials')}</Text>)}
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.login.loginButtonFacebook}
                    onPress={this.signInWithFacebook}
                    disabled={this.state.loggingInWithCredentials || this.state.loggingInWithFacebook || this.state.signingUpWithCredentials}
                    activeOpacity={1}>
                    {this.state.loggingInWithFacebook ?
                        (<ActivityIndicator color="white"
                            size="small" />)
                        : (<View style={styles.login.loginButtonInnerView}>
                            <FontAwesome name="facebook" style={styles.login.facebookIcon} /><Text style={styles.login.loginButtonText}>{i18n.t('screens.login.buttons.signInWithFacebook')}</Text>
                        </View>)}
                </TouchableOpacity>
                <View style={styles.page.errorView}>
                    {this.state.errorMessage && <Text style={styles.page.errorText}>{this.state.errorMessage}</Text>}
                </View>
                <KeyboardSpacer />
            </View>
        )
    }

    signInWithEmailAndPassword = async () => {
        this.setState({ loggingInWithCredentials: true });

        try {
            await firebase.auth().signInWithEmailAndPassword(this.state.credentials.email, this.state.credentials.password);
        } catch (error) {
            this.setState({ loggingInWithCredentials: false });
            const errorMessage = i18n.t('screens.login.errors.signInWithCredentials');
            this.setState({ errorMessage });
            console.log(JSON.stringify(error));
        }
    };

    signUpWithEmailAndPassword = async () => {
        this.setState({ signingUpWithCredentials: true });

        try {
            await firebase.auth().createUserWithEmailAndPassword(this.state.credentials.email, this.state.credentials.password);
        } catch (error) {
            this.setState({ signingUpWithCredentials: false });
            const errorMessage = i18n.t('screens.login.errors.signUpWithCredentials');
            this.setState({ errorMessage });
            console.log(JSON.stringify(error));
        }
    };

    signInWithFacebook = async () => {
        this.setState({ loggingInWithFacebook: true });

        try {
            const result = await Facebook.logInWithReadPermissionsAsync('2136539466408117');
            const credential = firebase.auth.FacebookAuthProvider.credential(result.token);

            await firebase.auth().signInAndRetrieveDataWithCredential(credential);
        } catch (error) {
            const errorMessage = i18n.t('screens.login.errors.signInWithFacebook');
            this.setState({ errorMessage });
            console.log(JSON.stringify(error));
        } finally {
            this.setState({ loggingInWithFacebook: false });
        }
    }
}

interface LoginState {
    loggingInWithCredentials?: boolean;
    loggingInWithFacebook?: boolean;
    signingUpWithCredentials?: boolean;
    credentials?: { email?: string, password?: string };
    errorMessage?: string;
}

const styles = {
    page: StyleSheet.create({
        container: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
            padding: 12
        },
        errorView: {
            justifyContent: 'center',
            alignItems: 'center',
            height: 60,
            width: '100%'
        },
        errorText: {
            textAlign: 'center'
        }
    }),
    login: StyleSheet.create({
        headerText: {
            fontSize: 50,
            marginBottom: 10,
            color: THEME.colors.primary.default
        },
        input: {
            width: '100%',
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 14,
            paddingVertical: 14,
            marginBottom: 10,
            fontSize: 18,
        },
        loginButton: {
            paddingHorizontal: 14,
            paddingVertical: 14,
            backgroundColor: THEME.colors.primary.default,
            width: '48%',
            borderRadius: 5,
            alignItems: "center",
            marginBottom: 12,
        },
        signUpButton: {
            paddingHorizontal: 14,
            paddingVertical: 14,
            backgroundColor: THEME.colors.secondary.default,
            width: '48%',
            borderRadius: 5,
            alignItems: "center",
            marginBottom: 12
        },
        loginButtonFacebook: {
            paddingHorizontal: 14,
            paddingVertical: 14,
            backgroundColor: "#4267b2",
            width: '100%',
            borderRadius: 5,
            alignItems: "center"
        },
        facebookIcon: {
            color: "#ffffff",
            fontSize: 18,
            marginRight: 10
        },
        loginButtonText: {
            fontSize: 18,
            textAlign: 'center',
            color: "#FFFFFF",
            fontWeight: "bold"
        },
        loginButtonInnerView: {
            flexDirection: "row"
        },
        signInSignUpButtonsView: {
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%"
        }
    })
}