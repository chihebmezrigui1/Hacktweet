import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  bio: {
    type: String,
    required: false
  },
  age: {
    type: String,
    required: true
  },
  interest: {
    type: String,
    required: false
  },
  tweets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Like'
  }],
  retweets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Retweet'
  }],
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reply'
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bookmark'
  }],
  follows: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Follow'
  }],
  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],
  searchHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SearchHistory'
  }]
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
