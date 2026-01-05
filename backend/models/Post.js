const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    text: {
      type: String,
      maxlength: [5000, 'Post content cannot exceed 5000 characters']
    },
    media: [{
      type: {
        type: String,
        enum: ['image', 'video', 'gif'],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      public_id: String,
      thumbnail: String,
      duration: Number, // for videos
      width: Number,
      height: Number
    }],
    link: {
      url: String,
      title: String,
      description: String,
      image: String
    }
  },
  privacy: {
    type: String,
    enum: ['public', 'friends', 'private', 'custom'],
    default: 'friends'
  },
  customPrivacy: {
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    excludedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reactionType: {
      type: String,
      enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
      default: 'like'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    caption: String
  }],
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hashtags: [{
    type: String,
    lowercase: true
  }],
  location: {
    name: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  feeling: {
    type: String,
    enum: ['happy', 'sad', 'excited', 'loved', 'blessed', 'grateful', 'motivated', 'relaxed']
  },
  activity: {
    type: String,
    enum: ['eating', 'drinking', 'watching', 'reading', 'listening', 'playing', 'traveling', 'celebrating']
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  viewedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  scheduledFor: Date,
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived'],
    default: 'published'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'location.coordinates': '2dsphere' });
postSchema.index({ createdAt: -1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for share count
postSchema.virtual('shareCount').get(function() {
  return this.shares.length;
});

// Extract hashtags from text
postSchema.pre('save', function(next) {
  if (this.content.text) {
    const hashtagRegex = /#[\w]+/g;
    const hashtags = this.content.text.match(hashtagRegex);
    if (hashtags) {
      this.hashtags = hashtags.map(tag => tag.substring(1).toLowerCase());
    }
  }
  next();
});

// Increment views
postSchema.methods.incrementViews = async function(userId) {
  // Check if user already viewed
  const alreadyViewed = this.viewedBy.some(
    view => view.user.toString() === userId.toString()
  );
  
  if (!alreadyViewed) {
    this.views += 1;
    this.viewedBy.push({ user: userId });
    await this.save();
  }
};

module.exports = mongoose.model('Post', postSchema);