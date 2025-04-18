import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import { isLoggedOut } from "./utils/authState";
import { fetchWithAuth } from "./fetchWithAuth";
import MessagesPage from "./pages/messages/MessagesPage";

function App() {
	const { data: authUser, isLoading } = useQuery({
		queryKey: ["authUser"],
		queryFn: async () => {

		  if (isLoggedOut) {
				return null;
			}
		  try {
			const res = await fetchWithAuth(`/api/auth/me`, {
			  credentials: 'include',  // Crucial pour envoyer les cookies d'authentification
			  headers: {
				'Content-Type': 'application/json'
			  }
			});
			
			// Vérifier d'abord le statut de la réponse
			if (res.status === 401) {
			  console.log("Non authentifié (401) **");
			  return null;
			}
			
			if (!res.ok) {
			  console.error("Erreur API:", res.status);
			  return null;
			}
			
			// Seulement essayer de parser la réponse si le statut est OK
			const data = await res.json();
			
			if (data.error) {
			  console.error("Erreur retournée par l'API:", data.error);
			  return null;
			}
			
			console.log("Utilisateur authentifié:", data);
			return data;
		  } catch (error) {
			console.error("Erreur réseau ou JSON:", error);
			return null;  // Retourner null plutôt que de lancer une erreur
		  }
		},
		retry: false,
	  });


	if (isLoading) {
		return (
			<div className='h-screen flex justify-center items-center'>
				<LoadingSpinner size='lg' />
			</div>
		);
	}

	return (
		// Enveloppez votre application dans le SocketProvider
		<div className='bg-[#1c222a]' >
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
				<SocketProvider>
			<div className='flex max-w-6xl mx-auto bg-[#1c222a]'>
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
					<Route path='/messages' element={authUser ? <MessagesPage /> : <Navigate to='/login' />} />
					<Route path='/messages/:id' element={authUser ? <MessagesPage /> : <Navigate to='/login' />} />
				</Routes>
				{authUser && <RightPanel />}
				{/* Assurez-vous que le Toaster est dans le bon emplacement pour afficher les notifications */}
				
			</div>
		</SocketProvider>
		</div>

	);
}

export default App;