import { motion } from 'framer-motion';
import { FiArrowRight, FiCheckCircle, FiPlay } from 'react-icons/fi';
import heroStudent from '../../assets/hero-student.png';
import heroAbstract from '../../assets/hero-abstract.png';
import heroGroup from '../../assets/hero-group.png';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import useAxios from '../../hooks/useAxios';
import { toast } from 'react-toastify';

const Hero2 = () => {
  const axiosPublic = useAxios();

  const { data: publicConfig } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const res = await axiosPublic.get('/settings/public');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleWatchDemoClick = () => {
    const isEnabled = publicConfig?.watchDemoEnabled !== false;
    let url = publicConfig?.watchDemoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    if (!isEnabled || !url.trim()) {
      toast.info('Demo video is currently disabled or unavailable.');
      return;
    }

    url = url.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
      url = `https://${url}`;
    }

    if (url.startsWith('/')) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative min-h-[60vh] lg:h-screen flex items-center bg-white font-sans text-gray-900 py-5 md:py-10 lg:py-0">

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* Left Column: Text Content */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 md:space-y-8">
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="inline-flex items-center gap-2 md:px-4 md:py-2 px-2 py-1 rounded-full bg-gray-100 border border-gray-200"
          >
            <span className="flex w-2 h-2 rounded-full animate-bounce bg-green-500 shrink-0"></span>
            <span className="text-sm font-medium text-gray-600 tracking-wide">The Future of Testing is Here</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[100%] tracking-normal text-gray-900"
          >
            YOUR REAL IELTS EXPERIENCE <br className="hidden lg:block"/>
            <span className="text-gray-900">STARTS HERE .</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-lg leading-relaxed"
          >
            Welcome to <span className="text-cta-btn font-bold text-3xl">MOCKEA</span>. Experience interactive online exams that don't put you to sleep. Track your stats, compete with friends, and dominate your next test.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full max-w-md sm:max-w-none sm:w-auto"
          >
            <Link to={'/dashboard'} className="group relative px-8 py-4 bg-cta-btn text-white font-bold rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
              <span className="relative z-10">Start Mock Exam</span>
              <FiArrowRight className="relative animate-ping z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button 
              onClick={handleWatchDemoClick}
              className="px-8 py-4 bg-gray-100 border border-gray-200 text-gray-800 font-bold rounded-xl transition-all hover:bg-gray-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiPlay /> Watch Demo
            </button>
          </motion.div>

          {/* User Avatars / Social Proof */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex items-center gap-4 pt-4"
          >
            <div className="flex -space-x-4">
              <img className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover" src="https://i.pravatar.cc/100?img=1" alt="Student" />
              <img className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover" src="https://i.pravatar.cc/100?img=2" alt="Student" />
              <img className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover" src="https://i.pravatar.cc/100?img=3" alt="Student" />
              <img className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover" src="https://i.pravatar.cc/100?img=4" alt="Student" />
            </div>
            <div className="text-sm text-left">
              <p className="text-gray-900 font-bold">10k+ Students</p>
              <p className="text-gray-500">Already leveling up</p>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Dynamic Images */}
        <div className="w-full lg:w-1/2 relative h-[300px] sm:h-[400px] lg:h-[450px] flex items-center justify-center mt-6 sm:mt-10 lg:mt-0 max-w-[280px] min-[360px]:max-w-[320px] min-[400px]:max-w-[360px] sm:max-w-[450px] md:max-w-[500px] lg:max-w-none mx-auto">
          
          {/* Main central image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
            className="absolute z-20 w-[65%] h-[75%] rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-200 shadow-md"
          >
            <img src={heroStudent} alt="Student taking exam" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 text-white">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-green-400">Live Exam</span>
              </div>
              <p className="font-semibold text-xs sm:text-sm md:text-base">Advanced Mathematics</p>
            </div>
          </motion.div>

          {/* Top right floating image */}
          <motion.div
            initial={{ opacity: 0, x: 50, y: -50 }}
            animate={{ opacity: 1, x: 0, y: [0, -15, 0] }}
            transition={{ 
              opacity: { duration: 0.6, delay: 0.4 },
              x: { duration: 0.6, delay: 0.4 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute z-30 top-[-5%] right-[-7%] w-[45%] h-[40%] rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 shadow-md"
          >
            <img src={heroAbstract} alt="Abstract exam elements" className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent flex items-end p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="bg-white/20 text-white p-1 sm:p-1.5 rounded-full text-xs sm:text-base">
                  <FiCheckCircle />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-300">Global Rank</p>
                  <p className="text-xs sm:text-sm font-bold text-white">Top 1%</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom left floating image */}
          <motion.div
            initial={{ opacity: 0, x: -50, y: 50 }}
            animate={{ opacity: 1, x: 0, y: [0, 15, 0] }}
            transition={{ 
              opacity: { duration: 0.6, delay: 0.6 },
              x: { duration: 0.6, delay: 0.6 },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }
            }}
            className="absolute z-10 bottom-[-10%] left-[-20%] w-[50%] h-[45%] rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 shadow-md"
          >
            <img src={heroGroup} alt="Group study" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex items-end p-3 sm:p-4">
               <div>
                  <p className="text-[10px] sm:text-xs text-gray-300 font-semibold mb-0.5 sm:mb-1">Study Groups</p>
                  <p className="text-xs sm:text-sm font-bold text-white">Collaborate &amp; Win</p>
                </div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
};

export default Hero2;
