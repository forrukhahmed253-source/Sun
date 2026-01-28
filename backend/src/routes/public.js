const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Get public stats
// @route   GET /api/public/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const [
      totalInvestors,
      totalInvested,
      totalPaid,
      activePackages
    ] = await Promise.all([
      User.countDocuments({ isActive: true, isVerified: true }),
      Transaction.aggregate([
        { $match: { type: 'investment', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'profit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Count active user packages
      require('../models/UserPackage').countDocuments({ status: 'active' })
    ]);

    res.json({
      totalInvestors,
      totalInvested: totalInvested[0]?.total || 0,
      totalPaid: totalPaid[0]?.total || 0,
      activePackages
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// @desc    Get featured packages
// @route   GET /api/public/packages/featured
// @access  Public
router.get('/packages/featured', async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true, isPopular: true })
      .limit(4)
      .sort({ price: 1 });

    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// @desc    Get testimonials
// @route   GET /api/public/testimonials
// @access  Public
router.get('/testimonials', async (req, res) => {
  try {
    // In production, fetch from database
    const testimonials = [
      {
        name: "Md. Rahman",
        role: "Business Owner",
        content: "Started with 10,000৳ and now earning 3,000৳ monthly profit.",
        rating: 5,
        profit: "300,000৳+"
      },
      // ... more testimonials
    ];

    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// @desc    Check phone availability
// @route   POST /api/public/check-phone
// @access  Public
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    
    const user = await User.findOne({ phone });
    
    res.json({
      available: !user,
      message: user ? 'Phone number already registered' : 'Phone number available'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check phone' });
  }
});

// @desc    Get system status
// @route   GET /api/public/status
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const status = {
      system: 'operational',
      maintenance: false,
      deposits: 'operational',
      withdrawals: 'operational',
      lastUpdated: new Date(),
      message: 'All systems operational'
    };

    // Check MongoDB connection
    const mongoose = require('mongoose');
    status.database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

module.exports = router;
