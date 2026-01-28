const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { protect, checkPin, authorize } = require('../middleware/auth');

// All routes protected
router.use(protect);

// Deposit routes
router.post('/deposit/initiate',
  [
    body('amount')
      .isFloat({ min: 100 })
      .withMessage('Minimum deposit amount is 100৳'),
    body('paymentMethod')
      .isIn(['bkash', 'nagad', 'rocket'])
      .withMessage('Invalid payment method')
  ],
  transactionController.initiateDeposit
);

router.post('/deposit/verify',
  [
    body('transactionId').notEmpty().withMessage('Transaction ID is required'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required')
  ],
  transactionController.verifyDeposit
);

// Withdrawal routes
router.post('/withdraw/request',
  checkPin,
  [
    body('amount')
      .isFloat({ min: 500 })
      .withMessage('Minimum withdrawal amount is 500৳'),
    body('paymentMethod')
      .isIn(['bkash', 'nagad', 'rocket'])
      .withMessage('Invalid payment method'),
    body('accountNumber')
      .notEmpty()
      .withMessage('Account number is required')
      .matches(/^01[3-9]\d{8}$/)
      .withMessage('Please provide a valid phone number')
  ],
  transactionController.requestWithdrawal
);

// Get transactions
router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransaction);

// Admin routes for transaction management
router.use(authorize('admin', 'superadmin'));

router.get('/admin/pending', transactionController.getPendingTransactions);
router.put('/admin/:id/process', transactionController.processTransaction);
router.put('/admin/:id/reject', transactionController.rejectTransaction);

module.exports = router;
