// src/hooks/useAuth.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../API';

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: authUser, isLoading, error } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      // Votre logique de fetch...
    },
  });
  
  const logout = async () => {
    try {
      // Nettoyage côté client
      localStorage.removeItem('token');
      document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; sameSite=none";
      
      // Appel API de déconnexion
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      // Invalider les requêtes en cache
      queryClient.removeQueries(['authUser']);
      
      // Redirection
      window.location.href = '/login';
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      // Même en cas d'erreur, on redirige
      window.location.href = '/login';
    }
  };
  
  return {
    authUser,
    isLoading,
    isAuthenticated: !!authUser,
    error,
    logout
  };
}

// Utilisation dans vos composants
const { authUser, isAuthenticated, logout } = useAuth();