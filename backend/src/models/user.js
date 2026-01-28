const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  // Personal Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^01[3-9]\d{8}$/.test(v);
      },
      message: 'Please provide a valid Bangladeshi phone number'
    }
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  nidNumber: {
    type: String,
    sparse: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$|^\d{13}$|^\d{17}$/.test(v);
      },
      message: 'Please provide a valid NID number'
    }
  },
  
  dateOfBirth: {
    type: Date
  },
  
  // Account Information
  accountNumber: {
    type: String,
    unique: true,
    default: function() {
      return 'SB' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);
    }
  },
  
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalDeposit: {
    type: Number,
    default: 0
  },
  
  totalWithdraw: {
    type: Number,
    default: 0
  },
  
  totalInvestment: {
    type: Number,
    default: 0
  },
  
  totalProfit: {
    type: Number,
    default: 0
  },
  
  // Security
  pin: {
    type: String,
    minlength: [4, 'PIN must be 4 digits'],
    maxlength: [6, 'PIN cannot exceed 6 digits'],
    select: false
  },
  
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  
  // Status
  isVerified: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  role: {
    type: String,
    enum: ['user', 'agent', 'admin', 'superadmin'],
    default: 'user'
  },
  
  // Verification
  verificationCode: String,
  verificationExpires: Date,
  
  // Profile
  profileImage: String,
  address: String,
  occupation: String,
  referralCode: {
    type: String,
    unique: true,
    default: function() {
      return Math.random().toString(36).substr(2, 8).toUpperCase();
    }
  },
  
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Timestamps
  lastLogin: Date,
  lastPasswordChange: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
userSchema.virtual('activePackages', {
  ref: 'UserPackage',
  localField: '_id',
  foreignField: 'user',
  count: true
});

userSchema.virtual('totalReferrals', {
  ref: 'User',
  localField: '_id',
  foreignField: 'referredBy',
  count: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS));
    this.password = await bcrypt.hash(this.password, salt);
    this.lastPasswordChange = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Hash PIN before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('pin')) return next();
  
  if (this.pin) {
    const salt = await bcrypt.genSalt(6);
    this.pin = await bcrypt.hash(this.pin, salt);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare PIN
userSchema.methods.comparePin = async function(candidatePin) {
  if (!this.pin) return false;
  return await bcrypt.compare(candidatePin, this.pin);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: this._id, role: this.role, phone: this.phone },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Method to hide sensitive information
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.pin;
  delete obj.verificationCode;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
