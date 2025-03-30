import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query"; // Ajoutez useQueryClient ici
import { Toaster } from "react-hot-toast";

import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/auth/login/LoginPage";
import SignUpPage from "./pages/auth/signup/SignupPage";
import NotificationPage from "./pages/notification/NotificationPage";
import ProfilePage from "./pages/profile/ProfilePage";
import Sidebar from "./components/common/Sidebar";
import RightPanel from "./components/common/RightPanel";
import LoadingSpinner from "./components/common/LoadingSpinner";
import PostDetail from "./components/PostDetail";
import BookmarksPage from "./pages/Posts/BookmarksPage";

// Importez le SocketProvider
import { SocketProvider } from "./context/SocketContext";
import { API_URL } from "./API";
import { useEffect } from "react";

import { setupApiInterceptor } from './utils/apiInterceptor';
// ...
const queryClient = new QueryClient();
setupApiInterceptor(queryClient);

function App() {
	const queryClient = useQueryClient(); // Assurez-vous d'ajouter ceci
	
	// Ajouter un effet pour nettoyer les cookies si le token est invalide
	useEffect(() => {
	  // Vérifier si une déconnexion a été demandée via localStorage
	  const logoutRequested = localStorage.getItem('logoutRequested');
	  if (logoutRequested === 'true') {
		// Nettoyer les données
		document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; sameSite=none";
		localStorage.removeItem('logoutRequested');
		queryClient.removeQueries(['authUser']);
	  }
	}, [queryClient]);
	
	const { data: authUser, isLoading, error } = useQuery({
	  queryKey: ["authUser"],
	  queryFn: async () => {
		try {
		  const res = await fetch(`${API_URL}/api/auth/me`, {
			credentials: 'include',
			headers: {
			  'Content-Type': 'application/json'
			}
		  });
		  
		  // Vérifier d'abord le statut de la réponse
		  if (res.status === 401) {
			console.log("Non authentifié (401) - Session expirée ou token révoqué");
			
			// Nettoyer les cookies et le stockage local
			document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; sameSite=none";
			localStorage.removeItem('token');
			
			// Invalider les requêtes en cache
			queryClient.removeQueries(['authUser']);
			
			return null;
		  }
		  
		  // Le reste de votre code reste inchangé
		  if (!res.ok) {
			console.error("Erreur API:", res.status);
			return null;
		  }
		  
		  const data = await res.json();
		  
		  if (data.error) {
			console.error("Erreur retournée par l'API:", data.error);
			return null;
		  }
		  
		  console.log("Utilisateur authentifié:", data);
		  return data;
		} catch (error) {
		  console.error("Erreur réseau ou JSON:", error);
		  return null;
		}
	  },
	  // Ajouter un rafraîchissement périodique pour vérifier la validité de la session
	  refetchInterval: 5 * 60 * 1000, // Toutes les 5 minutes
	  retry: false,
	});
  
	// Gérer les erreurs d'authentification
	useEffect(() => {
	  if (error) {
		console.error("Erreur de vérification d'authentification:", error);
		// Nettoyer les données en cas d'erreur
		document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; sameSite=none";
	  }
	}, [error]);
  
	if (isLoading) {
	  return (
		<div className='h-screen flex justify-center items-center'>
		  <LoadingSpinner size='lg' />
		</div>
	  );
	}
  
	return (
		// Enveloppez votre application dans le SocketProvider
		<SocketProvider>
			<div className='flex max-w-6xl mx-auto'>
				{/* Common component, bc it's not wrapped with Routes */}
				{authUser && <Sidebar />}
				<Routes>
					<Route path='/' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
					<Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to='/' />} />
					<Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to='/' />} />
					<Route path='/notifications' element={authUser ? <NotificationPage /> : <Navigate to='/login' />} />
					<Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to='/login' />} />
					<Route path='/post/:id' element={authUser ? <PostDetail /> : <Navigate to='/login' />} />
					<Route path="/bookmarks" element={<BookmarksPage />} />
				</Routes>
				{authUser && <RightPanel />}
				{/* Assurez-vous que le Toaster est dans le bon emplacement pour afficher les notifications */}
				<Toaster 
					position="top-right"
					toastOptions={{
						duration: 5000,
						style: {
							background: '#333',
							color: '#fff',
						},
					}}
				/>
			</div>
		</SocketProvider>
	);
  }

	


export default App;