import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { 
  FaWallet, 
  FaChartLine, 
  FaMoneyBillWave, 
  FaGift,
  FaArrowUp,
  FaArrowDown,
  FaHistory,
  FaRocket
} from 'react-icons/fa';
import api from '../utils/api';
import StatCard from '../components/dashboard/StatCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import InvestmentProgress from '../components/dashboard/InvestmentProgress';
import QuickActions from '../components/dashboard/QuickActions';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    balance: 0,
    totalDeposit: 0,
    totalInvestment: 0,
    totalProfit: 0,
    activePackages: 0,
    totalReferrals: 0
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    async () => {
      const [userRes, packagesRes, transactionsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/packages/my-packages?status=active&limit=5'),
        api.get('/transactions?limit=5')
      ]);
      
      return {
        user: userRes.data.user,
        packages: packagesRes.data.packages,
        transactions: transactionsRes.data.transactions
      };
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      onSuccess: (data) => {
        setStats(data.user.stats || {});
      }
    }
  );

  // Stats cards data
  const statCards = [
    {
      title: 'Total Balance',
      value: stats.balance,
      icon: <FaWallet className="text-blue-500" />,
      color: 'blue',
      prefix: '৳',
      link: '/transactions'
    },
    {
      title: 'Total Investment',
      value: stats.totalInvestment,
      icon: <FaChartLine className="text-green-500" />,
      color: 'green',
      prefix: '৳',
      link: '/packages'
    },
    {
      title: 'Total Profit',
      value: stats.totalProfit,
      icon: <FaMoneyBillWave className="text-purple-500" />,
      color: 'purple',
      prefix: '৳',
      link: '/transactions?type=profit'
    },
    {
      title: 'Active Packages',
      value: stats.activePackages,
      icon: <FaGift className="text-orange-500" />,
      color: 'orange',
      link: '/packages'
    }
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-sun rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome back, {user?.fullName?.split(' ')[0]}! 👋
            </h1>
            <p className="mt-2 opacity-90">
              Your financial growth journey continues. Make smart investments today.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                Account: {user?.accountNumber}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${user?.isVerified ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                {user?.isVerified ? '✓ Verified' : '⚠ Needs Verification'}
              </span>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              to="/deposit"
              className="inline-flex items-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <FaRocket />
              Boost Your Balance
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Investment Progress */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <InvestmentProgress 
            investment={stats.totalInvestment}
            profit={stats.totalProfit}
            packages={dashboardData?.packages || []}
          />
        </motion.div>

        {/* Right Column: Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <QuickActions balance={stats.balance} />
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <RecentTransactions transactions={dashboardData?.transactions || []} />
      </motion.div>

      {/* Zero State for New Users */}
      {stats.totalDeposit === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8"
        >
          <EmptyState
            icon={<FaWallet className="h-12 w-12 text-gray-400" />}
            title="Start Your Investment Journey"
            description="Make your first deposit and start earning profits with our investment packages."
            action={
              <Link
                to="/deposit"
                className="inline-flex items-center gap-2 bg-gradient-sun text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                <FaArrowUp />
                Make First Deposit
              </Link>
            }
          />
        </motion.div>
      )}

      {/* Promo Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl p-6 text-white"
      >
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">🎁 Refer & Earn</h3>
            <p className="mt-1">Invite friends and earn 10% commission on their first investment!</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              to="/referral"
              className="bg-white text-cyan-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View Referral Code
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
