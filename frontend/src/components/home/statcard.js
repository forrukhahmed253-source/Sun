import React from 'react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

const StatCard = ({ icon, value, label, prefix = '', suffix = '', delay = 0, isMoney = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      viewport={{ once: true }}
      className="bg-white rounded-xl shadow-lg p-6 text-center"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4">
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
        {prefix}
        <CountUp
          end={value}
          duration={2.5}
          separator={isMoney ? ',' : ''}
          decimals={isMoney ? 0 : 0}
        />
        {suffix}
      </div>
      <p className="text-gray-600">{label}</p>
    </motion.div>
  );
};

export default StatCard;
