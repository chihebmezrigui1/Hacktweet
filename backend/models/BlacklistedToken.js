// models/BlacklistedToken.js
import mongoose from "mongoose";

const BlacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '15d' // Expire automatiquement après 15 jours (même durée que vos tokens)
  }
});

const BlacklistedToken = mongoose.model("BlacklistedToken", BlacklistedTokenSchema);
export default BlacklistedToken;