import { Navigate, Route, Routes } from "react-router-dom";
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

function App() {
	const { data: authUser, isLoading } = useQuery({
		queryKey: ["authUser"],
		queryFn: async () => {
		  try {
			const res = await fetch(`${API_URL}/api/auth/me`, {
			  credentials: 'include',  // Crucial pour envoyer les cookies d'authentification
			  headers: {
				'Content-Type': 'application/json',
			  },
			});
			
			// Si l'utilisateur n'est pas authentifié, renvoie null
			if (res.status === 401) {
			  console.log("Non authentifié (401) **");
			  return null;
			}
	  
			if (!res.ok) {
			  console.error("Erreur API:", res.status);
			  return null;
			}
	  
			// Si la réponse est correcte, renvoie les données de l'utilisateur
			const data = await res.json();
			return data;
		  } catch (error) {
			console.error("Erreur réseau ou JSON:", error);
			return null; // Retourner null plutôt que de lancer une erreur
		  }
		},
		retry: false,
	  });
	  
	  if (isLoading) {
		return (
		  <div className="h-screen flex justify-center items-center">
			<LoadingSpinner size="lg" />
		  </div>
		);
	  }
	  
	  
	  if (isLoading) {
		return (
		  <div className="h-screen flex justify-center items-center">
			<LoadingSpinner size="lg" />
		  </div>
		);
	  }
	  

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