import React from 'react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon, title, description, color, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
      <div className="relative bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
        <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${color} text-white rounded-xl mb-6`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
};

export default FeatureCard;
