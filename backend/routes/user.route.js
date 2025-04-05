import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { followUnfollowUser, getSuggestedUsers, getUserProfile,getUserById, updateUser ,getUsersForSidebar, getFollowingUsers} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.get("/following/:username", protectRoute, getFollowingUsers);
router.post("/update", protectRoute, updateUser);
router.get("/getOnlineUsers", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getUserById);


export default router;
