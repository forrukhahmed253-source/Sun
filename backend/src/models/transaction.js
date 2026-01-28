const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'investment', 'profit', 'commission', 'refund', 'bonus'],
    required: true
  },
  
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  
  netAmount: {
    type: Number,
    required: function() {
      return this.type === 'withdrawal';
    }
  },
  
  charge: {
    type: Number,
    default: 0
  },
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  
  paymentMethod: {
    type: String,
    enum: ['bkash', 'nagad', 'rocket', 'bank', 'credit_card', 'wallet'],
    required: true
  },
  
  paymentDetails: {
    transactionId: String,
    senderNumber: String,
    receiverNumber: String,
    bankName: String,
    accountNumber: String,
    cardLastFour: String,
    gatewayResponse: Object
  },
  
  description: {
    type: String,
    required: true
  },
  
  reference: {
    type: String,
    unique: true,
    default: function() {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 9000 + 1000);
      return `TXN${timestamp}${random}`;
    }
  },
  
  metadata: {
    packageId: mongoose.Schema.Types.ObjectId,
    userPackageId: mongoose.Schema.Types.ObjectId,
    withdrawRequestId: mongoose.Schema.Types.ObjectId,
    profitDate: Date
  },
  
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  processedAt: Date,
  
  notes: String,
  
  ipAddress: String,
  
  userAgent: String
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ 'paymentDetails.transactionId': 1 });

// Middleware to update user balance based on transaction
transactionSchema.post('save', async function(doc) {
  const User = mongoose.model('User');
  
  if (doc.status === 'completed') {
    const user = await User.findById(doc.user);
    
    switch(doc.type) {
      case 'deposit':
        user.balance += doc.amount;
        user.totalDeposit += doc.amount;
        break;
      case 'withdrawal':
        user.balance -= doc.amount;
        user.totalWithdraw += doc.amount;
        break;
      case 'investment':
        user.balance -= doc.amount;
        user.totalInvestment += doc.amount;
        break;
      case 'profit':
      case 'commission':
      case 'bonus':
        user.balance += doc.amount;
        user.totalProfit += doc.amount;
        break;
    }
    
    await user.save();
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
