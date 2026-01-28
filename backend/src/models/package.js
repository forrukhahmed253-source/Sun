const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Package name is required'],
    unique: true,
    trim: true
  },
  
  description: {
    type: String,
    required: [true, 'Package description is required']
  },
  
  price: {
    type: Number,
    required: [true, 'Package price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  profitAmount: {
    type: Number,
    required: [true, 'Profit amount is required'],
    min: [0, 'Profit cannot be negative']
  },
  
  profitPercentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100%']
  },
  
  durationDays: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 day']
  },
  
  dailyProfit: {
    type: Number,
    default: function() {
      return this.profitAmount / this.durationDays;
    }
  },
  
  totalReturn: {
    type: Number,
    default: function() {
      return this.price + this.profitAmount;
    }
  },
  
  category: {
    type: String,
    enum: ['starter', 'basic', 'silver', 'gold', 'platinum', 'diamond', 'vip', 'premium'],
    default: 'basic'
  },
  
  isPopular: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  minPurchase: {
    type: Number,
    default: 1
  },
  
  maxPurchase: {
    type: Number,
    default: 10
  },
  
  features: [{
    name: String,
    included: {
      type: Boolean,
      default: true
    }
  }],
  
  terms: [String],
  
  // Commission structure
  referralCommission: {
    type: Number,
    default: 0
  },
  
  agentCommission: {
    type: Number,
    default: 0
  },
  
  // Statistics
  totalSales: {
    type: Number,
    default: 0
  },
  
  totalRevenue: {
    type: Number,
    default: 0
  },
  
  // Image
  image: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate totals before saving
packageSchema.pre('save', function(next) {
  this.dailyProfit = this.profitAmount / this.durationDays;
  this.totalReturn = this.price + this.profitAmount;
  
  if (this.profitPercentage && !this.profitAmount) {
    this.profitAmount = (this.price * this.profitPercentage) / 100;
  }
  
  next();
});

module.exports = mongoose.model('Package', packageSchema);
