import { AppTranslations } from "./app-translations";

const en: AppTranslations = {
    global: {
        user: {
            anonymousLabel: 'anonymous'
        },
        enums: {
            distance: {
                here: 'here',
                very_close: 'very close',
                close: 'close',
                far: 'far',
                very_far: 'very far'
            },
            gender: {
                gender: 'Gender',
                male: 'Male',
                female: 'Female',
                other: 'Other'
            }
        }
    },
    screens: {
        appLoading: {
            greeting: 'See what people are talking about in {{location}}!',
            locationNotAuthorized: {
                message: 'You need to allow access to your location information to use Habla.',
                buttons: {
                    openSettings: 'Open settings'
                }
            }
        },
        login: {
            buttons: {
                signInWithFacebook: 'Sign in with Facebook'
            }
        },
        profileCreation: {
            title: 'Profile',
            subtitle: "You're almost ready to start using Habla, {{name}}! Let's create your public profile.",
            labels: {
                name: 'Name',
                username: 'Username',
                bio: 'Bio',
                website: 'Website',
                phone: 'Phone',
            },
            buttons: {
                next: 'Next'
            }
        },
        timeline: {
            title: 'Timeline',
            errors: {
                fetchingPosts: {
                    unexpected: 'An unexpected error ocurred while loading the posts.',
                    connection: 'There was a problem loading the posts. Please check your connection.'
                }
            }
        },
        channels: {
            title: 'Channels'
        },
        newPost: {
            inputPlaceholder: "What's up?",
            buttons: {
                submit: 'Send'
            },
            errors: {
                insufficentScore: 'Insufficient score to make anonymous posts.'
            },
            anonymous: 'Anonymous'
        },

        newChannel: {
            inputPlaceholder: "#Channel"
        },

        notifications: {
            title: 'Notifications',
            notificationTypes: {
                commentOnOwnedPost: '{{username}} commented on your post'
            }
        },
        post: {
            title: 'Post',
            comments: {
                newCommentInputPlaceholder: 'Type a comment...',
                buttons: {
                    submit: 'Send'
                }
            }
        },
        profile: {
            title: 'Profile',
            changePhoto: {
                title: 'Change photo',
                option1: 'Camera',
                option2: 'Gallery',
                cancel: 'Cancel'
            },
            buttons: {
                signOut: 'Sign out',
                editProfile: 'Edit profile'
            },
            labels: {
                score: 'Score',
                scoreBalance: 'Score balance'
            }
        },
        profileEdition: {
            title: 'Edit profile',
            labels: {
                name: 'Name',
                username: 'Username',
                bio: 'Bio',
                website: 'Website',
                phone: 'Phone'
            },
            buttons: {
                save: 'Save'
            }
        }
    }
};

export default en;