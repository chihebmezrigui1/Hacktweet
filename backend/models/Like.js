import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  tweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const Like = mongoose.models.Like || mongoose.model('Like', likeSchema);

export default Like;
