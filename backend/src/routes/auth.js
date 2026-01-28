const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validation middleware
const validateRegister = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^01[3-9]\d{8}$/)
    .withMessage('Please provide a valid Bangladeshi phone number'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/)
    .withMessage('Password must contain at least one uppercase, one lowercase, one number and one special character'),
  
  body('nidNumber')
    .optional()
    .matches(/^\d{10}$|^\d{13}$|^\d{17}$/)
    .withMessage('Please provide a valid NID number')
];

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);

// Protected routes
router.use(protect);

router.get('/me', authController.getMe);
router.post('/logout', authController.logout);
router.post('/verify-phone', authController.verifyPhone);
router.put('/change-password', authController.changePassword);
router.put('/set-pin', authController.setPin);
router.post('/verify-pin', authController.verifyPin);

module.exports = router;
