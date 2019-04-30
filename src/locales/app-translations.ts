import { Notifications } from "expo";

export interface AppTranslations {
    global: {
        user: {
            anonymousLabel: string;
        },
        enums: {
            distance: {
                here: string;
                very_close: string;
                close: string;
                far: string;
                very_far: string;
            },
            gender: {
                gender: string;
                male: string;
                female: string;
                other: string;
            };
        }
    },
    screens: {
        appLoading: {
            greeting: string;
            locationNotAuthorized: {
                message: string;
                buttons: {
                    openSettings: string;
                }
            }
        },
        login: {
            buttons: {
                signInWithFacebook: string;
            }
        },
        profileCreation: {
            title: string;
            subtitle: string;
            labels: {
                name: string;
                username: string;
                bio: string;
                website: string;
                phone: string;
            },
            buttons: {
                next: string
            }
        },
        timeline: {
            title: string;
            errors: { 
                fetchingPosts: {
                    unexpected: string;
                    connection: string;
                }
            }
        },
        channels: {
            title: string;
        },
        newPost: {
            inputPlaceholder: string;
            buttons: {
                submit: string;
            },
            errors: {
                insufficentScore: string;
            },
            anonymous: string;
            
        },
        notifications: {
            title: string;
            notificationTypes: {
                commentOnOwnedPost: string;
            }
        },
        post: {
            title: string;
            comments: {
                newCommentInputPlaceholder: string;
                buttons: {
                    submit: string;
                }
            }
        },
        profile: {
            title: string;
            changePhoto: {
                title: string;
                option1: string,
                option2: string,
                cancel: string
            },
            buttons: {
                signOut: string;
                editProfile: string;
            },
            labels: {
                score: string;
                scoreBalance: string;
            }
        },
        profileEdition: {
            title: string;
            labels: {
                name: string;
                username: string;
                bio: string;
                website: string;
                phone: string;
            },
            buttons: {
                save: string,
            }
        }
    }
}