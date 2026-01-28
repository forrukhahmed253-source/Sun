import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { 
  FaBkash, 
  FaMoneyBillWave, 
  FaMobileAlt, 
  FaQrcode,
  FaCopy,
  FaCheck,
  FaHistory
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import PaymentMethodCard from '../../components/transactions/PaymentMethodCard';
import DepositHistory from '../../components/transactions/DepositHistory';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { depositSchema } from '../../utils/validationSchemas';

const Deposit = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState('bkash');
  const [step, setStep] = useState(1); // 1: Amount, 2: Instructions, 3: Verify
  const [depositData, setDepositData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Payment methods
  const paymentMethods = [
    {
      id: 'bkash',
      name: 'bKash',
      icon: <FaBkash className="text-pink-600" />,
      number: '01340809337',
      color: 'from-pink-500 to-purple-500',
      steps: [
        'Dial *247#',
        'Select "Send Money"',
        'Enter Agent Number: 01340809337',
        'Enter the deposit amount',
        'Enter your bKash PIN',
        'Enter reference number when asked'
      ]
    },
    {
      id: 'nagad',
      name: 'Nagad',
      icon: <FaMoneyBillWave className="text-red-600" />,
      number: '01340809337',
      color: 'from-red-500 to-orange-500',
      steps: [
        'Open Nagad App',
        'Tap "Send Money"',
        'Enter Agent Number: 01340809337',
        'Enter the deposit amount',
        'Enter your Nagad PIN',
        'Enter reference number when asked'
      ]
    },
    {
      id: 'rocket',
      name: 'Rocket',
      icon: <FaMobileAlt className="text-blue-600" />,
      number: '01340809337R',
      color: 'from-blue-500 to-cyan-500',
      steps: [
        'Dial *322#',
        'Select "Send Money"',
        'Enter Rocket Number: 01340809337R',
        'Enter the deposit amount',
        'Enter your Rocket PIN',
        'Enter reference number when asked'
      ]
    }
  ];

  // Form setup
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 500,
      paymentMethod: 'bkash'
    }
  });

  const amount = watch('amount');

  // Initiate deposit mutation
  const initiateDeposit = useMutation(
    async (data) => {
      const response = await api.post('/transactions/deposit/initiate', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setDepositData(data);
        setStep(2);
        toast.success('Deposit initiated! Please complete the payment.');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to initiate deposit');
      }
    }
  );

  // Verify deposit mutation
  const verifyDeposit = useMutation(
    async (verificationData) => {
      const response = await api.post('/transactions/deposit/verify', verificationData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Deposit verified successfully!');
        queryClient.invalidateQueries(['dashboard']);
        queryClient.invalidateQueries(['transactions']);
        setStep(3);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Verification failed');
      }
    }
  );

  const onSubmit = (data) => {
    initiateDeposit.mutate(data);
  };

  const handleVerify = (transactionId) => {
    verifyDeposit.mutate({
      transactionId,
      paymentMethod: selectedMethod
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedPayment = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Add Funds to Your Account</h1>
        <p className="text-gray-600 mt-2">
          Deposit money using any mobile financial service
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Deposit Form/Instructions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= stepNumber 
                    ? 'bg-gradient-sun text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`h-1 w-24 ${
                    step > stepNumber ? 'bg-gradient-sun' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Amount Selection */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold mb-4">Select Amount</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deposit Amount (৳)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      {...register('amount')}
                      className="w-full px-4 py-3 border rounded-lg text-lg font-semibold"
                      min="100"
                      step="100"
                    />
                    <div className="absolute right-3 top-3 text-gray-500">৳</div>
                  </div>
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                  )}
                  
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {[500, 1000, 2000, 5000].map((quickAmount) => (
                      <button
                        type="button"
                        key={quickAmount}
                        onClick={() => register('amount').onChange({ target: { value: quickAmount } })}
                        className={`py-2 rounded-lg border ${
                          amount === quickAmount 
                            ? 'bg-gradient-sun text-white border-transparent' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {quickAmount}৳
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {paymentMethods.map((method) => (
                      <PaymentMethodCard
                        key={method.id}
                        method={method}
                        isSelected={selectedMethod === method.id}
                        onSelect={() => {
                          setSelectedMethod(method.id);
                          register('paymentMethod').onChange({ target: { value: method.id } });
                        }}
                      />
                    ))}
                  </div>
                  <input type="hidden" {...register('paymentMethod')} />
                </div>

                {/* Current Balance */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {user?.balance?.toLocaleString()}৳
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={initiateDeposit.isLoading}
                  className="w-full py-3 bg-gradient-sun text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {initiateDeposit.isLoading ? (
                    <LoadingSpinner size="sm" light />
                  ) : (
                    'Continue to Payment'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* Step 2: Payment Instructions */}
          {step === 2 && depositData && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold mb-4">Complete Your Payment</h2>
              
              <div className="space-y-6">
                {/* Payment Details */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Reference Number:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-3 py-1 rounded border font-mono">
                          {depositData.transaction.reference}
                        </code>
                        <button
                          onClick={() => copyToClipboard(depositData.transaction.reference)}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Amount to Send:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {depositData.transaction.amount.toLocaleString()}৳
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Send to Number:</span>
                      <span className="text-xl font-semibold">
                        {selectedPayment.number}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code for Easy Payment */}
                <div className="text-center">
                  <div className="inline-block p-4 bg-white border rounded-lg">
                    <FaQrcode className="h-32 w-32 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Scan to pay (Coming Soon)</p>
                  </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div>
                  <h3 className="font-semibold mb-3">Follow these steps:</h3>
                  <div className="space-y-3">
                    {selectedPayment.steps.map((instruction, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                        <p className="text-gray-700">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Input */}
                <div>
                  <h3 className="font-semibold mb-3">Enter Transaction ID</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    After completing payment, enter the transaction ID from your {selectedPayment.name} SMS
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="transactionId"
                      placeholder={`${selectedPayment.name} Transaction ID`}
                      className="flex-1 px-4 py-2 border rounded-lg"
                    />
                    <button
                      onClick={() => {
                        const transactionId = document.getElementById('transactionId').value;
                        if (!transactionId) {
                          toast.error('Please enter transaction ID');
                          return;
                        }
                        handleVerify(transactionId);
                      }}
                      disabled={verifyDeposit.isLoading}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
                    >
                      {verifyDeposit.isLoading ? (
                        <LoadingSpinner size="sm" light />
                      ) : (
                        'Verify Payment'
                      )}
                    </button>
                  </div>
                </div>

                {/* Back Button */}
                <button
                  onClick={() => setStep(1)}
                  className="w-full py-2 border rounded-lg hover:bg-gray-50"
                >
                  Back to Amount Selection
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg p-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-4">
                <FaCheck className="h-10 w-10" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Payment Successful! 🎉</h2>
              <p className="text-gray-600 mb-6">
                Your deposit has been verified and added to your account.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Deposited:</span>
                    <span className="font-semibold">
                      {depositData?.transaction.amount.toLocaleString()}৳
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Balance:</span>
                    <span className="font-semibold">
                      {(user?.balance + depositData?.transaction.amount).toLocaleString()}৳
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <span className="font-mono">{depositData?.transaction.reference}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setStep(1);
                    setDepositData(null);
                  }}
                  className="flex-1 py-3 border rounded-lg hover:bg-gray-50"
                >
                  Make Another Deposit
                </button>
                <a
                  href="/dashboard"
                  className="flex-1 py-3 bg-gradient-sun text-white rounded-lg font-semibold hover:opacity-90"
                >
                  Go to Dashboard
                </a>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Deposit History */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaHistory className="text-gray-400" />
              <h3 className="font-semibold">Recent Deposits</h3>
            </div>
            <DepositHistory />
          </div>

          {/* Tips & Information */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="font-semibold mb-3">💡 Important Tips</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                <span>Minimum deposit: 100৳</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                <span>Deposits are processed instantly</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                <span>Keep the transaction ID for verification</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                <span>Contact support if payment fails</span>
              </li>
            </ul>
          </div>

          {/* Support Info */}
          <div className="bg-gradient-sun rounded-xl p-6 text-white">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm opacity-90 mb-4">
              Our support team is available 24/7 to assist you.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FaMobileAlt />
                <span>01340809337</span>
              </div>
              <div className="flex items-center gap-2">
                <FaBkash />
                <span>bKash: 01340809337</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deposit;
