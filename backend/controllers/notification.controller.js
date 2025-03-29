// import Notification from "mongoose/TweeterHackatonIpssi/backend/models/Notifications.js";

// export const getNotifications = async (req, res) => {
//     try {
//         const notifications = await Notification.find({ to: req.user._id }).sort({ createdAt: -1 });
//         res.status(200).json(notifications);
//     } catch (error) {
//         console.log("Error in getNotifications:", error.message);
//         res.status(500).json({ error: error.message });
//     }
// };

// export const markAsRead = async (req, res) => {
//     try {
//         await Notification.updateMany({ to: req.user._id, read: false }, { read: true });
//         res.status(200).json({ message: "Notifications marked as read" });
//     } catch (error) {
//         console.log("Error in markAsRead:", error.message);
//         res.status(500).json({ error: error.message });
//     }
// };


// import Notification from "../models/Notification.js";

// // Dans votre contrôleur backend
// export const getNotifications = async (req, res) => {
// 	try {
// 	  const userId = req.user._id;
  
// 	  const notifications = await Notification.find({ to: userId }).populate({
// 		path: "from",
// 		select: "username profileImg",
// 	  });
  
// 	  // Assurez-vous que les données sont formatées correctement pour le frontend
// 	  res.status(200).json(notifications);
// 	} catch (error) {
// 	  console.log("Error in getNotifications function", error.message);
// 	  res.status(500).json({ error: "Internal Server Error" });
// 	}
//   };

// export const deleteNotifications = async (req, res) => {
// 	try {
// 		const userId = req.user._id;

// 		await Notification.deleteMany({ to: userId });

// 		res.status(200).json({ message: "Notifications deleted successfully" });
// 	} catch (error) {
// 		console.log("Error in deleteNotifications function", error.message);
// 		res.status(500).json({ error: "Internal Server Error" });
// 	}
// };


import Notification from "../models/Notification.js";
import { io, userSockets } from '../server.js';  // Importez io et userSockets

// Récupérer les notifications
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
  
        const notifications = await Notification.find({ to: userId })
            .populate({
                path: "from",
                select: "username profileImg",
            })
            .sort({ createdAt: -1 });  // Triez par date de création (plus récentes d'abord)
  
        res.status(200).json(notifications);
    } catch (error) {
        console.log("Error in getNotifications function", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Supprimer toutes les notifications d'un utilisateur
export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.deleteMany({ to: userId });

        // Informer le client que les notifications ont été supprimées
        const recipientSocketId = userSockets[userId.toString()];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('notifications-cleared');
        }

        res.status(200).json({ message: "Notifications deleted successfully" });
    } catch (error) {
        console.log("Error in deleteNotifications function", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Marquer une notification comme lue
export const markNotificationAsRead = async (req, res) => {
    try {
        const { id: notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        // Vérifier que la notification appartient bien à l'utilisateur
        if (notification.to.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Marquer comme lue
        notification.read = true;
        await notification.save();

        res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        console.log("Error in markNotificationAsRead function", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Marquer toutes les notifications comme lues
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { to: userId, read: false },
            { $set: { read: true } }
        );

        // Informer le client que toutes les notifications ont été lues
        const recipientSocketId = userSockets[userId.toString()];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('all-notifications-read');
        }

        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.log("Error in markAllNotificationsAsRead function", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Obtenir le nombre de notifications non lues
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const count = await Notification.countDocuments({ 
            to: userId, 
            read: false 
        });

        res.status(200).json({ count });
    } catch (error) {
        console.log("Error in getUnreadCount function", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// delete by id
export const deleteNotification = async (req, res) => {
    try {
        const { id: notificationId } = req.params;
        const userId = req.user._id;

        // Chercher la notification par ID
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        // Vérifier que la notification appartient bien à l'utilisateur
        if (notification.to.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Utiliser `findByIdAndDelete` pour supprimer la notification
        await Notification.findByIdAndDelete(notificationId);

        // Informer le client que la notification a été supprimée
        const recipientSocketId = userSockets[userId.toString()];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('notification-deleted', notificationId);
        }

        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.log("Error in deleteNotification function", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
