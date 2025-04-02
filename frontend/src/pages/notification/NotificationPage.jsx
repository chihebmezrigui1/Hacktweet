// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { toast } from "react-hot-toast";
// import LoadingSpinner from "../../components/common/LoadingSpinner";
// import { IoSettingsOutline } from "react-icons/io5";
// import { FaBookmark, FaRetweet, FaUser } from "react-icons/fa";
// import { FaHeart } from "react-icons/fa6";
// import { FaComment } from "react-icons/fa";
// import { BsBookmark } from "react-icons/bs";
// import { FaTrashAlt } from "react-icons/fa";
// import { useEffect } from "react";
// import { io } from "socket.io-client";
// import { API_URL } from "../../API";
// import { fetchWithAuth } from "../../fetchWithAuth";
// import { FaArrowLeft } from "react-icons/fa";

// const NotificationPage = () => {
//   const queryClient = useQueryClient();
//   const [selectedNotificationId, setSelectedNotificationId] = useState(null);
//   const navigate = useNavigate();

//   const { data: notifications, isLoading } = useQuery({
//     queryKey: ["notifications"],
//     queryFn: async () => {
//       try {
//         const res = await fetchWithAuth(`/api/notifications`,{credentials: 'include'});
//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Something went wrong");
//         return data;
//       } catch (error) {
//         throw new Error(error);
//       }
//     },
//   });

//   // Mutation for deleting a single notification
//   const { mutate: deleteNotification, isPending: isDeleting } = useMutation({
//     mutationFn: async (notificationId) => {
//       try {
//         const res = await fetchWithAuth(`/api/notifications/${notificationId}`, {
//           method: "DELETE",
//           credentials: 'include'
//         });
//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Something went wrong");
//         return data;
//       } catch (error) {
//         throw new Error(error);
//       }
//     },
//     onSuccess: () => {
//       toast.success("Notification deleted successfully");
//       queryClient.invalidateQueries({ queryKey: ["notifications"] });
//     },
//     onError: (error) => {
//       toast.error(error.message);
//     },
//   });

//   // Handler for opening the delete confirmation modal
//   const handleDeleteNotification = (notificationId, e) => {
//     e.stopPropagation(); // Prevent notification click event
//     setSelectedNotificationId(notificationId);
//     document.getElementById('delete_notification_modal').showModal();
//   };

//   // Handler for confirming deletion
//   const confirmDeleteNotification = () => {
//     if (selectedNotificationId) {
//       deleteNotification(selectedNotificationId);
//     }
//   };

//   // Helper function to get notification message based on type
//   const getNotificationMessage = (notification) => {
//     switch(notification.type) {
//       case "follow":
//         return "followed you";
//       case "like":
//         return "liked your post";
//       case "comment":
//         return "commented on your post";
//       case "bookmarked":
//         return "bookmarked your post";
//       case "repost":
//         return "reposted your post";
//       default:
//         return "interacted with you";
//     }
//   };

//   // Helper function to get notification icon
//   const NotificationIcon = ({ type }) => {
//     switch(type) {
//       case "follow":
//         return <FaUser className='w-7 h-7 text-primary' />;
//       case "like":
//         return <FaHeart className='w-7 h-7 text-pink-500' />;
//       case "comment":
//         return <FaComment className='w-7 h-7 text-green-500' />;
//       case "bookmarked":
//         return <FaBookmark className='w-7 h-7 text-blue-500' />;
//       case "repost":
//         return <FaRetweet className='w-7 h-7 text-green-500' />;
//       default:
//         return null;
//     }
//   };

//   // Function to mark notification as read when clicked
//   const markAsRead = (notificationId) => {
//     fetchWithAuth(`/api/notifications/${notificationId}/read`, {
//       method: "PUT",
//       credentials: 'include'
//     })
//     .then((res) => {
//       if (res.ok) {
//         toast.success("Notification marked as read");
//         queryClient.invalidateQueries({ queryKey: ["notifications"] });
//       } else {
//         toast.error("Failed to mark notification as read");
//       }
//     })
//     .catch(() => {
//       toast.error("Error occurred while marking as read");
//     });
//   };

//   useEffect(() => {
//     const socket = io(); // Assuming you have socket.io client initialized

//     // Listen for the 'notification-deleted' event
//     socket.on('notification-deleted', (notificationId) => {
//       // Remove the notification from the local state (e.g., from notifications list)
//       setNotifications(prevNotifications =>
//         prevNotifications.filter(notification => notification._id !== notificationId)
//       );
//     });

//     return () => {
//       socket.off('notification-deleted'); // Cleanup on component unmount
//     };
//   }, []);

//   return (
//     <div className="flex-[4_4_0] border-l border-r border-gray-700 min-h-screen">
//       <div className="flex items-center p-4 border-b border-gray-700 gap-4">
//         <button 
//                   onClick={() => navigate(-1)} 
//                   className="text-gray-400 hover:text-white"
//                 >
//                   <FaArrowLeft />
//                 </button>
//         <p className='font-bold'>Notifications</p>
//         {/* <div className='dropdown '>
//           <div tabIndex={0} role='button' className='m-1'>
//             <IoSettingsOutline className='w-4' />
//           </div>
//           <ul
//             tabIndex={0}
//             className='dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52'
//           >
//             <li>
//               <a>Delete all notifications</a>
//             </li>
//           </ul>
//         </div> */}
//       </div>

//       {isLoading && (
//         <div className='flex justify-center h-full items-center'>
//           <LoadingSpinner size='lg' />
//         </div>
//       )}

//       {notifications?.length === 0 && <div className='text-center p-4 font-bold'>No notifications 🤔</div>}

//       {notifications?.map((notification) => (
//         <div
//           className={`border-b border-gray-700 ${!notification.read ? 'bg-gray-800' : ''}`}
//           key={notification._id}
//           onClick={() => markAsRead(notification._id)} // Mark as read on click
//         >
//           <div className='flex items-center gap-3 p-4'>
//             {/* User avatar */}
//             <Link to={`/profile/${notification.from.username}`}>
//               <div className='avatar'>
//                 <div className='w-10 h-10 rounded-full'>
//                   <img src={notification.from.profileImg || "/avatar-placeholder.png"} alt={notification.from.username} />
//                 </div>
//               </div>
//             </Link>
            
//             {/* Notification content */}
//             <div className='flex-1'>
//               <div className='flex items-center justify-between'>
//                 <div>
//                   <span className={`font-bold text-blue-400 ${!notification.read ? 'font-bold' : 'font-normal'}`}>
//                     @{notification.from.username}
//                   </span>
//                   <span style={{marginLeft:5}} className={`${!notification.read ? 'font-bold' : 'font-normal'}`}>
//                     {getNotificationMessage(notification)}
//                   </span>
//                 </div>
//                 <NotificationIcon type={notification.type} />
//               </div>

//               {/* Link to post if applicable */}
//               {(notification.type === "like" || notification.type === "comment" || notification.type === "bookmarked" || notification.type === "repost") && notification.post && (
//                 <Link 
//                   to={`/post/${notification.post._id || notification.post}`} 
//                   className='text-sm text-blue-400 hover:underline mt-1 block'
//                 >
//                   View post
//                 </Link>
//               )}
//             </div>

//             {/* Delete button for individual notification */}
//             <div className='ml-2'>
//               <button
//                 onClick={(e) => handleDeleteNotification(notification._id, e)}
//                 className="text-red-500 hover:text-gray-700"
//               >
//                 <FaTrashAlt className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         </div>
//       ))}

//       {/* DaisyUI Delete Confirmation Modal */}
//       <dialog id="delete_notification_modal" className="modal">
//         <div className="modal-box">
//           <h3 className="font-bold text-lg">Delete Notification</h3>
//           <p className="py-4">Are you sure you want to delete this notification?</p>
//           <div className="modal-action">
//             <form method="dialog">
//               <button className="btn btn-outline mr-2">Cancel</button>
//               <button 
//                 onClick={confirmDeleteNotification}
//                 className="btn btn-warning"
//               >
//                 {isDeleting ? <LoadingSpinner size="sm" /> : "Delete"}
//               </button>
//             </form>
//           </div>
//         </div>
//         <form method="dialog" className="modal-backdrop">
//           <button>close</button>
//         </form>
//       </dialog>
//     </div>
//   );
// };

// export default NotificationPage;


// src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Import a notification sound
const notificationSound = './notif.wav';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notificationAudio] = useState(new Audio(notificationSound));
  const { data: authUser } = useQuery({
    queryKey: ['authUser']
  });
  const queryClient = useQueryClient();

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

    // Écouter les nouvelles notifications
    socketInstance.on('new-notification', (notification) => {
      console.log('New notification received:', notification);
      
      // Jouer le son de notification
      try {
        notificationAudio.play().catch(error => {
          console.warn('Error playing notification sound:', error);
        });
      } catch (error) {
        console.error('Failed to play notification sound:', error);
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
  }, [authUser, queryClient, notificationAudio]);

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