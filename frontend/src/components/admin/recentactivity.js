import React from 'react';
import { format } from 'date-fns';
import {
  FaUserPlus,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaGift,
  FaShieldAlt,
  FaExclamationTriangle
} from 'react-icons/fa';

const RecentActivity = ({ activities }) => {
  // Sample activities if none provided
  const sampleActivities = [
    {
      id: 1,
      type: 'user_registration',
      user: { name: 'John Doe', phone: '01312345678' },
      timestamp: new Date(),
      description: 'New user registration'
    },
    {
      id: 2,
      type: 'deposit',
      user: { name: 'Jane Smith', phone: '01712345678' },
      amount: 5000,
      timestamp: new Date(Date.now() - 3600000),
      description: 'Deposit completed'
    },
    {
      id: 3,
      type: 'withdrawal',
      user: { name: 'Bob Johnson', phone: '01912345678' },
      amount: 3000,
      timestamp: new Date(Date.now() - 7200000),
      description: 'Withdrawal processed'
    },
    {
      id: 4,
      type: 'investment',
      user: { name: 'Alice Brown', phone: '01812345678' },
      amount: 10000,
      timestamp: new Date(Date.now() - 10800000),
      description: 'Package purchased'
    },
    {
      id: 5,
      type: 'verification',
      user: { name: 'Charlie Wilson', phone: '01512345678' },
      timestamp: new Date(Date.now() - 14400000),
      description: 'Account verified'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : sampleActivities;

  const getActivityIcon = (type) => {
    switch(type) {
      case 'user_registration':
        return <FaUserPlus className="text-blue-500" />;
      case 'deposit':
        return <FaMoneyBillWave className="text-green-500" />;
      case 'withdrawal':
        return <FaExchangeAlt className="text-orange-500" />;
      case 'investment':
        return <FaGift className="text-purple-500" />;
      case 'verification':
        return <FaShieldAlt className="text-cyan-500" />;
      default:
        return <FaExclamationTriangle className="text-gray-500" />;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'user_registration':
        return 'bg-blue-100 border-blue-200';
      case 'deposit':
        return 'bg-green-100 border-green-200';
      case 'withdrawal':
        return 'bg-orange-100 border-orange-200';
      case 'investment':
        return 'bg-purple-100 border-purple-200';
      case 'verification':
        return 'bg-cyan-100 border-cyan-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {displayActivities.map((activity) => (
        <div
          key={activity.id}
          className={`flex items-center justify-between p-4 rounded-lg border ${getActivityColor(activity.type)}`}
        >
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-lg bg-white">
              {getActivityIcon(activity.type)}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {activity.user?.name || 'User'} ({activity.user?.phone || 'N/A'})
              </p>
              <p className="text-sm text-gray-600">
                {activity.description}
                {activity.amount && (
                  <span className="font-semibold ml-1">
                    ৳{activity.amount.toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {format(new Date(activity.timestamp), 'hh:mm a')}
            </p>
            <p className="text-xs text-gray-400">
              {format(new Date(activity.timestamp), 'MMM dd')}
            </p>
          </div>
        </div>
      ))}
      
      {displayActivities.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No recent activity
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
