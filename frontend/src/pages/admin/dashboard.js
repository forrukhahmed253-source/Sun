import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { 
  FaUsers, 
  FaMoneyBillWave, 
  FaChartLine, 
  FaBox, 
  FaExchangeAlt,
  FaArrowUp,
  FaArrowDown,
  FaCalendarAlt
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import StatCard from '../../components/admin/StatCard';
import RecentActivity from '../../components/admin/RecentActivity';
import QuickStats from '../../components/admin/QuickStats';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState('today');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    activeInvestments: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0
  });

  // Fetch admin dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    ['adminDashboard', timeRange],
    async () => {
      const [statsRes, chartRes, activityRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get(`/admin/charts?range=${timeRange}`),
        api.get('/admin/activity?limit=10')
      ]);
      
      return {
        stats: statsRes.data,
        charts: chartRes.data,
        activity: activityRes.data
      };
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      onSuccess: (data) => {
        setStats(data.stats);
      }
    }
  );

  // Stats cards
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <FaUsers className="text-blue-500" />,
      change: '+12%',
      trend: 'up',
      color: 'blue'
    },
    {
      title: 'Total Deposits',
      value: stats.totalDeposits,
      icon: <FaMoneyBillWave className="text-green-500" />,
      change: '+24%',
      trend: 'up',
      prefix: '৳',
      color: 'green'
    },
    {
      title: 'Active Investments',
      value: stats.activeInvestments,
      icon: <FaChartLine className="text-purple-500" />,
      change: '+18%',
      trend: 'up',
      prefix: '৳',
      color: 'purple'
    },
    {
      title: 'Pending Withdrawals',
      value: stats.pendingWithdrawals,
      icon: <FaExchangeAlt className="text-orange-500" />,
      change: '+5%',
      trend: 'up',
      prefix: '৳',
      color: 'orange'
    }
  ];

  // Sample chart data (replace with real data)
  const revenueData = [
    { date: 'Mon', amount: 4000 },
    { date: 'Tue', amount: 3000 },
    { date: 'Wed', amount: 2000 },
    { date: 'Thu', amount: 2780 },
    { date: 'Fri', amount: 1890 },
    { date: 'Sat', amount: 2390 },
    { date: 'Sun', amount: 3490 }
  ];

  const packageDistribution = [
    { name: 'Starter', value: 400 },
    { name: 'Basic', value: 300 },
    { name: 'Silver', value: 300 },
    { name: 'Gold', value: 200 },
    { name: 'Platinum', value: 278 },
    { name: 'Diamond', value: 189 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of platform statistics and activities
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['today', 'week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1 rounded capitalize ${
                  timeRange === range
                    ? 'bg-white shadow'
                    : 'hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-500">
            {format(new Date(), 'MMM dd, yyyy')}
          </div>
        </div>
      </div>

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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Revenue Overview</h2>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Deposits</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Profits</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  formatter={(value) => [`৳${value}`, 'Amount']}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Package Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold mb-6">Package Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={packageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {packageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} sales`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
            <RecentActivity activities={dashboardData?.activity || []} />
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <QuickStats stats={stats} />
        </motion.div>
      </div>

      {/* Transaction Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold mb-6">Transaction Summary</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip formatter={(value) => [`৳${value}`, 'Amount']} />
              <Legend />
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <button className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors">
          <FaUsers className="h-6 w-6 mx-auto mb-2" />
          <span className="font-semibold">Manage Users</span>
        </button>
        <button className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors">
          <FaExchangeAlt className="h-6 w-6 mx-auto mb-2" />
          <span className="font-semibold">Process Transactions</span>
        </button>
        <button className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition-colors">
          <FaBox className="h-6 w-6 mx-auto mb-2" />
          <span className="font-semibold">Manage Packages</span>
        </button>
        <button className="bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600 transition-colors">
          <FaCalendarAlt className="h-6 w-6 mx-auto mb-2" />
          <span className="font-semibold">Generate Reports</span>
        </button>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
