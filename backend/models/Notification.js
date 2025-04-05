import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
	{
		from: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		to: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		type: {
			type: String,
			required: true,
			enum: ["follow", "like", "comment","bookmarked","repost","message"], // Ajoutez "comment" à la liste des types autorisés
		},
		post: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Post",
			// Ce champ est optionnel car il n'est utilisé que pour les notifications de type "comment" et "like"
		},
		read: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;