import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight, FaFire, FaCrown } from 'react-icons/fa';

const PackageShowcase = () => {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    // Fetch featured packages
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/public/packages/featured');
        const data = await response.json();
        setPackages(data);
      } catch (error) {
        // Fallback packages
        setPackages([
          {
            _id: '1',
            name: 'Starter Pack',
            price: 299,
            profitAmount: 35,
            durationDays: 3,
            category: 'starter',
            isPopular: true
          },
          {
            _id: '2',
            name: 'Gold Pack',
            price: 1199,
            profitAmount: 300,
            durationDays: 10,
            category: 'gold',
            isPopular: true
          },
          {
            _id: '3',
            name: 'VIP Pack',
            price: 4999,
            profitAmount: 2000,
            durationDays: 25,
            category: 'vip',
            isPopular: true
          },
          {
            _id: '4',
            name: 'Premium Pack',
            price: 10999,
            profitAmount: 3000,
            durationDays: 30,
            category: 'premium',
            isPopular: true
          }
        ]);
      }
    };

    fetchPackages();
  }, []);

  const getCategoryColor = (category) => {
    switch (category) {
      case 'starter': return 'bg-blue-100 text-blue-600';
      case 'gold': return 'bg-yellow-100 text-yellow-600';
      case 'vip': return 'bg-red-100 text-red-600';
      case 'premium': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'vip':
      case 'premium':
        return <FaCrown />;
      case 'gold':
        return <FaFire />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {packages.map((pkg, index) => (
        <motion.div
          key={pkg._id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
        >
          {pkg.isPopular && (
            <div className="bg-gradient-sun text-white text-center py-2 text-sm font-bold">
              <FaFire className="inline mr-2" /> MOST POPULAR
            </div>
          )}
          
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(pkg.category)}`}>
                  {getCategoryIcon(pkg.category)}
                  {pkg.category.toUpperCase()}
                </span>
                <h3 className="text-xl font-bold mt-2">{pkg.name}</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-900">
                {pkg.price.toLocaleString()}৳
              </div>
              <div className="text-sm text-gray-500">Investment Amount</div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Profit:</span>
                <span className="font-bold text-green-600">
                  +{pkg.profitAmount.toLocaleString()}৳
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold">{pkg.durationDays} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Daily Profit:</span>
                <span className="font-semibold">
                  {Math.round(pkg.profitAmount / pkg.durationDays).toLocaleString()}৳/day
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-600">Total Return:</span>
                <span className="font-bold text-blue-600">
                  {(pkg.price + pkg.profitAmount).toLocaleString()}৳
                </span>
              </div>
            </div>
            
            <Link
              to={`/packages/${pkg._id}`}
              className="block w-full bg-gradient-sun text-white text-center py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
            >
              Invest Now <FaArrowRight className="inline ml-2" />
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PackageShowcase;
