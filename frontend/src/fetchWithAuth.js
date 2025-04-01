// Créez un fichier utils/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const fetchWithAuth = async (endpoint, options = {}) => {
  // Options par défaut
  const defaultOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Pour les cookies
  };
  
  // Ajouter le token depuis localStorage si disponible
  const token = localStorage.getItem('jwtToken');
  if (token) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  // Construire l'URL complète
  const url = `${API_URL}${endpoint}`;

  // Faire la requête
  return fetch(url, defaultOptions);
};