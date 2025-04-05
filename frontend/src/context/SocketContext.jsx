// // src/context/SocketContext.js
// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { io } from 'socket.io-client';
// import { useQuery, useQueryClient } from '@tanstack/react-query';
// import toast from 'react-hot-toast';
// import { useNavigate } from 'react-router-dom';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// // Import notification sound
// const notificationSound = '/notif.wav';
// // Import message sound
// const messageSound = '/message.wav';

// const SocketContext = createContext();

// export const SocketProvider = ({ children }) => {
//   const [socket, setSocket] = useState(null);
//   const [notificationAudio] = useState(new Audio(notificationSound));
//   const [messageAudio] = useState(new Audio(messageSound));
//   const [canPlaySound, setCanPlaySound] = useState(false);
//   const [onlineUsers, setOnlineUsers] = useState([]);
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
//       },
//       query: {
//         userId: authUser._id // Ajouter l'ID utilisateur comme paramètre de requête
//       }
//     });

//     socketInstance.on('connect', () => {
//       console.log('Connected to socket service, socket ID:', socketInstance.id);
//       // Authentifier avec l'ID utilisateur
//       socketInstance.emit('authenticate', authUser._id);
//     });

//     // Configurer l'audio de notification et de message
//     notificationAudio.volume = 0.5;
//     messageAudio.volume = 0.5;

//     // Écouter pour la liste des utilisateurs en ligne
//     socketInstance.on('getOnlineUsers', (users) => {
//       console.log('Online users:', users);
//       setOnlineUsers(users);
//     });

//     // NOTIFICATIONS HANDLERS
//     // Écouter les nouvelles notifications
//     socketInstance.on('new-notification', (notification) => {
//       console.log('New notification received:', notification);
      
//       // Jouer le son de notification si autorisé
//       if (canPlaySound) {
//         try {
//           const playPromise = notificationAudio.play();
          
//           if (playPromise !== undefined) {
//             playPromise
//               .then(() => console.log('Son de notification joué avec succès'))
//               .catch((error) => {
//                 if (error.name === 'NotAllowedError') {
//                   console.warn('Lecture audio bloquée. Interaction utilisateur requise.');
//                 } else {
//                   console.error('Erreur de lecture du son:', error);
//                 }
//               });
//           }
//         } catch (error) {
//           console.error('Échec de lecture du son de notification:', error);
//         }
//       }
      
//       // Mettre à jour le cache de notifications
//       queryClient.setQueryData(['notifications'], (oldData) => {
//         // Si aucune donnée existante, créer un tableau avec la nouvelle notification
//         if (!oldData) return [notification];
        
//         // Vérifier si la notification existe déjà pour éviter les doublons
//         const notificationExists = oldData.some(n => n._id === notification._id);
//         if (notificationExists) return oldData;
        
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
//         <div 
//           className="flex items-center space-x-2 cursor-pointer" 
//           onClick={() => {
//             if (notification.type === 'message') {
//               window.location.href = `/messages/${notification.from._id}`;
//             } else if (notification.post) {
//               window.location.href = `/post/${notification.post}`;
//             }
//           }}
//         >
//           <img 
//             src={notification.from.profileImg || "/avatar-placeholder.png"} 
//             alt="User" 
//             className="w-10 h-10 rounded-full"
//           />
//           <div>
//             <p className="font-bold">@{notification.from.username}</p>
//             <p>{getNotificationText(notification)}</p>
//             {notification.type === 'message' && notification.message && (
//               <p className="text-gray-300 text-sm italic">"{notification.message}"</p>
//             )}
//           </div>
//         </div>,
//         {
//           duration: 5000,
//           style: {
//             background: '#303030',
//             color: '#fff',
//             border: '1px solid #404040'
//           },
//           icon: notification.type === 'message' ? '💬' : '🔔'
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

//     // MESSAGING HANDLERS
//     // Écouter les nouveaux messages
//     socketInstance.on('newMessage', (message) => {
//       console.log('New message received:', message);
      
//       // Jouer le son de message si autorisé
//       if (canPlaySound) {
//         try {
//           const playPromise = messageAudio.play();
          
//           if (playPromise !== undefined) {
//             playPromise
//               .then(() => console.log('Son de message joué avec succès'))
//               .catch((error) => {
//                 if (error.name === 'NotAllowedError') {
//                   console.warn('Lecture audio bloquée. Interaction utilisateur requise.');
//                 } else {
//                   console.error('Erreur de lecture du son de message:', error);
//                 }
//               });
//           }
//         } catch (error) {
//           console.error('Échec de lecture du son de message:', error);
//         }
//       }
      
//       // Mettre à jour le cache de messages pour la conversation correspondante
//       queryClient.setQueryData(['messages', message.senderId], (oldData) => {
//         // Si aucune donnée existante, créer un tableau avec le nouveau message
//         if (!oldData) return [message];
        
//         // Vérifier si le message existe déjà pour éviter les doublons
//         const messageExists = oldData?.some(msg => msg._id === message._id);
//         if (messageExists) return oldData;
        
//         // Sinon, ajouter à la fin du tableau existant
//         return [...(oldData || []), message];
//       });
      
//       // Force invalidation du cache des messages pour garantir la mise à jour de l'interface
//       queryClient.invalidateQueries(['messages', message.senderId]);
      
//       // Vérifier si nous sommes déjà dans la conversation avec l'expéditeur
//       const currentChatId = window.location.pathname.includes('/messages/') 
//         ? window.location.pathname.split('/messages/')[1]
//         : null;
        
//       // Afficher une notification toast uniquement si nous ne sommes pas déjà en train de discuter
//       if (currentChatId !== message.senderId) {
//         toast(
//           <div 
//             className="flex items-center space-x-2 cursor-pointer" 
//             onClick={() => window.location.href = `/messages/${message.senderId}`}
//           >
//             <img 
//               src={message.senderProfileImg || "/avatar-placeholder.png"} 
//               alt="User" 
//               className="w-10 h-10 rounded-full"
//             />
//             <div>
//               <p className="font-bold">{message.senderUsername || 'Utilisateur'}</p>
//               <p className="truncate max-w-xs">{message.message}</p>
//             </div>
//           </div>,
//           {
//             duration: 5000,
//             style: {
//               background: '#303030',
//               color: '#fff',
//               border: '1px solid #404040'
//             },
//             icon: '💬'
//           }
//         );
//       }
//     });

//     socketInstance.on('disconnect', () => {
//       console.log('Disconnected from socket service');
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
//   }, [authUser, queryClient, notificationAudio, messageAudio, canPlaySound]);

//   // Fonction pour générer le texte de notification en fonction du type
//   const getNotificationText = (notification) => {
//     switch (notification.type) {
//       case "like":
//         return "a aimé votre post";
//       case "comment":
//         return "a commenté votre post";
//       case "follow":
//         return "a commencé à vous suivre";
//       case "repost":
//         return "a repartagé votre post";
//       case "bookmarked":
//         return "a ajouté votre post aux favoris";
//       case "message":
//         return "vous a envoyé un message";
//       default:
//         return "a interagi avec votre contenu";
//     }
//   };

//   return (
//     <SocketContext.Provider value={{ socket, onlineUsers }}>
//       {children}
//     </SocketContext.Provider>
//   );
// };

// export const useSocket = () => useContext(SocketContext);


import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Import notification sound
const notificationSound = '/notif.wav';
// Import message sound
const messageSound = '/message.mp3';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notificationAudio] = useState(new Audio(notificationSound));
  const [messageAudio] = useState(new Audio(messageSound));
  const [canPlaySound, setCanPlaySound] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { data: authUser } = useQuery({
    queryKey: ['authUser']
  });
  const queryClient = useQueryClient();

  // Précharger les sons
  useEffect(() => {
    const preloadAudio = () => {
      notificationAudio.load();
      messageAudio.load();
    };
    preloadAudio();
  }, [notificationAudio, messageAudio]);

  // Activer les sons après interaction utilisateur
  useEffect(() => {
    const enableSound = () => {
      setCanPlaySound(true);
      document.removeEventListener('click', enableSound);
    };

    document.addEventListener('click', enableSound);

    return () => {
      document.removeEventListener('click', enableSound);
    };
  }, []);

  // Fonction sécurisée pour jouer un son
  const playSoundSafely = useCallback((audio) => {
    if (canPlaySound) {
      try {
        audio.currentTime = 0;
        audio.play().catch(error => console.error(`Erreur lecture son: ${error}`));
      } catch (error) {
        console.error(`Erreur lors de la lecture du son: ${error}`);
      }
    }
  }, [canPlaySound]);

  // Fonction générique pour afficher un toast de message
  const showMessageToast = useCallback((sender, message, onClick) => {
    toast(
      <div 
        className="flex items-center space-x-2 cursor-pointer" 
        onClick={onClick}
      >
        <img 
          src={sender.profileImg || "/avatar-placeholder.png"} 
          alt={sender.username || 'User'} 
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="font-bold">@{sender.username || 'Utilisateur'}</p>
          <p className="truncate max-w-xs">{message || 'Vous a envoyé un message'}</p>
        </div>
      </div>,
      {
        duration: 7000,
        style: {
          background: '#303030',
          color: '#fff',
          border: '1px solid #404040',
          padding: '12px'
        },
        icon: '💬'
      }
    );
  }, []);

  // Fonction pour générer le texte de notification
  const getNotificationText = useCallback((notification) => {
    switch (notification.type) {
      case "like": return "a aimé votre post";
      case "comment": return "a commenté votre post";
      case "follow": return "a commencé à vous suivre";
      case "repost": return "a repartagé votre post";
      case "bookmarked": return "a ajouté votre post aux favoris";
      case "message": return "vous a envoyé un message";
      default: return "a interagi avec votre contenu";
    }
  }, []);

  // Configuration et gestion du socket
  useEffect(() => {
    if (!authUser) return;

    const token = localStorage.getItem('jwtToken');

    // Connexion à Socket.IO avec des options avancées
    const socketInstance = io(`${API_URL}`, {
      withCredentials: true,
      auth: { token },
      extraHeaders: {
        Authorization: token ? `Bearer ${token}` : ''
      },
      query: {
        userId: authUser._id
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Configuration initiale des écouteurs de socket
    const setupSocketListeners = () => {
      // Configuration des volumes audio
      notificationAudio.volume = 0.7;
      messageAudio.volume = 0.7;

      // Gestion des utilisateurs en ligne
      socketInstance.on('getOnlineUsers', (users) => {
        console.log('Utilisateurs en ligne:', users);
        setOnlineUsers(users);
      });

      // Gestion des notifications
      socketInstance.on('new-notification', (notification) => {
        console.log('Nouvelle notification:', notification);
        
        // Notifications de message
        if (notification.type === 'message') {
          playSoundSafely(messageAudio);
          
          const currentPath = window.location.pathname;
          const inConversation = currentPath.includes(`/messages/${notification.from._id}`);
          
          if (!inConversation) {
            showMessageToast(
              notification.from, 
              notification.message, 
              () => window.location.href = `/messages/${notification.from._id}`
            );
          }
          
          return;
        }
        
        // Autres types de notifications
        playSoundSafely(notificationAudio);
        
        // Mettre à jour le cache de notifications
        queryClient.setQueryData(['notifications'], (oldData = []) => {
          const exists = oldData.some(n => n._id === notification._id);
          return exists ? oldData : [notification, ...oldData];
        });
        
        // Incrémenter le compteur de notifications non lues
        queryClient.setQueryData(['unreadCount'], (oldData = { count: 0 }) => ({
          count: (oldData.count || 0) + 1
        }));
        
        // Toast pour les autres types de notifications
        toast(
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => {
              if (notification.post) {
                window.location.href = `/post/${notification.post}`;
              } else if (notification.type === 'follow') {
                window.location.href = `/profile/${notification.from.username}`;
              }
            }}
          >
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
            duration: 7000,
            style: {
              background: '#303030',
              color: '#fff',
              border: '1px solid #404040',
              padding: '12px'
            },
            icon: '🔔'
          }
        );
      });

      // Gestion des événements de notification
      socketInstance.on('notifications-cleared', () => {
        queryClient.setQueryData(['notifications'], []);
        queryClient.setQueryData(['unreadCount'], { count: 0 });
      });
      
      socketInstance.on('all-notifications-read', () => {
        queryClient.setQueryData(['unreadCount'], { count: 0 });
        queryClient.setQueryData(['notifications'], (oldData = []) => 
          oldData ? oldData.map(notif => ({ ...notif, read: true })) : []
        );
      });

      // Gestion des messages
      socketInstance.on('newMessage', (message) => {
        console.log('Nouveau message:', message);
        
        // Mettre à jour le cache des messages
        queryClient.setQueryData(['messages', message.senderId], (oldData = []) => {
          const exists = oldData.some(msg => msg._id === message._id);
          return exists ? oldData : [...oldData, message];
        });
        
        // Forcer le rafraîchissement des messages
        queryClient.invalidateQueries(['messages', message.senderId]);
        
        // Gestion des notifications de message
        const currentPath = window.location.pathname;
        const inConversation = currentPath.includes(`/messages/${message.senderId}`);
        
        if (!inConversation) {
          playSoundSafely(messageAudio);
          
          showMessageToast(
            {
              profileImg: message.senderProfileImg,
              username: message.senderUsername
            }, 
            message.message, 
            () => window.location.href = `/messages/${message.senderId}`
          );
        }
      });

      // Gestion des événements de connexion
      socketInstance.on('connect', () => {
        console.log('Socket connecté, ID:', socketInstance.id);
        socketInstance.emit('authenticate', authUser._id);
      });

      socketInstance.on('disconnect', (reason) => {
        console.warn(`Socket déconnecté: ${reason}`);
        if (reason === 'io server disconnect') {
          socketInstance.connect();
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Erreur de connexion socket:', error);
        toast.error('Problème de connexion. Veuillez vérifier votre réseau.', {
          duration: 4000,
          style: {
            background: '#FF4B4B',
            color: '#fff',
          }
        });
      });

      socketInstance.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnecté après ${attemptNumber} tentatives`);
        socketInstance.emit('authenticate', authUser._id);
        toast.success('Connexion rétablie', {
          duration: 3000,
          style: {
            background: '#48BB78',
            color: '#fff',
          }
        });
      });
    };

    // Configuration initiale des écouteurs
    setupSocketListeners();

    // Mettre à jour l'instance du socket
    setSocket(socketInstance);

    // Nettoyage à la déconnexion
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [
    authUser, 
    queryClient, 
    notificationAudio, 
    messageAudio, 
    canPlaySound,
    playSoundSafely,
    showMessageToast,
    getNotificationText
  ]);

  // Valeur du contexte memoïsée pour éviter des re-rendus inutiles
  const contextValue = useMemo(() => ({
    socket, 
    onlineUsers
  }), [socket, onlineUsers]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);