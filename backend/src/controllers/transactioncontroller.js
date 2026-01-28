const Transaction = require('../models/Transaction');
const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const bKashService = require('../services/bkashService');
const sendSMS = require('../utils/sms');
const sendEmail = require('../utils/email');

// @desc    Initiate deposit
// @route   POST /api/transactions/deposit/initiate
// @access  Private
exports.initiateDeposit = async (req, res, next) => {
  try {
    const { amount, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validate amount
    const minDeposit = 100;
    const maxDeposit = 50000;
    
    if (amount < minDeposit) {
      return res.status(400).json({
        success: false,
        error: `Minimum deposit amount is ${minDeposit}৳`
      });
    }
    
    if (amount > maxDeposit) {
      return res.status(400).json({
        success: false,
        error: `Maximum deposit amount is ${maxDeposit}৳`
      });
    }

    // Create pending transaction
    const transaction = await Transaction.create({
      user: userId,
      type: 'deposit',
      amount,
      status: 'pending',
      paymentMethod,
      description: `Deposit via ${paymentMethod.toUpperCase()}`,
      paymentDetails: {
        senderNumber: req.user.phone
      },
      ipAddress: req.ipAddress,
      userAgent: req.userAgent
    });

    // Generate payment gateway URL (bKash/Nagad/Rocket)
    let paymentUrl;
    let paymentInstructions;
    
    switch(paymentMethod) {
      case 'bkash':
        paymentInstructions = {
          number: '01340809337',
          steps: [
            'Dial *247#',
            'Select "Send Money"',
            'Enter the number above',
            `Enter amount: ${amount}৳`,
            'Enter your bKash PIN',
            'Enter reference: ' + transaction.reference
          ]
        };
        // For production, integrate with bKash API
        // paymentUrl = await bKashService.createPayment(amount, transaction.reference);
        break;
        
      case 'nagad':
        paymentInstructions = {
          number: '01340809337',
          steps: [
            'Open Nagad App',
            'Select "Send Money"',
            'Enter the number above',
            `Enter amount: ${amount}৳`,
            'Enter your Nagad PIN',
            'Enter reference: ' + transaction.reference
          ]
        };
        break;
        
      case 'rocket':
        paymentInstructions = {
          number: '01340809337R',
          steps: [
            'Dial *322#',
            'Select "Send Money"',
            'Enter the number above (with R)',
            `Enter amount: ${amount}৳`,
            'Enter your Rocket PIN',
            'Enter reference: ' + transaction.reference
          ]
        };
        break;
    }

    // Send payment instructions via SMS
    try {
      const smsMessage = `Sun Bank Deposit: Send ${amount}৳ to ${paymentInstructions.number}. Ref: ${transaction.reference}`;
      await sendSMS(req.user.phone, smsMessage);
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
    }

    res.json({
      success: true,
      transaction: {
        id: transaction._id,
        reference: transaction.reference,
        amount,
        paymentMethod,
        status: transaction.status
      },
      paymentInstructions,
      message: 'Please complete the payment and verify with transaction ID'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Verify deposit
// @route   POST /api/transactions/deposit/verify
// @access  Private
exports.verifyDeposit = async (req, res, next) => {
  try {
    const { transactionId, paymentMethod } = req.body;
    const userId = req.user.id;

    // Find pending transaction
    const transaction = await Transaction.findOne({
      user: userId,
      'paymentDetails.transactionId': transactionId,
      type: 'deposit',
      status: 'pending'
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or already processed'
      });
    }

    // In production: Verify with payment gateway API
    // const verification = await bKashService.executePayment(transactionId);
    
    // For demo, simulate verification
    const isVerified = true; // Change this based on actual verification
    
    if (!isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Transaction verification failed'
      });
    }

    // Update transaction
    transaction.status = 'completed';
    transaction.paymentDetails.transactionId = transactionId;
    transaction.processedAt = Date.now();
    
    await transaction.save();

    // Update user balance (handled by transaction post-save middleware)

    // Send confirmation
    try {
      await sendSMS(
        req.user.phone,
        `Deposit of ${transaction.amount}৳ successful. New balance: ${req.user.balance + transaction.amount}৳`
      );
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
    }

    res.json({
      success: true,
      transaction: {
        id: transaction._id,
        reference: transaction.reference,
        amount: transaction.amount,
        status: transaction.status,
        processedAt: transaction.processedAt
      },
      message: 'Deposit verified successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Request withdrawal
// @route   POST /api/transactions/withdraw/request
// @access  Private
exports.requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, paymentMethod, accountNumber } = req.body;
    const userId = req.user.id;

    // Get user with current balance
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Validate amount
    const minWithdrawal = 500;
    const maxWithdrawal = 50000;
    
    if (amount < minWithdrawal) {
      return res.status(400).json({
        success: false,
        error: `Minimum withdrawal amount is ${minWithdrawal}৳`
      });
    }
    
    if (amount > maxWithdrawal) {
      return res.status(400).json({
        success: false,
        error: `Maximum withdrawal amount is ${maxWithdrawal}৳`
      });
    }

    // Check available balance
    const availableBalance = user.balance;
    
    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: ${availableBalance}৳`
      });
    }

    // Check daily withdrawal limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayWithdrawals = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          type: 'withdrawal',
          status: { $in: ['pending', 'processing', 'completed'] },
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const dailyWithdrawal = todayWithdrawals[0]?.total || 0;
    const dailyLimit = 100000;
    
    if (dailyWithdrawal + amount > dailyLimit) {
      return res.status(400).json({
        success: false,
        error: `Daily withdrawal limit exceeded. Daily limit: ${dailyLimit}৳, Used: ${dailyWithdrawal}৳`
      });
    }

    // Calculate charges (2%)
    const charge = amount * 0.02;
    const netAmount = amount - charge;

    // Create withdrawal request
    const transaction = await Transaction.create({
      user: userId,
      type: 'withdrawal',
      amount,
      netAmount,
      charge,
      status: 'pending',
      paymentMethod,
      description: `Withdrawal to ${paymentMethod.toUpperCase()}: ${accountNumber}`,
      paymentDetails: {
        receiverNumber: accountNumber,
        senderNumber: req.user.phone
      },
      ipAddress: req.ipAddress,
      userAgent: req.userAgent
    });

    // Send notification to admin
    try {
      const adminNotification = `New withdrawal request: ${amount}৳ from ${user.phone}. Ref: ${transaction.reference}`;
      // Send to admin dashboard/webhook
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }

    res.json({
      success: true,
      transaction: {
        id: transaction._id,
        reference: transaction.reference,
        amount,
        charge,
        netAmount,
        paymentMethod,
        accountNumber,
        status: transaction.status
      },
      message: 'Withdrawal request submitted. It will be processed within 24 hours.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get user transactions
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, status, paymentMethod, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { user: userId };
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: transactions.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      transactions
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get pending transactions (Admin)
// @route   GET /api/transactions/admin/pending
// @access  Admin
exports.getPendingTransactions = async (req, res, next) => {
  try {
    const { type } = req.query;
    
    const query = { 
      status: 'pending',
      ...(type && { type })
    };

    const transactions = await Transaction.find(query)
      .populate('user', 'fullName phone accountNumber')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: transactions.length,
      transactions
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Process transaction (Admin)
// @route   PUT /api/transactions/admin/:id/process
// @access  Admin
exports.processTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Transaction is not pending'
      });
    }

    // For withdrawals: Process payment via payment gateway
    if (transaction.type === 'withdrawal') {
      // Simulate payment processing
      const paymentSuccessful = true; // In production, call payment gateway API
      
      if (!paymentSuccessful) {
        return res.status(500).json({
          success: false,
          error: 'Payment processing failed'
        });
      }

      transaction.status = 'completed';
      transaction.processedBy = req.user.id;
      transaction.processedAt = Date.now();
      transaction.notes = req.body.notes || 'Processed by admin';

      await transaction.save();

      // Send notification to user
      try {
        await sendSMS(
          transaction.user.phone,
          `Your withdrawal of ${transaction.amount}৳ has been processed. Net amount: ${transaction.netAmount}৳ has been sent to your ${transaction.paymentMethod} account.`
        );
      } catch (smsError) {
        console.error('Failed to send SMS:', smsError);
      }

    } else if (transaction.type === 'deposit') {
      // For deposits: Mark as completed
      transaction.status = 'completed';
      transaction.processedBy = req.user.id;
      transaction.processedAt = Date.now();
      transaction.notes = req.body.notes || 'Verified by admin';

      await transaction.save();
    }

    res.json({
      success: true,
      transaction,
      message: 'Transaction processed successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Reject transaction (Admin)
// @route   PUT /api/transactions/admin/:id/reject
// @access  Admin
exports.rejectTransaction = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const transaction = await Transaction.findById(req.params.id)
      .populate('user');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Transaction is not pending'
      });
    }

    // For withdrawals: Refund to user balance
    if (transaction.type === 'withdrawal') {
      const user = await User.findById(transaction.user._id);
      
      // Refund the amount (subtract was already done in post-save)
      user.balance += transaction.amount;
      user.totalWithdraw -= transaction.amount;
      await user.save();
    }

    transaction.status = 'rejected';
    transaction.processedBy = req.user.id;
    transaction.processedAt = Date.now();
    transaction.notes = reason;

    await transaction.save();

    // Send rejection notification
    try {
      await sendSMS(
        transaction.user.phone,
        `Your ${transaction.type} request of ${transaction.amount}৳ has been rejected. Reason: ${reason}`
      );
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
    }

    res.json({
      success: true,
      transaction,
      message: 'Transaction rejected successfully'
    });

  } catch (error) {
    next(error);
  }
};
