import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";

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

// Fonction utilitaire pour obtenir un cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

function App() {
  const [tokenExists, setTokenExists] = useState(false);

  // Vérifie si le token existe dans les cookies
  useEffect(() => {
    const token = getCookie('jwt');
    setTokenExists(!!token);  // Met à jour l'état si le token existe
  }, []);

  // Si le token n'existe pas, redirige vers la page de login
  if (!tokenExists) {
    return <Navigate to='/login' />;
  }

  return (
    <SocketProvider>
      <div className="flex max-w-6xl mx-auto">
        {/* Common component, bc it's not wrapped with Routes */}
        <Sidebar />
        <Routes>
          <Route path="/" element={tokenExists ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!tokenExists ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!tokenExists ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="/notifications" element={tokenExists ? <NotificationPage /> : <Navigate to="/login" />} />
          <Route path="/profile/:username" element={tokenExists ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/post/:id" element={tokenExists ? <PostDetail /> : <Navigate to="/login" />} />
          <Route path="/bookmarks" element={tokenExists ? <BookmarksPage /> : <Navigate to="/login" />} />
        </Routes>
        <RightPanel />
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
