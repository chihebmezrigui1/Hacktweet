// detection.route.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protectRoute } from '../middleware/protectRoute.js';
import { detectEmotion } from '../controllers/detection.controller.js';

const router = express.Router();

// Créer le dossier d'uploads au démarrage pour éviter de vérifier à chaque requête
const uploadDir = path.join(process.cwd(), 'uploads', 'emotions');
if (!fs.existsSync(uploadDir)){ 
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration de Multer optimisée
const upload = multer({ 
    storage: multer.diskStorage({ 
        destination: (req, file, cb) => { 
            cb(null, uploadDir); 
        }, 
        filename: (req, file, cb) => { 
            const postId = req.body.postId || 'unknown'; 
            cb(null, `emotion-${postId}-${Date.now()}${path.extname(file.originalname)}`); 
        } 
    }), 
    fileFilter: (req, file, cb) => { 
        // Validation rapide sans logs superflus
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']; 
        if (allowedTypes.includes(file.mimetype)) { 
            cb(null, true); 
        } else { 
            cb(new Error('Type de fichier invalide. Seuls JPEG, PNG et GIF sont autorisés.'), false); 
        } 
    }, 
    limits: { 
        fileSize: 2 * 1024 * 1024, // Réduit à 2MB pour un traitement plus rapide
        files: 1
    } 
}); 

// Route optimisée
router.post('/detect-emotion', 
    protectRoute, 
    (req, res, next) => { 
        upload.single('image')(req, res, (err) => { 
            if (err) {
                const status = err instanceof multer.MulterError ? 400 : 500;
                return res.status(status).json({ 
                    success: false, 
                    message: err.message 
                }); 
            }
            next(); 
        }); 
    }, 
    detectEmotion
);

export default router;