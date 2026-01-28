const mongoose = require('mongoose');

const userPackageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  
  purchaseAmount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  
  expectedProfit: {
    type: Number,
    required: true,
    min: [0, 'Profit cannot be negative']
  },
  
  dailyProfit: {
    type: Number,
    required: true
  },
  
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  endDate: {
    type: Date,
    required: true
  },
  
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'pending'],
    default: 'active'
  },
  
  profitPaid: {
    type: Number,
    default: 0
  },
  
  profitPending: {
    type: Number,
    default: function() {
      return this.expectedProfit;
    }
  },
  
  lastProfitDate: Date,
  
  nextProfitDate: {
    type: Date,
    default: function() {
      const nextDay = new Date(this.startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return nextDay;
    }
  },
  
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  autoRenew: {
    type: Boolean,
    default: false
  },
  
  // Commission tracking
  commissionPaid: {
    type: Boolean,
    default: false
  },
  
  referralCommission: {
    amount: Number,
    paidTo: mongoose.Schema.Types.ObjectId,
    paidAt: Date
  },
  
  agentCommission: {
    amount: Number,
    paidTo: mongoose.Schema.Types.ObjectId,
    paidAt: Date
  },
  
  notes: String
}, {
  timestamps: true
});

// Calculate end date before saving
userPackageSchema.pre('save', function(next) {
  if (this.isModified('startDate') || this.isModified('durationDays')) {
    const Package = mongoose.model('Package');
    
    Package.findById(this.package).then(pkg => {
      if (pkg) {
        const endDate = new Date(this.startDate);
        endDate.setDate(endDate.getDate() + pkg.durationDays);
        this.endDate = endDate;
        this.nextProfitDate = new Date(this.startDate);
        this.nextProfitDate.setDate(this.nextProfitDate.getDate() + 1);
      }
      next();
    }).catch(next);
  } else {
    next();
  }
});

// Indexes
userPackageSchema.index({ user: 1, status: 1 });
userPackageSchema.index({ endDate: 1 });
userPackageSchema.index({ nextProfitDate: 1 });

// Virtual for days remaining
userPackageSchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'active') return 0;
  
  const today = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for total days
userPackageSchema.virtual('totalDays').get(function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = end - start;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('UserPackage', userPackageSchema);
