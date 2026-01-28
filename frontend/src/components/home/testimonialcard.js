import React from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';

const TestimonialCard = ({ name, role, image, content, rating, profit, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center mb-6">
        <img
          src={image}
          alt={name}
          className="w-12 h-12 rounded-full object-cover mr-4"
        />
        <div>
          <h4 className="font-bold text-lg">{name}</h4>
          <p className="text-gray-600 text-sm">{role}</p>
          <div className="flex items-center mt-1">
            {[...Array(rating)].map((_, i) => (
              <FaStar key={i} className="text-yellow-400" />
            ))}
          </div>
        </div>
      </div>
      
      <div className="relative">
        <FaQuoteLeft className="text-blue-100 text-3xl absolute -top-2 -left-2" />
        <p className="text-gray-700 mb-6 relative z-10">{content}</p>
      </div>
      
      <div className="border-t pt-4">
        <div className="text-center">
          <div className="text-sm text-gray-600">Total Profit Earned</div>
          <div className="text-2xl font-bold text-green-600">{profit}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;
