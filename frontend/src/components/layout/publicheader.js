import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaSun, FaBars, FaTimes, FaUser, FaWallet } from 'react-icons/fa';

const PublicHeader = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-sun rounded-lg">
              <FaSun className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-sun bg-clip-text text-transparent">
                Sun Bank
              </h1>
              <p className="text-xs text-gray-600 -mt-1">Investment Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="font-medium hover:text-purple-600 transition-colors">
              Home
            </Link>
            <Link to="/packages" className="font-medium hover:text-purple-600 transition-colors">
              Packages
            </Link>
            <Link to="/how-it-works" className="font-medium hover:text-purple-600 transition-colors">
              How It Works
            </Link>
            <Link to="/about" className="font-medium hover:text-purple-600 transition-colors">
              About Us
            </Link>
            <Link to="/contact" className="font-medium hover:text-purple-600 transition-colors">
              Contact
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-sun rounded-full flex items-center justify-center text-white">
                    {user?.fullName?.charAt(0) || <FaUser />}
                  </div>
                  <span className="font-medium">Hi, {user?.fullName?.split(' ')[0]}</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                  <FaWallet className="text-green-500" />
                  <span className="font-bold">{user?.balance?.toLocaleString()}৳</span>
                </div>
                <Link
                  to="/dashboard"
                  className="bg-gradient-sun text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="px-6 py-2 border border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-sun text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Start Investing
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-4 pb-4 border-t pt-4"
          >
            <div className="flex flex-col space-y-4">
              <Link to="/" className="font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              <Link to="/packages" className="font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                Packages
              </Link>
              <Link to="/how-it-works" className="font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                How It Works
              </Link>
              <Link to="/about" className="font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                About Us
              </Link>
              <Link to="/contact" className="font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                Contact
              </Link>
              
              {isAuthenticated ? (
                <>
                  <div className="py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-sun rounded-full flex items-center justify-center text-white">
                        {user?.fullName?.charAt(0) || <FaUser />}
                      </div>
                      <div>
                        <p className="font-medium">{user?.fullName}</p>
                        <p className="text-sm text-gray-600">Balance: {user?.balance?.toLocaleString()}৳</p>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    className="bg-gradient-sun text-white py-2 rounded-lg font-semibold text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-red-600 py-2 text-center"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="border border-purple-600 text-purple-600 py-2 rounded-lg font-semibold text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-sun text-white py-2 rounded-lg font-semibold text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Start Investing
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default PublicHeader;
