// // src/context/SocketContext.js
// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { io } from 'socket.io-client';
// import { useQuery, useQueryClient } from '@tanstack/react-query';
// import toast from 'react-hot-toast';


// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// const SocketContext = createContext();

// export const SocketProvider = ({ children }) => {
//   const [socket, setSocket] = useState(null);
//   const { data: authUser } = useQuery({
//     queryKey: ['authUser']
//   });
//   const queryClient = useQueryClient();

//   useEffect(() => {
//     if (!authUser) return;

//     const token = localStorage.getItem('jwtToken');

//     // Connexion à Socket.IO avec le token dans les options
//     const socketInstance = io(`${API_URL}`, {
//       withCredentials: true,
//       auth: {
//         token: token // Ajouter le token JWT ici
//       },
//       // Ajouter extraHeaders pour les headers personnalisés
//       extraHeaders: {
//         Authorization: token ? `Bearer ${token}` : ''
//       }
//     });

//     socketInstance.on('connect', () => {
//       console.log('Connected to notification service, socket ID:', socketInstance.id);
//       console.log('Connecté au service de notification, ID socket:', socketInstance.id);
//       console.log('Authentification avec l\'ID utilisateur:', authUser._id);
//       socketInstance.emit('authenticate', authUser._id);
//       // Authentifier avec l'ID utilisateur
//       socketInstance.emit('authenticate', authUser._id);
//     });

//     // Écouter les nouvelles notifications
//     socketInstance.on('new-notification', (notification) => {
//       console.log('New notification received:', notification);
      
//       // Mettre à jour le cache de notifications
//       queryClient.setQueryData(['notifications'], (oldData) => {
//         // Si aucune donnée existante, créer un tableau avec la nouvelle notification
//         if (!oldData) return [notification];
        
//         // Sinon, ajouter au début du tableau existant
//         return [notification, ...oldData];
//       });
      
//       // Incrémenter le compteur de notifications non lues
//       queryClient.setQueryData(['unreadCount'], (oldData) => {
//         const count = oldData?.count || 0;
//         return { count: count + 1 };
//       });
      
//       // Afficher une notification toast
//       toast(
//         <div className="flex items-center space-x-2">
//           <img 
//             src={notification.from.profileImg || "/avatar-placeholder.png"} 
//             alt="User" 
//             className="w-10 h-10 rounded-full"
//           />
//           <div>
//             <p className="font-bold">@{notification.from.username}</p>
//             <p>{getNotificationText(notification)}</p>
//           </div>
//         </div>,
//         {
//           duration: 5000,
//           style: {
//             background: '#303030',
//             color: '#fff',
//             border: '1px solid #404040'
//           },
//           icon: '🔔'
//         }
//       );
//     });

//     // Écouter d'autres événements de notification
//     socketInstance.on('notifications-cleared', () => {
//       queryClient.setQueryData(['notifications'], []);
//       queryClient.setQueryData(['unreadCount'], { count: 0 });
//     });
    
//     socketInstance.on('all-notifications-read', () => {
//       queryClient.setQueryData(['unreadCount'], { count: 0 });
      
//       // Mettre à jour le statut "read" de toutes les notifications
//       queryClient.setQueryData(['notifications'], (oldData) => {
//         if (!oldData) return [];
//         return oldData.map(notif => ({ ...notif, read: true }));
//       });
//     });

//     socketInstance.on('disconnect', () => {
//       console.log('Disconnected from notification service');
//     });

//     socketInstance.on('connect_error', (error) => {
//       console.error('Socket connection error:', error);
//     });

//     setSocket(socketInstance);

//     // Nettoyage lors du démontage
//     return () => {
//       if (socketInstance) {
//         socketInstance.disconnect();
//       }
//     };
//   }, [authUser, queryClient]);

//   // Fonction pour générer le texte de notification en fonction du type
//   const getNotificationText = (notification) => {
//     switch (notification.type) {
//       case "like":
//         return "liked your post";
//       case "comment":
//         return "commented on your post";
//       case "repost":
//         return "reposted your post";
//       case "bookmarked":
//         return "bookmarked your post";
//       default:
//         return "interacted with your content";
//     }
//   };
//   return (
//     <SocketContext.Provider value={{ socket }}>
//       {children}
//     </SocketContext.Provider>
//   );
// };

// export const useSocket = () => useContext(SocketContext);


// src/context/SocketContext.js
// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { io } from 'socket.io-client';
// import { useQuery, useQueryClient } from '@tanstack/react-query';
// import toast from 'react-hot-toast';
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// // Import a notification sound
// const notificationSound = '/notif.wav';

// const SocketContext = createContext();

// export const SocketProvider = ({ children }) => {
//   const [socket, setSocket] = useState(null);
//   const [notificationAudio] = useState(new Audio(notificationSound));
//   const [canPlaySound, setCanPlaySound] = useState(false);
//   const { data: authUser } = useQuery({
//     queryKey: ['authUser']
//   });
//   const queryClient = useQueryClient();


//   useEffect(() => {
//     // Ajouter un écouteur global pour la première interaction
//     const enableSound = () => {
//       setCanPlaySound(true);
//       // Supprimer l'écouteur après la première interaction
//       document.removeEventListener('click', enableSound);
//     };

//     document.addEventListener('click', enableSound);

//     return () => {
//       document.removeEventListener('click', enableSound);
//     };
//   }, []);


//   useEffect(() => {
//     if (!authUser) return;

//     const token = localStorage.getItem('jwtToken');

//     // Connexion à Socket.IO avec le token dans les options
//     const socketInstance = io(`${API_URL}`, {
//       withCredentials: true,
//       auth: {
//         token: token // Ajouter le token JWT ici
//       },
//       // Ajouter extraHeaders pour les headers personnalisés
//       extraHeaders: {
//         Authorization: token ? `Bearer ${token}` : ''
//       }
//     });

//     socketInstance.on('connect', () => {
//       console.log('Connected to notification service, socket ID:', socketInstance.id);
//       // Authentifier avec l'ID utilisateur
//       socketInstance.emit('authenticate', authUser._id);
//     });

//     const notificationAudio = new Audio(notificationSound);
//     notificationAudio.volume = 0.5; // Réglez le volume

//     socketInstance.on('new-notification', (notification) => {
//       console.log('Tentative de lecture du son');
      
//       notificationAudio.play()
//         .then(() => console.log('Son joué avec succès'))
//         .catch((error) => {
//           console.error('Erreur de lecture du son:', error);
//           console.log('Type d\'erreur:', error.name);
//           console.log('Message d\'erreur:', error.message);
//         });
//     });

//     const playNotificationSound = () => {
//       // Demander la lecture audio lors d'un événement utilisateur
//       document.addEventListener('click', () => {
//         notificationAudio.play()
//           .then(() => console.log('Son initialisé'))
//           .catch(error => console.error('Erreur:', error));
//       }, { once: true });
//     };

//     // Écouter les nouvelles notifications
//     socketInstance.on('new-notification', (notification) => {
//       console.log('New notification received:', notification);
      
//       // Jouer le son de notification
//       try {
//         notificationAudio.play().catch(error => {
//           console.warn('Error playing notification sound:', error);
//         });
//       } catch (error) {
//         console.error('Failed to play notification sound:', error);
//       }
      
//       // Mettre à jour le cache de notifications
//       queryClient.setQueryData(['notifications'], (oldData) => {
//         // Si aucune donnée existante, créer un tableau avec la nouvelle notification
//         if (!oldData) return [notification];
        
//         // Sinon, ajouter au début du tableau existant
//         return [notification, ...oldData];
//       });
      
//       // Incrémenter le compteur de notifications non lues
//       queryClient.setQueryData(['unreadCount'], (oldData) => {
//         const count = oldData?.count || 0;
//         return { count: count + 1 };
//       });
      
//       // Afficher une notification toast
//       toast(
//         <div className="flex items-center space-x-2">
//           <img 
//             src={notification.from.profileImg || "/avatar-placeholder.png"} 
//             alt="User" 
//             className="w-10 h-10 rounded-full"
//           />
//           <div>
//             <p className="font-bold">@{notification.from.username}</p>
//             <p>{getNotificationText(notification)}</p>
//           </div>
//         </div>,
//         {
//           duration: 5000,
//           style: {
//             background: '#303030',
//             color: '#fff',
//             border: '1px solid #404040'
//           },
//           icon: '🔔'
//         }
//       );
//     });

//     // Écouter d'autres événements de notification
//     socketInstance.on('notifications-cleared', () => {
//       queryClient.setQueryData(['notifications'], []);
//       queryClient.setQueryData(['unreadCount'], { count: 0 });
//     });
    
//     socketInstance.on('all-notifications-read', () => {
//       queryClient.setQueryData(['unreadCount'], { count: 0 });
      
//       // Mettre à jour le statut "read" de toutes les notifications
//       queryClient.setQueryData(['notifications'], (oldData) => {
//         if (!oldData) return [];
//         return oldData.map(notif => ({ ...notif, read: true }));
//       });
//     });

//     socketInstance.on('disconnect', () => {
//       console.log('Disconnected from notification service');
//     });

//     socketInstance.on('connect_error', (error) => {
//       console.error('Socket connection error:', error);
//     });

//     setSocket(socketInstance);

//     // Nettoyage lors du démontage
//     return () => {
//       if (socketInstance) {
//         socketInstance.disconnect();
//       }
//     };
//   }, [authUser, queryClient, notificationAudio]);

//   // Fonction pour générer le texte de notification en fonction du type
//   const getNotificationText = (notification) => {
//     switch (notification.type) {
//       case "like":
//         return "liked your post";
//       case "comment":
//         return "commented on your post";
//       case "repost":
//         return "reposted your post";
//       case "bookmarked":
//         return "bookmarked your post";
//       default:
//         return "interacted with your content";
//     }
//   };

//   return (
//     <SocketContext.Provider value={{ socket }}>
//       {children}
//     </SocketContext.Provider>
//   );
// };

// export const useSocket = () => useContext(SocketContext);



// src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Import a notification sound
const notificationSound = '/notif.wav';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notificationAudio] = useState(new Audio(notificationSound));
  const [canPlaySound, setCanPlaySound] = useState(false);
  const { data: authUser } = useQuery({
    queryKey: ['authUser']
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    // Ajouter un écouteur global pour la première interaction
    const enableSound = () => {
      setCanPlaySound(true);
      // Supprimer l'écouteur après la première interaction
      document.removeEventListener('click', enableSound);
    };

    document.addEventListener('click', enableSound);

    return () => {
      document.removeEventListener('click', enableSound);
    };
  }, []);

  useEffect(() => {
    if (!authUser) return;

    const token = localStorage.getItem('jwtToken');

    // Connexion à Socket.IO avec le token dans les options
    const socketInstance = io(`${API_URL}`, {
      withCredentials: true,
      auth: {
        token: token // Ajouter le token JWT ici
      },
      // Ajouter extraHeaders pour les headers personnalisés
      extraHeaders: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });

    socketInstance.on('connect', () => {
      console.log('Connected to notification service, socket ID:', socketInstance.id);
      // Authentifier avec l'ID utilisateur
      socketInstance.emit('authenticate', authUser._id);
    });

    // Configurer l'audio de notification
    notificationAudio.volume = 0.5;

    // Écouter les nouvelles notifications
    socketInstance.on('new-notification', (notification) => {
      console.log('New notification received:', notification);
      
      // Jouer le son de notification si autorisé
      if (canPlaySound) {
        try {
          const playPromise = notificationAudio.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => console.log('Son joué avec succès'))
              .catch((error) => {
                if (error.name === 'NotAllowedError') {
                  console.warn('Lecture audio bloquée. Interaction utilisateur requise.');
                } else {
                  console.error('Erreur de lecture du son:', error);
                }
              });
          }
        } catch (error) {
          console.error('Échec de lecture du son de notification:', error);
        }
      }
      
      // Mettre à jour le cache de notifications
      queryClient.setQueryData(['notifications'], (oldData) => {
        // Si aucune donnée existante, créer un tableau avec la nouvelle notification
        if (!oldData) return [notification];
        
        // Sinon, ajouter au début du tableau existant
        return [notification, ...oldData];
      });
      
      // Incrémenter le compteur de notifications non lues
      queryClient.setQueryData(['unreadCount'], (oldData) => {
        const count = oldData?.count || 0;
        return { count: count + 1 };
      });
      
      // Afficher une notification toast
      toast(
        <div className="flex items-center space-x-2">
          <img 
            src={notification.from.profileImg || "/avatar-placeholder.png"} 
            alt="User" 
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="font-bold">@{notification.from.username}</p>
            <p>{getNotificationText(notification)}</p>
          </div>
        </div>,
        {
          duration: 5000,
          style: {
            background: '#303030',
            color: '#fff',
            border: '1px solid #404040'
          },
          icon: '🔔'
        }
      );
    });

    // Écouter d'autres événements de notification
    socketInstance.on('notifications-cleared', () => {
      queryClient.setQueryData(['notifications'], []);
      queryClient.setQueryData(['unreadCount'], { count: 0 });
    });
    
    socketInstance.on('all-notifications-read', () => {
      queryClient.setQueryData(['unreadCount'], { count: 0 });
      
      // Mettre à jour le statut "read" de toutes les notifications
      queryClient.setQueryData(['notifications'], (oldData) => {
        if (!oldData) return [];
        return oldData.map(notif => ({ ...notif, read: true }));
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from notification service');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(socketInstance);

    // Nettoyage lors du démontage
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [authUser, queryClient, notificationAudio, canPlaySound]);

  // Fonction pour générer le texte de notification en fonction du type
  const getNotificationText = (notification) => {
    switch (notification.type) {
      case "like":
        return "liked your post";
      case "comment":
        return "commented on your post";
      case "repost":
        return "reposted your post";
      case "bookmarked":
        return "bookmarked your post";
      default:
        return "interacted with your content";
    }
  };

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);