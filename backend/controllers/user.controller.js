import Notification from "../models/Notification.js";
import User from "../models/User.js";
import cloudinary from 'cloudinary'
import bcrypt from 'bcrypt';

export const getUserProfile = async (req, res) => {
	const { username } = req.params;

	try {
		const user = await User.findOne({ username }).select("-password");
		if (!user) return res.status(404).json({ message: "User not found" });

		res.status(200).json(user);
	} catch (error) {
		console.log("Error in getUserProfile: ", error.message);
		res.status(500).json({ error: error.message });
	}
};


// export const followUnfollowUser = async (req, res) => {
// 	try {
// 	  const { id } = req.params;
// 	  const userToModify = await User.findById(id);
// 	  const currentUser = await User.findById(req.user._id);
  
// 	  if (id === req.user._id.toString()) {
// 		return res.status(400).json({ error: "You can't follow/unfollow yourself" });
// 	  }
  
// 	  if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });
  
// 	  const isFollowing = currentUser.following.includes(id);
  
// 	  if (isFollowing) {
// 		// Unfollow the user
// 		await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
// 		await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
  
// 		res.status(200).json({ message: "User unfollowed successfully" });
// 	  } else {
// 		// Follow the user
// 		await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
// 		await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
		
// 		try {
// 		  // Send notification to the user if Notification model exists
// 		  if (typeof Notification !== 'undefined') {
// 			const newNotification = new Notification({
// 			  type: "follow",
// 			  from: req.user._id,
// 			  to: userToModify._id,
// 			});
  
// 			await newNotification.save();
// 		  }
// 		} catch (notifError) {
// 		  // Log notification error but don't fail the follow operation
// 		  console.log("Error creating notification: ", notifError.message);
// 		  // The follow action was still successful, so we continue
// 		}
  
// 		res.status(200).json({ message: "User followed successfully" });
// 	  }
// 	} catch (error) {
// 	  console.log("Error in followUnfollowUser: ", error.message);
// 	  res.status(500).json({ error: error.message });
// 	}
//   };

import { io, userSockets } from '../server.js'; // Importez io et userSockets depuis votre fichier server.js

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: "You can't follow/unfollow yourself" });
    }

    if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      // Unfollow the user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

      res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      // Follow the user
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
      
      try {
        // Créer la notification sans condition superflue
        const newNotification = new Notification({
          type: "follow",
          from: req.user._id,
          to: userToModify._id,
        });

        // Sauvegarder la notification
        const savedNotification = await newNotification.save();
        
        // Populate des données utilisateur pour l'envoi au client
        const populatedNotification = await Notification.findById(savedNotification._id)
          .populate('from', 'username profileImg')
          .populate('to');
        
        // Émettre la notification via socket.io
        if (userToModify._id) {
          console.log(`Émission de notification follow vers ${userToModify._id}`);
          // Vérifier si l'utilisateur a un socket actif
          const socketId = userSockets[userToModify._id.toString()];
          if (socketId) {
            io.to(socketId).emit('new-notification', populatedNotification);
          }
        }
      } catch (notifError) {
        // Log notification error but don't fail the follow operation
        console.log("Error creating notification: ", notifError.message);
        // The follow action was still successful, so we continue
      }

      res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.log("Error in followUnfollowUser: ", error.message);
    res.status(500).json({ error: error.message });
  }
};



export const getSuggestedUsers = async (req, res) => {
	try {
		const userId = req.user._id;

		const usersFollowedByMe = await User.findById(userId).select("following");

		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},
			{ $sample: { size: 10 } },
		]);

		// 1,2,3,4,5,6,
		const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));
		const suggestedUsers = filteredUsers.slice(0, 4);

		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (error) {
		console.log("Error in getSuggestedUsers: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const updateUser = async (req, res) => {
	const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
	let { profileImg, coverImg } = req.body;

	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
			return res.status(400).json({ error: "Please provide both current password and new password" });
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
			// if (newPassword.length < 6) {
			// 	return res.status(400).json({ error: "Password must be at least 6 characters long" });
			// }

			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}

		if (profileImg) {
			if (user.profileImg) {
				// https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
				await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profileImg);
			profileImg = uploadedResponse.secure_url;
		}

		if (coverImg) {
			if (user.coverImg) {
				await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(coverImg);
			coverImg = uploadedResponse.secure_url;
		}

		user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;
		user.link = link || user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;

		user = await user.save();

		// password should be null in response
		user.password = null;

		return res.status(200).json(user);
	} catch (error) {
		console.log("Error in updateUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const getUsersForSidebar = async (req, res) => {

	try {
	  const loggedInUserId = req.user._id;
  
	  // Find all users except the logged-in user
	  const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
  
	  if (!users || users.length === 0) {
		return res.status(200).json([]); 
		// Return empty array instead of error
	  }

	  // Return all users
	  res.status(200).json(users);
	} catch (error) {
	  console.error("Error in getUsersForSidebar: ", error.message);
	  res.status(500).json({ error: "Internal server error" });
	}
	
  };

  export const getUserById = async (req, res) => {
	const { id } = req.params;
  
	try {
	  const user = await User.findById(id).select("-password");
	  if (!user) return res.status(404).json({ message: "User not found" });
  
	  res.status(200).json(user);
	} catch (error) {
	  console.log("Error in getUserById: ", error.message);
	  res.status(500).json({ error: error.message });
	}
  };
  
  export const getFollowingUsers = async (req, res) => {
	try {
	  const { username } = req.params;
	  
	  // Trouver l'utilisateur par nom d'utilisateur
	  const user = await User.findOne({ username });
	  if (!user) {
		return res.status(404).json({ error: "Utilisateur non trouvé" });
	  }
	  
	  // Récupérer la liste des utilisateurs suivis
	  const following = await User.find({ 
		_id: { $in: user.following } 
	  }).select("-password");
	  
	  res.status(200).json(following);
	} catch (error) {
	  console.log("Error in getFollowingUsers: ", error.message);
	  res.status(500).json({ error: "Internal server error" });
	}
  };