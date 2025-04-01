import path from "path";
import fs from "fs"
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors"; 
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.route.js";
import userRoutes from './routes/user.route.js';
import connectMongoDB from './config/db.js';
import cloudinary from 'cloudinary';
import postRoutes from './routes/post.route.js';
import notificationRoutes from './routes/notification.route.js';
import detectionRoutes from './routes/detection.route.js';

dotenv.config();

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

// Créer un serveur HTTP à partir de l'app Express
const server = http.createServer(app);

// Configuration CORS unifiée pour Express et Socket.IO
const corsOptions = {
  origin: function(origin, callback) {
    // Autorise les requêtes sans origine (crucial pour les mobiles)
    if (!origin) return callback(null, true);
    
    // Liste de domaines autorisés
    const allowedDomains = [
      'http://localhost:3000',
      'https://hacktweet.onrender.com',
      // Ajoutez ici d'autres origines nécessaires
    ];
    
    // Autorise les domaines onrender.com contenant 'hacktweet'
    if (origin && origin.includes('hacktweet') && origin.includes('onrender.com')) {
      return callback(null, true);
    }
    
    // Vérifie si l'origine est dans la liste des domaines autorisés
    if (allowedDomains.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Pour le débogage et le développement, autoriser toutes les origines
    // En production, vous devriez commenter cette ligne
    return callback(null, true);
    
    callback(new Error('Bloqué par la politique CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Initialiser Socket.IO avec la configuration CORS unifiée
const io = new Server(server, {
  cors: corsOptions
});

// Stockage des connexions d'utilisateurs
const userSockets = {};

// Gérer les connexions WebSocket
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  
  // Authentifier l'utilisateur
  socket.on("authenticate", (userId) => {
    userSockets[userId] = socket.id;
    console.log(`User ${userId} authenticated with socket ${socket.id}`);
  });
  
  // Gérer la déconnexion
  socket.on("disconnect", () => {
    // Trouver et supprimer l'utilisateur du stockage
    for (const [userId, socketId] of Object.entries(userSockets)) {
      if (socketId === socket.id) {
        delete userSockets[userId];
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Body parser middleware with increased limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cookieParser());

// Appliquer la configuration CORS unifiée à Express
app.use(cors(corsOptions));

// Route de test pour le débogage
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API accessible!', 
    origin: req.headers.origin || 'no origin',
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/detection", detectionRoutes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

// Route pour déboguer les connexions WebSocket
app.get("/api/debug/sockets", (req, res) => {
    const connections = Object.entries(userSockets).map(([userId, socketId]) => ({
        userId,
        socketId
    }));
    
    res.json({
        totalConnections: connections.length,
        connections
    });
});

// Démarrer le serveur avec Socket.IO
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
});

// Exporter io et userSockets pour les utiliser dans d'autres fichiers
export { io, userSockets };


// import path from "path";
// import fs from "fs"
// import express from "express";
// import dotenv from "dotenv";
// import cookieParser from "cookie-parser";
// import cors from "cors"; 
// import http from "http";
// import { Server } from "socket.io";
// import authRoutes from "./routes/auth.route.js";
// import userRoutes from './routes/user.route.js';
// import connectMongoDB from './config/db.js';
// import cloudinary from 'cloudinary';
// import postRoutes from './routes/post.route.js';
// import notificationRoutes from './routes/notification.route.js';
// import detectionRoutes from './routes/detection.route.js';

// dotenv.config();



// // Cloudinary configuration
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const app = express();
// const PORT = process.env.PORT || 5000;

// const __dirname = path.resolve();

// // Créer un serveur HTTP à partir de l'app Express
// const server = http.createServer(app);

// // Initialiser Socket.IO avec le serveur HTTP
// const io = new Server(server, {
//   cors: {
//     origin: function(origin, callback) {
//       // Autorise les requêtes sans origine (comme Postman)
//       if (!origin) return callback(null, true);
      
//       // Liste de domaines autorisés
//       const allowedDomains = [
//         'http://localhost:3000',
//         'https://hacktweet.onrender.com'
//       ];
      
//       // Autorise également tous les sous-domaines de onrender.com contenant 'hacktweet'
//       if (origin.includes('hacktweet') && origin.includes('onrender.com')) {
//         return callback(null, true);
//       }
      
//       // Vérifie si l'origine est dans la liste des domaines autorisés
//       if (allowedDomains.indexOf(origin) !== -1) {
//         return callback(null, true);
//       }
      
//       callback(new Error('Bloqué par la politique CORS'));
//     },
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"]
//   }
// });

// // Stockage des connexions d'utilisateurs
// const userSockets = {};

// // Gérer les connexions WebSocket
// io.on("connection", (socket) => {
//   console.log("New client connected:", socket.id);
  
//   // Authentifier l'utilisateur
//   socket.on("authenticate", (userId) => {
//     userSockets[userId] = socket.id;
//     console.log(`User ${userId} authenticated with socket ${socket.id}`);
//   });
  
//   // Gérer la déconnexion
//   socket.on("disconnect", () => {
//     // Trouver et supprimer l'utilisateur du stockage
//     for (const [userId, socketId] of Object.entries(userSockets)) {
//       if (socketId === socket.id) {
//         delete userSockets[userId];
//         console.log(`User ${userId} disconnected`);
//         break;
//       }
//     }
//   });
// });

// // Body parser middleware with increased limits
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));

// app.use(cookieParser());

// // Configure CORS with credentials support
// app.use(cors({
//   origin: function(origin, callback) {
//     // Autorise les requêtes sans origine (comme Postman)
//     if (!origin) return callback(null, true);
    
//     // Liste de domaines autorisés
//     const allowedDomains = [
//       'http://localhost:3000',
//       'https://hacktweet.onrender.com'
//     ];
    
//     // Autorise également tous les sous-domaines de onrender.com contenant 'hacktweet'
//     if (origin.includes('hacktweet') && origin.includes('onrender.com')) {
//       return callback(null, true);
//     }
    
//     // Vérifie si l'origine est dans la liste des domaines autorisés
//     if (allowedDomains.indexOf(origin) !== -1) {
//       return callback(null, true);
//     }
    
//     callback(new Error('Bloqué par la politique CORS'));
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // API routes
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/posts", postRoutes);
// app.use("/api/detection", detectionRoutes);

// // Serve static files in production
// if (process.env.NODE_ENV === "production") {
//     app.use(express.static(path.join(__dirname, "/frontend/dist")));

//     app.get("*", (req, res) => {
//         res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
//     });
// }

// // Dans server.js ou une route d'API dédiée
// app.get("/api/debug/sockets", (req, res) => {
//     const connections = Object.entries(userSockets).map(([userId, socketId]) => ({
//         userId,
//         socketId
//     }));
    
//     res.json({
//         totalConnections: connections.length,
//         connections
//     });
// });

// // Démarrer le serveur avec Socket.IO
// server.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
//     connectMongoDB();
// });

// // Exporter io et userSockets pour les utiliser dans d'autres fichiers
// export { io, userSockets };