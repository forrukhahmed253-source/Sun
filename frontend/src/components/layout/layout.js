import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import MobileMenu from './MobileMenu';
import Header from './Header';
import WhatsAppFloat from '../common/WhatsAppFloat';

const Layout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Hide sidebar on specific pages
  const hideSidebar = ['/deposit', '/withdraw'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="flex">
        {/* Sidebar */}
        {!hideSidebar && (
          <>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="hidden lg:block w-64 flex-shrink-0">
              {/* Spacer for desktop sidebar */}
            </div>
          </>
        )}
        
        {/* Main Content */}
        <main className={`flex-1 ${!hideSidebar ? 'lg:ml-64' : ''}`}>
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile Menu */}
      <MobileMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* WhatsApp Float Button */}
      <WhatsAppFloat phone="8801340809337" />
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Sun Bank</h3>
              <p className="text-gray-400">
                Your trusted investment partner. Safe, secure, and profitable.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link></li>
                <li><Link to="/packages" className="text-gray-400 hover:text-white">Packages</Link></li>
                <li><Link to="/transactions" className="text-gray-400 hover:text-white">Transactions</Link></li>
                <li><Link to="/profile" className="text-gray-400 hover:text-white">Profile</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/support" className="text-gray-400 hover:text-white">Help Center</Link></li>
                <li><a href="mailto:support@sunbank.com" className="text-gray-400 hover:text-white">Email Support</a></li>
                <li><a href="tel:+8801340809337" className="text-gray-400 hover:text-white">Call Support</a></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white">Terms & Conditions</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <i className="fas fa-phone"></i>
                  <span>01340809337</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-envelope"></i>
                  <span>support@sunbank.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>Dhaka, Bangladesh</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Sun Bank. All rights reserved.</p>
            <p className="mt-2 text-sm">Licensed and regulated by Bangladesh Bank</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
