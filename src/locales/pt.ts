import { AppTranslations } from "./app-translations";

const pt: AppTranslations = {
    global: {
        user: {
            anonymousLabel: 'anônimo'
        },
        enums: {
            distance: {
                here: 'aqui',
                very_close: 'muito perto',
                close: 'perto',
                far: 'longe',
                very_far: 'muito longe'
            }
        }
    },
    screens: {
        appLoading: {
            greeting: 'Saiba o que está em alta em {{location}}!',
            locationNotAuthorized: {
                message: 'Você precisa permitir o acesso à sua localização para usar o Habla.',
                buttons: {
                    openSettings: 'Abrir configurações'
                }
            }
        },
        login: {
            buttons: {
                signInWithFacebook: 'Entrar com o Facebook'
            }
        },
        profileCreation: {
            title: 'Perfil',
            subtitle: "Você está quase lá, {{name}}! Vamos criar o seu perfil público.",
            buttons: {
                next: 'Continuar'
            }
        },
        timeline: {
            title: 'Linha do tempo',
            errors: { 
                fetchingPosts: {
                    unexpected: 'Um erro inesperado ocorreu ao carregar os posts.',
                    connection: 'Houve um erro de conexão ao carregar os posts. Verifique se está conectado à internet.'
                }
            }
        },
        channels: {
            title: 'Canais'
        },
        newPost: {
            inputPlaceholder: "O que está acontecendo?",
            buttons: {
                submit: 'Enviar'
            }
        },
        newChannel: {
            inputPlaceholder: "Insira o nome do canal...",
        },
        notifications: {
            title: 'Notificações',
            notificationTypes: {
                commentOnOwnedPost: '{{username}} comentou na sua publicação'
            }
        },
        post: {
            title: 'Publicação',
            comments: {
                newCommentInputPlaceholder: 'Escreva um comentário...',
                buttons: {
                    submit: 'Enviar'
                }
            }
        },
        profile: {
            title: 'Perfil',
            buttons: {
                signOut: 'Sair'
            }
        }
    }
};

export default pt;