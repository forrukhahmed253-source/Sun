import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaFilter, 
  FaFire, 
  FaStar, 
  FaClock, 
  FaChartLine,
  FaShieldAlt,
  FaPercent
} from 'react-icons/fa';
import PackageCard from '../components/packages/PackageCard';
import PackageFilters from '../components/packages/PackageFilters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import api from '../utils/api';

const Packages = () => {
  const [filters, setFilters] = useState({
    category: 'all',
    sortBy: 'price',
    minPrice: 0,
    maxPrice: 100000
  });

  const [showFilters, setShowFilters] = useState(false);

  // Fetch packages
  const { data: packagesData, isLoading } = useQuery(
    ['packages', filters],
    async () => {
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      
      const response = await api.get(`/packages?${params.toString()}`);
      return response.data;
    }
  );

  // Filter packages by price
  const filteredPackages = packagesData?.packages?.filter(pkg => 
    pkg.price >= filters.minPrice && 
    pkg.price <= filters.maxPrice
  ) || [];

  // Package categories
  const categories = [
    { id: 'all', name: 'All Packages', icon: <FaChartLine /> },
    { id: 'starter', name: 'Starter', icon: <FaStar />, color: 'text-blue-500' },
    { id: 'basic', name: 'Basic', icon: <FaStar />, color: 'text-green-500' },
    { id: 'silver', name: 'Silver', icon: <FaStar />, color: 'text-gray-400' },
    { id: 'gold', name: 'Gold', icon: <FaStar />, color: 'text-yellow-500' },
    { id: 'platinum', name: 'Platinum', icon: <FaStar />, color: 'text-purple-500' },
    { id: 'diamond', name: 'Diamond', icon: <FaStar />, color: 'text-cyan-500' },
    { id: 'vip', name: 'VIP', icon: <FaFire />, color: 'text-red-500' },
    { id: 'premium', name: 'Premium', icon: <FaFire />, color: 'text-orange-500' }
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investment Packages</h1>
          <p className="text-gray-600 mt-2">
            Choose from our carefully curated investment plans. All profits are guaranteed!
          </p>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FaFilter />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setFilters(prev => ({ ...prev, category: category.id }))}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              filters.category === category.id
                ? 'bg-gradient-sun text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            <span className={category.color}>{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <PackageFilters filters={filters} setFilters={setFilters} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaShieldAlt className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Guaranteed Profit</p>
              <p className="text-lg font-semibold">100% Secure</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaChartLine className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Daily Returns</p>
              <p className="text-lg font-semibold">Auto Profit</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaClock className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Flexible Terms</p>
              <p className="text-lg font-semibold">3-30 Days</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FaPercent className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Referral Bonus</p>
              <p className="text-lg font-semibold">Up to 15%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      {filteredPackages.length === 0 ? (
        <EmptyState
          icon={<FaChartLine className="h-12 w-12 text-gray-400" />}
          title="No Packages Found"
          description="Try adjusting your filters to find more packages."
        />
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {filteredPackages.map((pkg, index) => (
            <motion.div
              key={pkg._id}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              transition={{ delay: index * 0.05 }}
            >
              <PackageCard package={pkg} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Investment Guide */}
      <div className="mt-12 bg-gray-50 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full text-xl font-bold mb-3">
              1
            </div>
            <h3 className="font-semibold mb-2">Choose Package</h3>
            <p className="text-gray-600">
              Select an investment package that matches your budget and goals.
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full text-xl font-bold mb-3">
              2
            </div>
            <h3 className="font-semibold mb-2">Make Payment</h3>
            <p className="text-gray-600">
              Pay via bKash, Nagad, or Rocket using your wallet balance.
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full text-xl font-bold mb-3">
              3
            </div>
            <h3 className="font-semibold mb-2">Earn Profit</h3>
            <p className="text-gray-600">
              Receive daily profits automatically until package completion.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Are profits guaranteed?</h3>
            <p className="text-gray-600">
              Yes, all our investment packages come with guaranteed profits as specified in the package details.
            </p>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">When do I receive profits?</h3>
            <p className="text-gray-600">
              Profits are credited daily to your wallet balance. You can withdraw them anytime after they're credited.
            </p>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Can I withdraw my investment early?</h3>
            <p className="text-gray-600">
              Investments are locked for the package duration. Early withdrawal is not available to ensure guaranteed returns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Packages;
