const User = require('../models/User');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const sendSMS = require('../utils/sms');
const { validationResult } = require('express-validator');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, phone, email, password, referralCode, nidNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ phone }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this phone or email already exists'
      });
    }

    // Find referrer if referral code provided
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user
    const user = await User.create({
      fullName,
      phone,
      email,
      password,
      nidNumber,
      referredBy,
      verificationCode,
      verificationExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    // Send verification SMS
    try {
      await sendSMS(
        phone,
        `Your Sun Bank verification code is: ${verificationCode}. Valid for 10 minutes.`
      );
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
    }

    // Send welcome email if email provided
    if (email) {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Welcome to Sun Bank - Verify Your Account',
          template: 'welcome',
          context: {
            name: user.fullName,
            verificationCode
          }
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }

    // Generate token
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        accountNumber: user.accountNumber,
        referralCode: user.referralCode,
        isVerified: user.isVerified
      },
      message: 'Registration successful. Please verify your phone number.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Verify phone number
// @route   POST /api/auth/verify-phone
// @access  Private
exports.verifyPhone = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Phone number already verified'
      });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }

    if (user.verificationExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Verification code expired'
      });
    }

    // Update user
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Send welcome bonus (if applicable)
    if (process.env.WELCOME_BONUS) {
      const bonusAmount = parseFloat(process.env.WELCOME_BONUS);
      
      await Transaction.create({
        user: user._id,
        type: 'bonus',
        amount: bonusAmount,
        status: 'completed',
        paymentMethod: 'system',
        description: 'Welcome bonus for new verified user',
        reference: `BONUS-${Date.now()}`
      });
    }

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      user: {
        id: user._id,
        isVerified: user.isVerified,
        balance: user.balance
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide phone number and password'
      });
    }

    // Find user with password
    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    // Log login activity
    console.log(`User ${phone} logged in from IP: ${req.ip}`);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        accountNumber: user.accountNumber,
        balance: user.balance,
        isVerified: user.isVerified,
        role: user.role,
        hasPin: !!user.pin
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this phone number'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set expire (10 minutes)
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Send reset SMS
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    try {
      await sendSMS(
        phone,
        `Your password reset code is: ${resetToken}. Or click: ${resetUrl}`
      );
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
    }

    res.json({
      success: true,
      message: 'Password reset code sent to your phone'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.lastPasswordChange = Date.now();

    await user.save();

    // Send confirmation SMS
    try {
      await sendSMS(
        user.phone,
        'Your Sun Bank password has been reset successfully. If you did not do this, please contact support immediately.'
      );
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
    }

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    user.lastPasswordChange = Date.now();
    await user.save();

    // Send notification
    try {
      await sendSMS(
        user.phone,
        'Your Sun Bank password has been changed successfully.'
      );
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('activePackages')
      .populate('totalReferrals');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get summary statistics
    const Transaction = require('../models/Transaction');
    
    const [totalDeposit, totalWithdraw, totalInvestment, totalProfit] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: user._id, type: 'deposit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: user._id, type: 'withdrawal', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: user._id, type: 'investment', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: user._id, type: 'profit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const userData = user.toObject();
    userData.stats = {
      totalDeposit: totalDeposit[0]?.total || 0,
      totalWithdraw: totalWithdraw[0]?.total || 0,
      totalInvestment: totalInvestment[0]?.total || 0,
      totalProfit: totalProfit[0]?.total || 0,
      activePackages: user.activePackages,
      totalReferrals: user.totalReferrals
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // In a real implementation, you might want to:
    // 1. Add token to blacklist (if using JWT blacklist)
    // 2. Clear session (if using sessions)
    // 3. Log the logout activity
    
    console.log(`User ${req.user.phone} logged out`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Set/Update transaction PIN
// @route   PUT /api/auth/set-pin
// @access  Private
exports.setPin = async (req, res, next) => {
  try {
    const { pin, confirmPin } = req.body;
    const userId = req.user.id;

    if (!pin || !confirmPin) {
      return res.status(400).json({
        success: false,
        error: 'Please provide PIN and confirmation'
      });
    }

    if (pin !== confirmPin) {
      return res.status(400).json({
        success: false,
        error: 'PINs do not match'
      });
    }

    if (pin.length < 4 || pin.length > 6) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be 4-6 digits'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.pin = pin;
    await user.save();

    res.json({
      success: true,
      message: 'Transaction PIN set successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Verify transaction PIN
// @route   POST /api/auth/verify-pin
// @access  Private
exports.verifyPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId).select('+pin');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.pin) {
      return res.status(400).json({
        success: false,
        error: 'Transaction PIN not set'
      });
    }

    const isPinMatch = await user.comparePin(pin);

    if (!isPinMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN'
      });
    }

    res.json({
      success: true,
      message: 'PIN verified successfully'
    });

  } catch (error) {
    next(error);
  }
};
