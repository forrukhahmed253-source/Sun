import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import CountUp from 'react-countup';

const StatCard = ({ title, value, icon, change, trend, prefix = '', color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200'
  };

  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className={`rounded-xl border p-6 ${colorClasses[color]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-gray-900">
              {prefix && <span className="text-xl">{prefix}</span>}
              <CountUp 
                end={value} 
                duration={2.5}
                separator=","
              />
            </p>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${iconColorClasses[color]}`}>
          {icon}
        </div>
      </div>
      
      {change && (
        <div className="mt-4 flex items-center">
          {trend === 'up' ? (
            <FaArrowUp className="h-4 w-4 text-green-500" />
          ) : (
            <FaArrowDown className="h-4 w-4 text-red-500" />
          )}
          <span className={`ml-2 text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change} from last period
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
