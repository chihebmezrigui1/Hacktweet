// import path from "path";
// import express from "express";
// import dotenv from "dotenv";
// import cookieParser from "cookie-parser";
// import cors from "cors"; 
// import authRoutes from "./routes/auth.route.js";
// import userRoutes from './routes/user.route.js';
// import connectMongoDB from './config/db.js';
// import cloudinary from 'cloudinary';
// import postRoutes from './routes/post.route.js';
// import notificationRoutes from './routes/notification.route.js';

// dotenv.config();

// // Cloudinary configuration
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const app = express();
// const PORT = 5000;
// const __dirname = path.resolve();

// // Body parser middleware with increased limits
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));

// app.use(cookieParser());

// // Configure CORS with credentials support
// app.use(cors({
//   origin: 'http://localhost:3000', // Your frontend URL
//   credentials: true,               // Allow credentials
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // API routes
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/posts", postRoutes);

// // Serve static files in production
// if (process.env.NODE_ENV === "production") {
//     app.use(express.static(path.join(__dirname, "/frontend/dist")));

//     app.get("*", (req, res) => {
//         res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
//     });
// }

// // Start server
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
//     connectMongoDB();
// });


import path from "path";
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

// Initialiser Socket.IO avec le serveur HTTP
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://hacktweet.vercel.app' 
      : 'http://localhost:3000',
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
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

// Configure CORS with credentials support
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
  ? 'https://hacktweet.vercel.app' 
  : 'http://localhost:3000', // Your frontend URL
  credentials: true,               // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Dans server.js ou une route d'API dédiée
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