// import express from "express";
// import { protectRoute } from "../middleware/protectRoute.js";
// import { getNotifications, markAsRead } from "../controllers/notification.controller.js";

// const router = express.Router();

// router.get("/", protectRoute, getNotifications);
// router.post("/read", protectRoute, markAsRead);

// export default router;


import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { deleteNotifications,deleteNotification, getNotifications,markNotificationAsRead,markAllNotificationsAsRead,
    getUnreadCount
 } from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.delete("/", protectRoute, deleteNotifications);
router.put("/:id/read", protectRoute, markNotificationAsRead);
router.put("/read-all", protectRoute, markAllNotificationsAsRead);
router.get("/unread-count", protectRoute, getUnreadCount);
router.delete("/:id", protectRoute, deleteNotification);

export default router;
