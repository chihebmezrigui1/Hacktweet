// Créez un nouveau fichier, par exemple src/utils/apiInterceptor.js
import { API_URL } from "../API";

// Configuration de l'intercepteur global
export const setupApiInterceptor = (queryClient) => {
  // Sauvegarde de la fonction fetch originale
  const originalFetch = window.fetch;
  
  // Remplacer par notre version modifiée
  window.fetch = async function (url, options = {}) {
    const response = await originalFetch(url, options);
    
    // Si la requête concerne notre API et renvoie une erreur 401
    if (url.startsWith(API_URL) && response.status === 401) {
      console.log("Requête API non autorisée - Token potentiellement révoqué");
      
      // Nettoyer les données d'authentification
      localStorage.removeItem('token');
      document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; sameSite=none";
      
      // Invalider les données d'authentification dans React Query
      queryClient.removeQueries(['authUser']);
      
      // Rediriger vers la page de connexion
      window.location.href = '/login';
    }
    
    return response;
  };
};

// Puis dans votre index.js ou App.js
