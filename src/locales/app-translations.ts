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
            }
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
                genderEnum: {
                    gender: string;
                    male: string;
                    female: string;
                    other: string; 
                }
            }
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
            }
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
            buttons: {
                signOut: string;
            }
        }
    }
}
