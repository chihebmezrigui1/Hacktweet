import express from "express";
import { 
  getMessages, 
  sendMessage, 
  getUnreadCount, 
  getConversations,
  markMessagesAsRead
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

// Mettre les routes spécifiques AVANT les routes paramétrées
// Route pour obtenir le nombre de messages non lus
router.get("/unread-count", protectRoute, getUnreadCount);

// Route pour obtenir les conversations
router.get("/conversations", protectRoute, getConversations);

// Routes paramétrées
// Obtenir les messages d'une conversation spécifique
router.get("/:id", protectRoute, getMessages);

// Envoyer un message
router.post("/send/:id", protectRoute, sendMessage);

// Marquer tous les messages d'un expéditeur comme lus
router.put("/:id/read", protectRoute, markMessagesAsRead);

export default router;