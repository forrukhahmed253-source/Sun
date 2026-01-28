import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { 
  FaChartLine, 
  FaShieldAlt, 
  FaClock, 
  FaUsers,
  FaArrowRight,
  FaPlay,
  FaStar,
  FaAward,
  FaMobileAlt,
  FaCreditCard,
  FaHeadset
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import TestimonialCard from '../components/home/TestimonialCard';
import StatCard from '../components/home/StatCard';
import FeatureCard from '../components/home/FeatureCard';
import PackageShowcase from '../components/home/PackageShowcase';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalInvestors: 12543,
    totalInvested: 45289000,
    totalPaid: 28956000,
    activePackages: 8432
  });

  useEffect(() => {
    // Fetch real stats from API
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/public/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    
    fetchStats();
  }, []);

  const features = [
    {
      icon: <FaChartLine className="h-8 w-8" />,
      title: "Guaranteed Returns",
      description: "Fixed profit rates with daily returns on all investment packages.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <FaShieldAlt className="h-8 w-8" />,
      title: "Bank-level Security",
      description: "256-bit SSL encryption and secure payment processing.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <FaClock className="h-8 w-8" />,
      title: "24/7 Support",
      description: "Round-the-clock customer support via WhatsApp and phone.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <FaUsers className="h-8 w-8" />,
      title: "Referral Program",
      description: "Earn up to 15% commission on referrals' investments.",
      color: "from-orange-500 to-red-500"
    }
  ];

  const testimonials = [
    {
      name: "Md. Rahman",
      role: "Business Owner",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      content: "Started with 10,000৳ and now earning 3,000৳ monthly profit. Sun Bank changed my financial life!",
      rating: 5,
      profit: "300,000৳+"
    },
    {
      name: "Fatima Begum",
      role: "Teacher",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      content: "As a teacher, I needed extra income. Sun Bank's flexible packages are perfect for me.",
      rating: 5,
      profit: "150,000৳+"
    },
    {
      name: "Ahmed Hasan",
      role: "Student",
      image: "https://randomuser.me/api/portraits/men/67.jpg",
      content: "Earning while studying! The daily profit helps with my expenses. Highly recommended!",
      rating: 5,
      profit: "75,000৳+"
    }
  ];

  const paymentMethods = [
    { name: "bKash", icon: <FaMobileAlt />, color: "bg-pink-100 text-pink-600" },
    { name: "Nagad", icon: <FaCreditCard />, color: "bg-red-100 text-red-600" },
    { name: "Rocket", icon: <FaMobileAlt />, color: "bg-blue-100 text-blue-600" },
    { name: "Bank", icon: <FaCreditCard />, color: "bg-green-100 text-green-600" }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-sun text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:w-1/2"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Smart Investments,
                <span className="block text-yellow-300"> Guaranteed Profits</span>
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of Bangladeshi investors earning daily profits with our secure and transparent investment platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="bg-white text-purple-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors text-center"
                    >
                      Go to Dashboard
                    </Link>
                    <Link
                      to="/packages"
                      className="bg-transparent border-2 border-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors text-center"
                    >
                      View Packages
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="bg-white text-purple-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors text-center"
                    >
                      Start Investing
                    </Link>
                    <Link
                      to="/login"
                      className="bg-transparent border-2 border-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors text-center"
                    >
                      Login to Account
                    </Link>
                  </>
                )}
              </div>
              <div className="mt-8 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-300" />
                  <span>4.9/5 Trustpilot</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaAward className="text-yellow-300" />
                  <span>Licensed & Regulated</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:w-1/2 relative"
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Live Investment Calculator</h3>
                  <p className="opacity-90">See how much you can earn</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2">Investment Amount (৳)</label>
                    <input
                      type="range"
                      min="1000"
                      max="100000"
                      step="1000"
                      defaultValue="50000"
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm mt-1">
                      <span>1,000৳</span>
                      <span className="text-xl font-bold">50,000৳</span>
                      <span>100,000৳</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-2">Package Duration</label>
                    <select className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3">
                      <option>30 Days (15% Profit)</option>
                      <option>60 Days (35% Profit)</option>
                      <option>90 Days (60% Profit)</option>
                    </select>
                  </div>
                  
                  <div className="bg-white/5 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span>Total Profit:</span>
                      <span className="text-xl font-bold text-yellow-300">7,500৳</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Profit:</span>
                      <span className="font-bold">250৳/day</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => navigate(isAuthenticated ? '/deposit' : '/register')}
                    className="w-full bg-yellow-400 text-gray-900 py-3 rounded-lg font-bold hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2"
                  >
                    Start Earning <FaArrowRight />
                  </button>
                </div>
              </div>
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-4 -left-4 bg-white text-purple-700 p-3 rounded-full shadow-lg"
              >
                <FaChartLine className="h-6 w-6" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                className="absolute -bottom-4 -right-4 bg-white text-purple-700 p-3 rounded-full shadow-lg"
              >
                <FaShieldAlt className="h-6 w-6" />
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L60 70C120 60 240 40 360 33.3C480 26.7 600 26.7 720 33.3C840 40 960 53.3 1080 53.3C1200 53.3 1320 40 1380 33.3L1440 26.7V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V80Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Thousands</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join our growing community of satisfied investors from all over Bangladesh
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard
              icon={<FaUsers />}
              value={stats.totalInvestors}
              label="Active Investors"
              prefix="+"
              delay={0}
            />
            <StatCard
              icon={<FaChartLine />}
              value={stats.totalInvested}
              label="Total Invested"
              prefix="৳"
              suffix="+"
              delay={0.1}
              isMoney
            />
            <StatCard
              icon={<FaArrowRight />}
              value={stats.totalPaid}
              label="Profit Paid"
              prefix="৳"
              suffix="+"
              delay={0.2}
              isMoney
            />
            <StatCard
              icon={<FaClock />}
              value={stats.activePackages}
              label="Active Packages"
              prefix="+"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Sun Bank?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide the most secure and profitable investment experience in Bangladesh
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Packages Showcase */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Investment Packages</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose from our best-selling packages with guaranteed returns
            </p>
          </div>
          
          <PackageShowcase />
          
          <div className="text-center mt-12">
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 bg-gradient-sun text-white px-8 py-3 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity"
            >
              View All Packages <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Start earning in just 3 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                number: "01",
                title: "Create Account",
                description: "Sign up with your phone number and complete verification",
                icon: <FaUsers className="h-8 w-8" />
              },
              {
                number: "02",
                title: "Deposit Funds",
                description: "Add money via bKash, Nagad, or Rocket to your wallet",
                icon: <FaCreditCard className="h-8 w-8" />
              },
              {
                number: "03",
                title: "Invest & Earn",
                description: "Choose packages and start receiving daily profits",
                icon: <FaChartLine className="h-8 w-8" />
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-sun text-white rounded-full text-2xl font-bold mb-4">
                  {step.number}
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Investors Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Real stories from real people who transformed their finances
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Supported Payment Methods</h3>
            <p className="text-gray-600">Secure transactions with all major Bangladeshi payment systems</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg ${method.color}`}
              >
                {method.icon}
                <span className="font-semibold">{method.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-sun text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of successful investors earning daily profits with Sun Bank
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="bg-white text-purple-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to="/deposit"
                  className="bg-transparent border-2 border-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-white/10 transition-colors"
                >
                  Add Funds
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-white text-purple-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
                >
                  Create Free Account
                </Link>
                <button
                  onClick={() => window.open('https://wa.me/8801340809337', '_blank')}
                  className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <FaHeadset /> Chat with Support
                </button>
              </>
            )}
          </div>
          
          <p className="mt-6 text-sm opacity-80">
            🛡️ Licensed & Regulated • 🔒 Bank-level Security • ⚡ Instant Withdrawals
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about Sun Bank
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                question: "Is Sun Bank safe and legitimate?",
                answer: "Yes! Sun Bank is a licensed and regulated investment platform with bank-level security, SSL encryption, and transparent operations. We are registered with relevant financial authorities in Bangladesh."
              },
              {
                question: "How are profits calculated and paid?",
                answer: "Profits are calculated daily based on your investment package and are automatically credited to your wallet every 24 hours. You can withdraw profits anytime after they are credited."
              },
              {
                question: "What is the minimum investment amount?",
                answer: "You can start investing with as little as 500৳. We offer packages for all budget ranges, making investment accessible to everyone."
              },
              {
                question: "How long does withdrawal take?",
                answer: "Withdrawals are processed within 2-24 hours. bKash/Nagad withdrawals are usually instant, while bank transfers may take 1-3 business days."
              },
              {
                question: "Can I withdraw my initial investment?",
                answer: "Investments are locked for the package duration to ensure guaranteed returns. After package completion, both principal and profits are available for withdrawal."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <details className="group">
                  <summary className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50">
                    <span className="font-semibold text-lg">{faq.question}</span>
                    <span className="transition-transform group-open:rotate-180">
                      <FaArrowRight className="transform -rotate-90" />
                    </span>
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </details>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
