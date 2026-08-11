import { useState } from 'react';
import { motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router';
import Navbar from '../Home/Navbar';
import Footer from '../Home/Footer';
import FreeBookRegisterCard from './FreeBookRegisterCard';

const features = [
  {
    title: 'Full-length mock tests',
    description: 'Practice with realistic exam conditions'
  },
  {
    title: 'Instant band estimates',
    description: 'Know your score immediately'
  },
  {
    title: 'Detailed analytics',
    description: 'Track progress and identify weak areas'
  }
];

const AuthLayout = () => {
  const [claimBook, setClaimBook] = useState(true);
  const [featuredBook, setFeaturedBook] = useState(null);
  const location = useLocation();
  const isRegisterPage = location.pathname.includes('register');

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-64px)] flex items-center py-8 px-4 sm:px-6">
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-start gap-8">
          {/* Left side - Hero Section & Book Promo */}
          <div className="hidden lg:flex lg:w-1/2 h-fit bg-bc-navy text-white p-8 xl:p-10 flex-col rounded-2xl shadow-xl border border-blue-900/40">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-3xl xl:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
                  Join 50,000+ students achieving their IELTS goals
                </h1>
                <p className="text-blue-200 text-sm xl:text-base font-medium">
                  Master English with our comprehensive learning platform
                </p>
              </div>

              {/* Free E-Book Promo Card on Left Side */}
              {isRegisterPage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                >
                  <FreeBookRegisterCard
                    claimBook={claimBook}
                    setClaimBook={setClaimBook}
                    onBookLoaded={setFeaturedBook}
                  />
                </motion.div>
              )}

              {/* Features List */}
              <div className="space-y-3.5 pt-1">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="shrink-0">
                      <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-blue-100 font-medium text-xs xl:text-sm">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right side - Auth Form */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center py-2 px-2 sm:px-4">
            {/* Mobile Promo Card when on Register route */}
            {isRegisterPage && (
              <div className="w-full max-w-md block lg:hidden mb-4">
                <FreeBookRegisterCard
                  claimBook={claimBook}
                  setClaimBook={setClaimBook}
                  onBookLoaded={setFeaturedBook}
                />
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full max-w-lg xl:max-w-xl"
            >
              <Outlet context={{ claimBook, setClaimBook, featuredBook, setFeaturedBook }} />
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AuthLayout;

