// import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { MdHomeFilled } from 'react-icons/md';
// import { IoNotifications } from 'react-icons/io5';
// import { FaUser } from 'react-icons/fa';
// import { FaBookmark } from 'react-icons/fa6';
// import { BiLogOut } from 'react-icons/bi';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import toast from 'react-hot-toast';
// import logo from '../svgs/logo.webp';
// import { API_URL } from '../../API';
// import { setLoggedOut } from '../../utils/authState';
// import { fetchWithAuth } from '../../fetchWithAuth';

// const Sidebar = () => {
//   const queryClient = useQueryClient();
//   const navigate = useNavigate()

//   const clearJWT = () => {
//     document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; // Expire immédiatement le cookie
//   };

//   // Mutation pour déconnexion
// const { mutate: logoutMutation } = useMutation({
//     mutationFn: async () => {
//       try {
//         // Définir le drapeau de déconnexion
//         setLoggedOut(true);

//         console.log("Début de la déconnexion");

//         // Supprimer le token du localStorage
//         localStorage.removeItem('jwtToken');
//         console.log("Token supprimé de localStorage");

//         // Supprimer le cookie JWT
//         document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; 
//         console.log("Cookie supprimé");

//         // Appel API pour déconnexion côté serveur
//         await fetchWithAuth(`/api/auth/logout`, {
//           method: 'POST',
//           credentials: 'include',
//         });
//         console.log("Déconnexion côté serveur effectuée");

//       } catch (error) {
//         console.error('Logout error:', error);
//         throw new Error(error.message);
//       }
//     },
//     onSuccess: () => {
//       console.log("Déconnexion réussie");
//       queryClient.invalidateQueries(['authUser']); // Invalider les données d'authentification
//       window.location.href = "/login";
//       window.location.reload();  // Rediriger vers la page de login après déconnexion
//     },
//     onError: (error) => {
//       console.error("Erreur de déconnexion :", error);
//       toast.error('Logout failed'); // Afficher un toast en cas d'erreur
//     },
//   });
//   // Fonction pour gérer la déconnexion
//   const logout = async () => {
//     await logoutMutation();  // Exécuter la mutation de déconnexion
//   };

//   const { data: authUser } = useQuery({ queryKey: ['authUser'] });
  
//   // Ajout de la requête pour le compteur de notifications non lues
//   const { data: unreadCount } = useQuery({
//     queryKey: ['unreadCount'],
//     queryFn: async () => {
//       try {
//         const res = await fetchWithAuth(`/api/notifications/unread-count`, {
//           credentials: 'include'
//         });
//         if (!res.ok) {
//           throw new Error('Failed to fetch unread count');
//         }
//         return res.json();
//       } catch (error) {
//         console.error('Error fetching unread count:', error);
//         return { count: 0 };
//       }
//     },
//     // Actualiser toutes les minutes
//     refetchInterval: 60000,
//     enabled: !!authUser, // Activer seulement si l'utilisateur est connecté
//   });

//   const menuItems = [
//     { name: 'Home', path: '/', icon: <MdHomeFilled className='w-6 h-6 text-yellow-500' /> },
//     { 
//       name: 'Notifications', 
//       path: '/notifications', 
//       icon: <IoNotifications className='w-6 h-6 text-yellow-500' />,
//       badge: unreadCount?.count || 0
//     },
//     { name: 'Bookmarks', path: '/bookmarks', icon: <FaBookmark className='w-6 h-6 text-yellow-500' /> },
//     { name: 'Profile', path: `/profile/${authUser?.username}`, icon: <FaUser className='w-6 h-6 text-yellow-500' /> },
//   ];

//   return (
//     <div className='w-70 h-screen p-4 border-r border-gray-700 ml'>
//       <div className='flex justify-center mb-4'>
//         <img src={logo} width={100} alt='Logo' />
//       </div>
//       <ul className='space-y-2'>
//         {menuItems.map((item) => (
//           <li key={item.name}>
//             <Link
//               to={item.path}
//               className='flex items-center gap-3 p-3 text-lg font-medium text-gray-100 rounded-lg transition duration-300 hover:bg-gray-500 hover:font-bold'
//             >
//               <div className="relative">
//                 {item.icon}
//                 {item.badge > 0 && (
//                   <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                     {item.badge > 9 ? '9+' : item.badge}
//                   </span>
//                 )}
//               </div>
//               <span className='hidden md:block'>{item.name}</span>
//               {/* {item.name === 'Notifications' && item.badge > 0 && (
//                 <span className='hidden md:flex bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] items-center justify-center px-1'>
//                   {item.badge > 99 ? '99+' : item.badge}
//                 </span>
//               )} */}
//             </Link>
//           </li>
//         ))}
//       </ul>
//       {authUser && (
//         <div
//           style={{marginLeft:-10}}
//           className='mt-auto mb-4 flex items-center gap-3 p-3 text-lg font-medium text-gray-100 rounded-lg transition duration-300 hover:bg-gray-500 cursor-pointer hover:font-bold'
//           onClick={logout}
//         >
//           <BiLogOut className='w-8 h-8 text-yellow-800' />
//           <span className='hidden md:block text-gray-100'>Logout</span>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Sidebar;


// import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { MdHomeFilled } from 'react-icons/md';
// import { IoNotifications } from 'react-icons/io5';
// import { FaUser } from 'react-icons/fa';
// import { FaBookmark } from 'react-icons/fa6';
// import { BiLogOut } from 'react-icons/bi';
// import { IoChatbubbleEllipsesOutline } from 'react-icons/io5'; // Importer l'icône de messages
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import toast from 'react-hot-toast';
// import logo from '../svgs/logo.webp';
// import { API_URL } from '../../API';
// import { setLoggedOut } from '../../utils/authState';
// import { fetchWithAuth } from '../../fetchWithAuth';

// const Sidebar = () => {
//   const queryClient = useQueryClient();
//   const navigate = useNavigate()

//   const clearJWT = () => {
//     document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; // Expire immédiatement le cookie
//   };

//   // Mutation pour déconnexion
// const { mutate: logoutMutation } = useMutation({
//     mutationFn: async () => {
//       try {
//         // Définir le drapeau de déconnexion
//         setLoggedOut(true);

//         console.log("Début de la déconnexion");

//         // Supprimer le token du localStorage
//         localStorage.removeItem('jwtToken');
//         console.log("Token supprimé de localStorage");

//         // Supprimer le cookie JWT
//         document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; 
//         console.log("Cookie supprimé");

//         // Appel API pour déconnexion côté serveur
//         await fetchWithAuth(`/api/auth/logout`, {
//           method: 'POST',
//           credentials: 'include',
//         });
//         console.log("Déconnexion côté serveur effectuée");

//       } catch (error) {
//         console.error('Logout error:', error);
//         throw new Error(error.message);
//       }
//     },
//     onSuccess: () => {
//       console.log("Déconnexion réussie");
//       queryClient.invalidateQueries(['authUser']); // Invalider les données d'authentification
//       window.location.href = "/login";
//       window.location.reload();  // Rediriger vers la page de login après déconnexion
//     },
//     onError: (error) => {
//       console.error("Erreur de déconnexion :", error);
//       toast.error('Logout failed'); // Afficher un toast en cas d'erreur
//     },
//   });
//   // Fonction pour gérer la déconnexion
//   const logout = async () => {
//     await logoutMutation();  // Exécuter la mutation de déconnexion
//   };

//   const { data: authUser } = useQuery({ queryKey: ['authUser'] });
  
//   // Ajout de la requête pour le compteur de notifications non lues
//   const { data: unreadCount } = useQuery({
//     queryKey: ['unreadCount'],
//     queryFn: async () => {
//       try {
//         const res = await fetchWithAuth(`/api/notifications/unread-count`, {
//           credentials: 'include'
//         });
//         if (!res.ok) {
//           throw new Error('Failed to fetch unread count');
//         }
//         return res.json();
//       } catch (error) {
//         console.error('Error fetching unread count:', error);
//         return { count: 0 };
//       }
//     },
//     // Actualiser toutes les minutes
//     refetchInterval: 60000,
//     enabled: !!authUser, // Activer seulement si l'utilisateur est connecté
//   });

//   // Ajout de la requête pour le compteur de messages non lus
//   const { data: unreadMessageCount = { count: 0 } } = useQuery({
//     queryKey: ['unreadMessageCount'],
//     queryFn: async () => {
//       try {
//         const res = await fetchWithAuth(`/api/messages/unread-count`, {
//           credentials: 'include'
//         });
//         if (!res.ok) {
//           throw new Error('Failed to fetch unread messages count');
//         }
//         return res.json();
//       } catch (error) {
//         console.error('Error fetching unread messages count:', error);
//         return { count: 0 };
//       }
//     },
//     // Actualiser toutes les minutes
//     refetchInterval: 60000,
//     enabled: !!authUser, // Activer seulement si l'utilisateur est connecté
//   });

//   const menuItems = [
//     { name: 'Home', path: '/', icon: <MdHomeFilled className='w-6 h-6 text-yellow-500' /> },
//     { 
//       name: 'Notifications', 
//       path: '/notifications', 
//       icon: <IoNotifications className='w-6 h-6 text-yellow-500' />,
//       badge: unreadCount?.count || 0
//     },
//     {
//       name: 'Messages',
//       path: '/messages',
//       icon: <IoChatbubbleEllipsesOutline className='w-6 h-6 text-yellow-500' />,
//       badge: unreadMessageCount?.count || 0
//     },
//     { name: 'Bookmarks', path: '/bookmarks', icon: <FaBookmark className='w-6 h-6 text-yellow-500' /> },
//     { name: 'Profile', path: `/profile/${authUser?.username}`, icon: <FaUser className='w-6 h-6 text-yellow-500' /> },
//   ];

//   return (
//     <div className='w-70 h-screen p-4 border-r border-gray-700 ml'>
//       <div className='flex justify-center mb-4'>
//         <img src={logo} width={100} alt='Logo' />
//       </div>
//       <ul className='space-y-2'>
//         {menuItems.map((item) => (
//           <li key={item.name}>
//             <Link
//               to={item.path}
//               className='flex items-center gap-3 p-3 text-lg font-medium text-gray-100 rounded-lg transition duration-300 hover:bg-gray-500 hover:font-bold'
//             >
//               <div className="relative">
//                 {item.icon}
//                 {item.badge > 0 && (
//                   <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                     {item.badge > 9 ? '9+' : item.badge}
//                   </span>
//                 )}
//               </div>
//               <span className='hidden md:block'>{item.name}</span>
//             </Link>
//           </li>
//         ))}
//       </ul>
//       {authUser && (
//         <div
//           style={{marginLeft:-10}}
//           className='mt-auto mb-4 flex items-center gap-3 p-3 text-lg font-medium text-gray-100 rounded-lg transition duration-300 hover:bg-gray-500 cursor-pointer hover:font-bold'
//           onClick={logout}
//         >
//           <BiLogOut className='w-8 h-8 text-yellow-800' />
//           <span className='hidden md:block text-gray-100'>Logout</span>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Sidebar;



import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdHomeFilled } from 'react-icons/md';
import { IoNotifications } from 'react-icons/io5';
import { FaUser } from 'react-icons/fa';
import { FaBookmark } from 'react-icons/fa6';
import { BiLogOut } from 'react-icons/bi';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5'; // Importer l'icône de messages
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import logo from '../svgs/logo.webp';
import { API_URL } from '../../API';
import { setLoggedOut } from '../../utils/authState';
import { fetchWithAuth } from '../../fetchWithAuth';

const Sidebar = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate()

  const clearJWT = () => {
    document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; // Expire immédiatement le cookie
  };

  // Mutation pour déconnexion
const { mutate: logoutMutation } = useMutation({
    mutationFn: async () => {
      try {
        // Définir le drapeau de déconnexion
        setLoggedOut(true);

        console.log("Début de la déconnexion");

        // Supprimer le token du localStorage
        localStorage.removeItem('jwtToken');
        console.log("Token supprimé de localStorage");

        // Supprimer le cookie JWT
        document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; 
        console.log("Cookie supprimé");

        // Appel API pour déconnexion côté serveur
        await fetchWithAuth(`/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
        console.log("Déconnexion côté serveur effectuée");

      } catch (error) {
        console.error('Logout error:', error);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      console.log("Déconnexion réussie");
      queryClient.invalidateQueries(['authUser']); // Invalider les données d'authentification
      window.location.href = "/login";
      window.location.reload();  // Rediriger vers la page de login après déconnexion
    },
    onError: (error) => {
      console.error("Erreur de déconnexion :", error);
      toast.error('Logout failed'); // Afficher un toast en cas d'erreur
    },
  });
  // Fonction pour gérer la déconnexion
  const logout = async () => {
    await logoutMutation();  // Exécuter la mutation de déconnexion
  };

  const { data: authUser } = useQuery({ queryKey: ['authUser'] });
  
  // Ajout de la requête pour le compteur de notifications non lues
  const { data: unreadCount } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      try {
        const res = await fetchWithAuth(`/api/notifications/unread-count`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Failed to fetch unread count');
        }
        const data = await res.json();
        
        // Filter out message-type notifications
        const filteredNotifications = data.filter(
          notification => notification.type !== 'message'
        );
        
        return { count: filteredNotifications.length };
      } catch (error) {
        console.error('Error fetching unread count:', error);
        return { count: 0 };
      }
    },
    // Actualiser toutes les minutes
    refetchInterval: 60000,
    enabled: !!authUser, // Activer seulement si l'utilisateur est connecté
  });
  // Ajout de la requête pour le compteur de messages non lus
  const { data: unreadMessageCount = { count: 0 } } = useQuery({
    queryKey: ['unreadMessageCount'],
    queryFn: async () => {
      try {
        const res = await fetchWithAuth(`/api/messages/unread-count`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Failed to fetch unread messages count');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching unread messages count:', error);
        return { count: 0 };
      }
    },
    // Actualiser toutes les minutes
    refetchInterval: 60000,
    enabled: !!authUser, // Activer seulement si l'utilisateur est connecté
  });

  const menuItems = [
    { name: 'Home', path: '/', icon: <MdHomeFilled className='w-6 h-6 text-yellow-500' /> },
    { 
      name: 'Notifications', 
      path: '/notifications', 
      icon: <IoNotifications className='w-6 h-6 text-yellow-500' />,
      badge: unreadCount?.count || 0
    },
    {
      name: 'Messages',
      path: '/messages',
      icon: <IoChatbubbleEllipsesOutline className='w-6 h-6 text-yellow-500' />,
      badge: unreadMessageCount?.count || 0
    },
    { name: 'Bookmarks', path: '/bookmarks', icon: <FaBookmark className='w-6 h-6 text-yellow-500' /> },
    { name: 'Profile', path: `/profile/${authUser?.username}`, icon: <FaUser className='w-6 h-6 text-yellow-500' /> },
  ];

  return (
    <div className=' bg-[#1c222a] w-70 h-screen p-4 border-r border-gray-700 ml'>
      <div className='flex justify-center mb-4'>
        <img src={logo} width={100} alt='Logo' />
      </div>
      <ul className='space-y-2'>
        {menuItems.map((item) => (
          <li key={item.name}>
            <Link
              to={item.path}
              className='flex items-center gap-3 p-3 text-lg font-medium text-gray-100 rounded-lg transition duration-300 hover:bg-gray-500 hover:font-bold'
            >
              <div className="relative">
                {item.icon}
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className='hidden md:block'>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      {authUser && (
        <div
          style={{marginLeft:-10}}
          className='mt-auto mb-4 flex items-center gap-3 p-3 text-lg font-medium text-gray-100 rounded-lg transition duration-300 hover:bg-gray-500 cursor-pointer hover:font-bold'
          onClick={logout}
        >
          <BiLogOut className='w-8 h-8 text-yellow-800' />
          <span className='hidden md:block text-gray-100'>Logout</span>
        </div>
      )}
    </div>
  );
};

export default Sidebar;