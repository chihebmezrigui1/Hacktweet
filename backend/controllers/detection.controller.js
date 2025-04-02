// detection.controller.js

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import Post from '../models/Post.js';


const EMOTION_API_URL = process.env.EMOTION_API_URL || 'https://emotion-detection-api-zgj6.onrender.com';


export const detectEmotion = async (req, res) => {
    // Logs de débogage réduits pour améliorer les performances
    console.log('==================== DÉBUT DÉTECTION ÉMOTION ====================');

    try {
        // Extraire le fichier et l'ID du post
        const file = req.file;
        const { postId } = req.body;
        
        // Vérifications rapides
        if (!postId) {
            console.error('ERREUR: ID du post manquant');
            return res.status(400).json({ 
                success: false, 
                message: "Post ID is required" 
            });
        }

        if (!file) {
            console.error('ERREUR: Aucun fichier reçu');
            return res.status(400).json({ 
                success: false, 
                message: "No image provided" 
            });
        }

        // Vérifier l'existence du fichier sur le disque
        if (!fs.existsSync(file.path)) {
            console.error('ERREUR: Le fichier n\'a pas été enregistré');
            return res.status(400).json({ 
                success: false, 
                message: "File upload failed" 
            });
        }

        // Créer FormData pour l'envoi à l'API Flask
        const formData = new FormData();
        formData.append('image', fs.createReadStream(file.path), {
            filename: file.filename,
            contentType: file.mimetype
        });

        console.log('Envoi à l\'API Flask...');

        try {
            // Envoyer l'image au service de détection d'émotion avec timeout
            const flaskResponse = await axios.post(`${EMOTION_API_URL}/detect-emotion`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: 120000,
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            });

            // Nettoyer le fichier temporaire
            fs.unlinkSync(file.path);

            // Retourner la réponse
            return res.status(200).json({
                success: true,
                ...flaskResponse.data,
                postId: postId
            });

        } catch (flaskError) {
            console.error('ERREUR lors de l\'envoi à l\'API Flask');

            // Nettoyer le fichier temporaire
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            // Gestion simplifiée des erreurs
            if (flaskError.response) {
                return res.status(flaskError.response.status).json({ 
                    success: false,
                    message: "Emotion detection service error",
                    details: flaskError.response.data 
                });
            } else if (flaskError.code === 'ECONNABORTED') {
                return res.status(408).json({ 
                    success: false,
                    message: "La détection d'émotion a pris trop de temps" 
                });
            } else {
                return res.status(500).json({ 
                    success: false,
                    message: "Error processing emotion detection request",
                    details: flaskError.message
                });
            }
        }

    } catch (error) {
        console.error('ERREUR GLOBALE:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Erreur interne du serveur",
            details: error.message
        });
    } finally {
        console.log('==================== FIN DÉTECTION ÉMOTION ====================');
    }
};
