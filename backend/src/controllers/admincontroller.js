const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Package = require('../models/Package');
const UserPackage = require('../models/UserPackage');
const mongoose = require('mongoose');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Get counts using aggregation
    const [
      totalUsers,
      todayUsers,
      totalDeposits,
      todayDeposits,
      totalWithdrawals,
      pendingWithdrawals,
      activeInvestments,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      Transaction.aggregate([
        { $match: { type: 'deposit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { 
          $match: { 
            type: 'deposit', 
            status: 'completed',
            createdAt: { $gte: today }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'withdrawal', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'withdrawal', status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      UserPackage.countDocuments({ status: 'active' }),
      Transaction.aggregate([
        { $match: { type: 'investment', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Calculate growth percentages
    const userGrowth = todayUsers > 0 ? ((todayUsers / totalUsers) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        todayUsers,
        userGrowth: `${userGrowth}%`,
        totalDeposits: totalDeposits[0]?.total || 0,
        todayDeposits: todayDeposits[0]?.total || 0,
        totalWithdrawals: totalWithdrawals[0]?.total || 0,
        pendingWithdrawals: pendingWithdrawals[0]?.total || 0,
        activeInvestments,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get users with pagination and filters
// @route   GET /api/admin/users
// @access  Admin
exports.getUsers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status, 
      verified,
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { accountNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.isActive = status === 'active';
    if (verified !== undefined) query.isVerified = verified === 'true';

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password -pin -verificationCode'),
      User.countDocuments(query)
    ]);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [depositStats, investmentStats, packageStats] = await Promise.all([
          Transaction.aggregate([
            { $match: { user: user._id, type: 'deposit', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
          ]),
          Transaction.aggregate([
            { $match: { user: user._id, type: 'investment', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
          ]),
          UserPackage.countDocuments({ user: user._id, status: 'active' })
        ]);

        const userObj = user.toObject();
        userObj.stats = {
          totalDeposit: depositStats[0]?.total || 0,
          depositCount: depositStats[0]?.count || 0,
          totalInvestment: investmentStats[0]?.total || 0,
          investmentCount: investmentStats[0]?.count || 0,
          activePackages: packageStats
        };

        return userObj;
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Admin
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -pin -verificationCode')
      .populate('referredBy', 'fullName phone');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user transactions
    const [transactions, packages, referrals] = await Promise.all([
      Transaction.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(20),
      UserPackage.find({ user: user._id })
        .populate('package', 'name price')
        .sort({ createdAt: -1 }),
      User.find({ referredBy: user._id })
        .select('fullName phone createdAt')
        .sort({ createdAt: -1 })
    ]);

    // Get financial summary
    const financialSummary = await Transaction.aggregate([
      { $match: { user: user._id, status: 'completed' } },
      { $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      } }
    ]);

    res.json({
      success: true,
      user,
      transactions,
      packages,
      referrals,
      financialSummary
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Admin
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.isActive = status === 'active';
    await user.save();

    // Log the action
    console.log(`User ${user._id} status updated to ${status} by admin ${req.user.id}. Reason: ${reason}`);

    // Send notification to user
    try {
      const SMS = require('../utils/sms');
      await SMS.sendSMS(
        user.phone,
        `Your account has been ${status === 'active' ? 'activated' : 'deactivated'}. ${reason ? `Reason: ${reason}` : ''}`
      );
    } catch (smsError) {
      console.error('Failed to send status update SMS:', smsError);
    }

    res.json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions (admin)
// @route   GET /api/admin/transactions
// @access  Admin
exports.getAllTransactions = async (req, res, next) => {
  try {
    const { 
      type, 
      status, 
      paymentMethod,
      startDate, 
      endDate,
      search,
      page = 1, 
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search by user phone or transaction reference
    if (search) {
      const users = await User.find({
        $or: [
          { phone: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } },
          { accountNumber: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map(user => user._id);
      
      query.$or = [
        { user: { $in: userIds } },
        { reference: { $regex: search, $options: 'i' } },
        { 'paymentDetails.transactionId': { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('user', 'fullName phone accountNumber')
        .populate('processedBy', 'fullName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    // Get summary statistics
    const summary = await Transaction.aggregate([
      { $match: query },
      { $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        depositAmount: { 
          $sum: { 
            $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0] 
          }
        },
        withdrawalAmount: { 
          $sum: { 
            $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0] 
          }
        },
        investmentAmount: { 
          $sum: { 
            $cond: [{ $eq: ['$type', 'investment'] }, '$amount', 0] 
          }
        },
        count: { $sum: 1 }
      } }
    ]);

    res.json({
      success: true,
      transactions,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      summary: summary[0] || {
        totalAmount: 0,
        depositAmount: 0,
        withdrawalAmount: 0,
        investmentAmount: 0,
        count: 0
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction analytics
// @route   GET /api/admin/transactions/analytics
// @access  Admin
exports.getTransactionAnalytics = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    
    let days;
    switch(range) {
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      default:
        days = 30;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Daily transaction data
    const dailyData = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          data: {
            $push: {
              type: '$_id.type',
              amount: '$amount',
              count: '$count'
            }
          },
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Type distribution
    const typeDistribution = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Payment method distribution
    const methodDistribution = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          type: { $in: ['deposit', 'withdrawal'] },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Status distribution
    const statusDistribution = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      dailyData,
      typeDistribution,
      methodDistribution,
      statusDistribution
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get package analytics
// @route   GET /api/admin/packages/analytics
// @access  Admin
exports.getPackageAnalytics = async (req, res, next) => {
  try {
    // Package sales by category
    const packageSales = await Package.aggregate([
      {
        $group: {
          _id: '$category',
          totalSales: { $sum: '$totalSales' },
          totalRevenue: { $sum: '$totalRevenue' },
          packageCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Top selling packages
    const topPackages = await Package.find()
      .sort({ totalSales: -1 })
      .limit(10)
      .select('name price category totalSales totalRevenue');

    // Monthly package sales
    const monthlySales = await UserPackage.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) 
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$purchaseAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    // Package completion rate
    const completionStats = await UserPackage.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      packageSales,
      topPackages,
      monthlySales,
      completionStats
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Export transactions to CSV
// @route   GET /api/admin/transactions/export
// @access  Admin
exports.exportTransactions = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;

    const query = { status: 'completed' };
    
    if (type) query.type = type;
    if (startDate) query.createdAt = { $gte: new Date(startDate) };
    if (endDate) {
      if (!query.createdAt) query.createdAt = {};
      query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('user', 'fullName phone accountNumber')
      .sort({ createdAt: -1 })
      .limit(5000); // Limit for performance

    // Convert to CSV
    const csvData = transactions.map(t => ({
      Date: new Date(t.createdAt).toISOString().split('T')[0],
      Time: new Date(t.createdAt).toISOString().split('T')[1].split('.')[0],
      'Transaction ID': t.reference,
      Type: t.type.toUpperCase(),
      'User Name': t.user?.fullName || 'N/A',
      'User Phone': t.user?.phone || 'N/A',
      'Account Number': t.user?.accountNumber || 'N/A',
      Amount: t.amount,
      Charge: t.charge || 0,
      'Net Amount': t.netAmount || t.amount,
      'Payment Method': t.paymentMethod.toUpperCase(),
      'Transaction ID (Gateway)': t.paymentDetails?.transactionId || 'N/A',
      Status: t.status,
      Description: t.description
    }));

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');

    // Convert to CSV string
    const csvString = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(','))
    ].join('\n');

    res.send(csvString);

  } catch (error) {
    next(error);
  }
};

// @desc    Send bulk notification
// @route   POST /api/admin/notifications/bulk
// @access  Admin
exports.sendBulkNotification = async (req, res, next) => {
  try {
    const { title, message, type, targetUsers } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get target users
    let users;
    if (targetUsers === 'all') {
      users = await User.find({ isActive: true }).select('phone email fullName');
    } else if (targetUsers === 'verified') {
      users = await User.find({ isActive: true, isVerified: true }).select('phone email fullName');
    } else if (targetUsers === 'investors') {
      // Users who have made at least one investment
      const investors = await Transaction.distinct('user', { type: 'investment' });
      users = await User.find({ 
        _id: { $in: investors },
        isActive: true 
      }).select('phone email fullName');
    }

    if (!users || users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No users found for the selected criteria'
      });
    }

    // Send notifications based on type
    let results = { sms: { sent: 0, failed: 0 }, email: { sent: 0, failed: 0 } };

    if (type === 'sms' || type === 'both') {
      const SMS = require('../utils/sms');
      
      const smsResults = await SMS.sendBulkSMS(
        users.map(u => u.phone),
        `${title ? title + ': ' : ''}${message}`
      );
      
      results.sms = smsResults;
    }

    if (type === 'email' || type === 'both') {
      const Email = require('../utils/email');
      
      const emailPromises = users
        .filter(u => u.email)
        .map(user => 
          Email.sendEmail({
            email: user.email,
            subject: title || 'Notification from Sun Bank',
            template: 'notification',
            context: {
              name: user.fullName,
              message
            }
          }).then(() => ({ status: 'fulfilled' }))
            .catch(() => ({ status: 'rejected' }))
        );

      const emailResults = await Promise.allSettled(emailPromises);
      results.email = {
        sent: emailResults.filter(r => r.status === 'fulfilled').length,
        failed: emailResults.filter(r => r.status === 'rejected').length
      };
    }

    // Log the notification
    console.log(`Bulk notification sent by admin ${req.user.id}. Target: ${targetUsers}, Type: ${type}, Users: ${users.length}`);

    res.json({
      success: true,
      message: 'Bulk notification sent successfully',
      results,
      totalUsers: users.length
    });

  } catch (error) {
    next(error);
  }
};
