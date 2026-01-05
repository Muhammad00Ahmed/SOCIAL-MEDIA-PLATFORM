const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide first name'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Please provide last name'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  username: {
    type: String,
    required: [true, 'Please provide username'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  profilePicture: {
    public_id: String,
    url: {
      type: String,
      default: 'https://via.placeholder.com/150'
    }
  },
  coverPhoto: {
    public_id: String,
    url: String
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  location: {
    city: String,
    country: String,
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
  website: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please provide a valid URL']
  },
  phone: {
    type: String,
    match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number']
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  sentFriendRequests: [{
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    },
    postVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'friends'
    },
    friendListVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'friends'
    },
    allowMessagesFrom: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'everyone'
    },
    showOnlineStatus: {
      type: Boolean,
      default: true
    }
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    friendRequests: {
      type: Boolean,
      default: true
    },
    messages: {
      type: Boolean,
      default: true
    },
    postInteractions: {
      type: Boolean,
      default: true
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationBadge: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned'],
    default: 'active'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  verificationToken: String,
  verificationTokenExpire: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for friend count
userSchema.virtual('friendCount').get(function() {
  return this.friends.length;
});

// Virtual for follower count
userSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Update online status
userSchema.methods.updateOnlineStatus = async function(isOnline) {
  this.isOnline = isOnline;
  if (!isOnline) {
    this.lastSeen = Date.now();
  }
  await this.save();
};

module.exports = mongoose.model('User', userSchema);