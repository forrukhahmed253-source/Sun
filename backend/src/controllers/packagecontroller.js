const Package = require('../models/Package');
const UserPackage = require('../models/UserPackage');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Get all packages
// @route   GET /api/packages
// @access  Public
exports.getPackages = async (req, res, next) => {
  try {
    const { category, activeOnly = true, sortBy = 'price', sortOrder = 'asc' } = req.query;

    // Build query
    const query = {};
    
    if (category) query.category = category;
    if (activeOnly) query.isActive = true;

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const packages = await Package.find(query).sort(sort);

    res.json({
      success: true,
      count: packages.length,
      packages
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single package
// @route   GET /api/packages/:id
// @access  Public
exports.getPackage = async (req, res, next) => {
  try {
    const package = await Package.findById(req.params.id);

    if (!package) {
      return res.status(404).json({
        success: false,
        error: 'Package not found'
      });
    }

    res.json({
      success: true,
      package
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Purchase package
// @route   POST /api/packages/:id/purchase
// @access  Private
exports.purchasePackage = async (req, res, next) => {
  try {
    const { pin, quantity = 1 } = req.body;
    const userId = req.user.id;
    const packageId = req.params.id;

    // Get package
    const package = await Package.findById(packageId);

    if (!package) {
      return res.status(404).json({
        success: false,
        error: 'Package not found'
      });
    }

    if (!package.isActive) {
      return res.status(400).json({
        success: false,
        error: 'This package is not available for purchase'
      });
    }

    // Verify transaction PIN
    const user = await User.findById(userId).select('+pin');
    
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
        error: 'Invalid transaction PIN'
      });
    }

    // Check quantity limits
    if (quantity < package.minPurchase) {
      return res.status(400).json({
        success: false,
        error: `Minimum purchase quantity is ${package.minPurchase}`
      });
    }

    if (quantity > package.maxPurchase) {
      return res.status(400).json({
        success: false,
        error: `Maximum purchase quantity is ${package.maxPurchase}`
      });
    }

    // Calculate total amount
    const totalAmount = package.price * quantity;
    const totalProfit = package.profitAmount * quantity;

    // Check user balance
    if (user.balance < totalAmount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Required: ${totalAmount}৳, Available: ${user.balance}৳`
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      user: userId,
      type: 'investment',
      amount: totalAmount,
      status: 'completed',
      paymentMethod: 'wallet',
      description: `Purchase ${quantity}x ${package.name} Package`,
      metadata: {
        packageId: package._id,
        quantity
      }
    });

    // Create user packages
    const userPackages = [];
    const startDate = new Date();

    for (let i = 0; i < quantity; i++) {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + package.durationDays);

      const userPackage = await UserPackage.create({
        user: userId,
        package: packageId,
        purchaseAmount: package.price,
        expectedProfit: package.profitAmount,
        dailyProfit: package.dailyProfit,
        startDate,
        endDate,
        status: 'active',
        transaction: transaction._id
      });

      userPackages.push(userPackage);
    }

    // Update package statistics
    package.totalSales += quantity;
    package.totalRevenue += totalAmount;
    await package.save();

    // Calculate and pay referral commission
    if (user.referredBy && package.referralCommission > 0) {
      const commissionAmount = (totalAmount * package.referralCommission) / 100;
      
      // Create commission transaction for referrer
      await Transaction.create({
        user: user.referredBy,
        type: 'commission',
        amount: commissionAmount,
        status: 'completed',
        paymentMethod: 'system',
        description: `Referral commission for ${user.fullName}'s package purchase`,
        metadata: {
          referredUserId: user._id,
          packageId: package._id
        }
      });

      // Update user package with commission info
      await UserPackage.updateMany(
        { _id: { $in: userPackages.map(up => up._id) } },
        {
          referralCommission: {
            amount: commissionAmount / quantity,
            paidTo: user.referredBy,
            paidAt: new Date()
          }
        }
      );
    }

    res.json({
      success: true,
      transaction: {
        id: transaction._id,
        amount: totalAmount,
        reference: transaction.reference
      },
      packages: userPackages,
      message: `Successfully purchased ${quantity}x ${package.name} package${quantity > 1 ? 's' : ''}`
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get user's purchased packages
// @route   GET /api/packages/my-packages
// @access  Private
exports.getMyPackages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { user: userId };
    if (status) query.status = status;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [userPackages, total] = await Promise.all([
      UserPackage.find(query)
        .populate('package', 'name category image durationDays')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      UserPackage.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: userPackages.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      packages: userPackages
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get package statistics
// @route   GET /api/packages/stats
// @access  Private (Admin)
exports.getPackageStats = async (req, res, next) => {
  try {
    const stats = await Package.aggregate([
      {
        $group: {
          _id: null,
          totalPackages: { $sum: 1 },
          totalSales: { $sum: '$totalSales' },
          totalRevenue: { $sum: '$totalRevenue' },
          activePackages: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]);

    // Get top selling packages
    const topPackages = await Package.find()
      .sort({ totalSales: -1 })
      .limit(5)
      .select('name price totalSales totalRevenue');

    res.json({
      success: true,
      stats: stats[0] || {
        totalPackages: 0,
        totalSales: 0,
        totalRevenue: 0,
        activePackages: 0
      },
      topPackages
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create new package (Admin)
// @route   POST /api/packages
// @access  Admin
exports.createPackage = async (req, res, next) => {
  try {
    const package = await Package.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      package,
      message: 'Package created successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update package (Admin)
// @route   PUT /api/packages/:id
// @access  Admin
exports.updatePackage = async (req, res, next) => {
  try {
    const package = await Package.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!package) {
      return res.status(404).json({
        success: false,
        error: 'Package not found'
      });
    }

    res.json({
      success: true,
      package,
      message: 'Package updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete package (Admin)
// @route   DELETE /api/packages/:id
// @access  Admin
exports.deletePackage = async (req, res, next) => {
  try {
    const package = await Package.findById(req.params.id);

    if (!package) {
      return res.status(404).json({
        success: false,
        error: 'Package not found'
      });
    }

    // Check if package has active purchases
    const activePurchases = await UserPackage.countDocuments({
      package: package._id,
      status: 'active'
    });

    if (activePurchases > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete package with active purchases'
      });
    }

    await package.deleteOne();

    res.json({
      success: true,
      message: 'Package deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};
