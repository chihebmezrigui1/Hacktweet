import Message from "../models/Message.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Conversation from "../models/Conversation.js";
import { io, userSockets } from '../server.js';

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Trouver toutes les conversations où l'utilisateur est participant
    const conversations = await Conversation.find({
      participants: { $in: [userId] }
    }).populate("participants", "username profileImg");
    
    // Pour chaque conversation, obtenir le dernier message et le compte de messages non lus
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        // Trouver l'autre participant (qui n'est pas l'utilisateur courant)
        const otherParticipant = conversation.participants.find(
          (participant) => participant._id.toString() !== userId.toString()
        );
        
        // Obtenir le dernier message
        const lastMessage = await Message.findOne({
          $or: [
            { 
              senderId: userId, 
              receiverId: otherParticipant._id 
            },
            { 
              senderId: otherParticipant._id, 
              receiverId: userId 
            }
          ]
        }).sort({ createdAt: -1 });
        
        // Compter les messages non lus
        const unreadCount = await Message.countDocuments({
          receiverId: userId,
          senderId: otherParticipant._id,
          read: false
        });
        
        return {
          _id: conversation._id,
          otherParticipant,
          lastMessage: lastMessage?.message || null,
          lastMessageTime: lastMessage?.createdAt || null,
          unreadCount
        };
      })
    );
    
    // Trier par date du dernier message (les plus récents en premier)
    conversationsWithDetails.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });
    
    res.status(200).json(conversationsWithDetails);
  } catch (error) {
    console.error("Error in getConversations controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Vérifier si le message n'est pas vide
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Le message ne peut pas être vide" });
    }

    // Trouver ou créer une conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    // Créer le nouveau message
    const newMessage = new Message({
      senderId,
      receiverId,
      message,
      read: false
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    // Récupérer les informations de l'expéditeur
    const sender = await User.findById(senderId).select("username profileImg");

    // Créer une notification pour le message
    const newNotification = new Notification({
      type: "message",
      from: senderId,
      to: receiverId,
      message: message.length > 50 ? message.substring(0, 50) + "..." : message,
      read: false
    });

    // Sauvegarder tout en parallèle pour de meilleures performances
    await Promise.all([
      conversation.save(),
      newMessage.save(),
      newNotification.save()
    ]);

    // Préparer le payload du message
    const messagePayload = {
      _id: newMessage._id,
      senderId: senderId.toString(),
      senderUsername: sender.username,
      senderProfileImg: sender.profileImg || "",
      receiverId: receiverId.toString(),
      message,
      createdAt: newMessage.createdAt,
      read: false
    };

    // Préparer le payload de la notification
    const notificationPayload = {
      _id: newNotification._id,
      type: "message",
      from: {
        _id: sender._id,
        username: sender.username,
        profileImg: sender.profileImg || ""
      },
      to: receiverId,
      message: newNotification.message,
      createdAt: newNotification.createdAt,
      read: false
    };

    // Récupérer l'ID du socket du destinataire
    const recipientSocketId = userSockets[receiverId.toString()];
    
    // Envoyer le message et la notification au destinataire si en ligne
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("newMessage", messagePayload);
      io.to(recipientSocketId).emit("new-notification", notificationPayload);
      console.log(`Message envoyé à ${receiverId} via socket ${recipientSocketId}`);
    } else {
      console.log(`Destinataire ${receiverId} hors ligne. Le message sera stocké en BDD.`);
    }

    // Renvoyer le message nouvellement créé avec les détails de l'expéditeur
    res.status(201).json({
      ...messagePayload,
      senderUsername: sender.username,
      senderProfileImg: sender.profileImg
    });
  } catch (error) {
    console.error("Error in sendMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    // Trouver la conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    });

    if (!conversation) return res.status(200).json([]);

    // Récupérer les messages avec populate pour avoir toutes les informations
    const messages = await Message.find({
      _id: { $in: conversation.messages }
    }).sort({ createdAt: 1 });

    // Enrichir les messages avec les informations sur l'expéditeur
    const enrichedMessages = await Promise.all(messages.map(async (msg) => {
      const sender = await User.findById(msg.senderId).select("username profileImg");
      return {
        ...msg.toObject(),
        senderUsername: sender?.username,
        senderProfileImg: sender?.profileImg || ""
      };
    }));

    res.status(200).json(enrichedMessages);
  } catch (error) {
    console.error("Error in getMessages controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;
    
    // Mettre à jour tous les messages non lus de ce expéditeur
    const result = await Message.updateMany(
      { 
        senderId, 
        receiverId, 
        read: false 
      },
      { read: true }
    );
    
    res.status(200).json({ 
      message: "Messages marked as read", 
      updatedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error("Error in markMessagesAsRead controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Compter tous les messages non lus où l'utilisateur est le destinataire
    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      read: false
    });
    
    res.status(200).json({ count: unreadCount });
  } catch (error) {
    console.error("Error in getUnreadCount controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};