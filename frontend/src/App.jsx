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
	  // Vérifier si le token est présent dans localStorage
	  const isAuthenticated = !!localStorage.getItem('jwt');

	  if (!isAuthenticated) {
		return <Navigate to='/login' />;
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
				{isAuthenticated && <Sidebar />}
				<Routes>
					<Route path='/' element={isAuthenticated ? <HomePage /> : <Navigate to='/login' />} />
					<Route path='/login' element={!isAuthenticated ? <LoginPage /> : <Navigate to='/' />} />
					<Route path='/signup' element={!isAuthenticated ? <SignUpPage /> : <Navigate to='/' />} />
					<Route path='/notifications' element={isAuthenticated ? <NotificationPage /> : <Navigate to='/login' />} />
					<Route path='/profile/:username' element={isAuthenticated ? <ProfilePage /> : <Navigate to='/login' />} />
					<Route path='/post/:id' element={isAuthenticated ? <PostDetail /> : <Navigate to='/login' />} />
					<Route path="/bookmarks" element={<BookmarksPage />} />
				</Routes>
				{isAuthenticated && <RightPanel />}
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