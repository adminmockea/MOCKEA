import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiPlay, FiMic, FiCheckCircle, FiVolume2, FiCpu } from 'react-icons/fi';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import useAxios from '../hooks/useAxios';
import { toast } from 'react-toastify';

const PteHero = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingState, setRecordingState] = useState('idle'); // idle, recording, analyzing, completed
  const [progress, setProgress] = useState(0);
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

  useEffect(() => {
    let interval;
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setRecordingState('analyzing');
            return 100;
          }
          return prev + 5;
        });
      }, 150);
    } else if (recordingState === 'analyzing') {
      let timeout = setTimeout(() => {
        setRecordingState('completed');
      }, 2000);
      return () => clearTimeout(timeout);
    } else if (recordingState === 'idle') {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [recordingState]);

  const handleStartSim = () => {
    setRecordingState('recording');
    setProgress(0);
  };

  const handleResetSim = () => {
    setRecordingState('idle');
    setProgress(0);
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center bg-white font-sans text-gray-900 py-16 overflow-hidden">
      {/* Background visual details */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E30613]/5 rounded-full filter blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full filter blur-3xl -z-10" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center space-y-8">
        
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200"
        >
          <span className="flex w-2.5 h-2.5 rounded-full animate-bounce bg-green-500 shrink-0"></span>
          <span className="text-sm font-semibold text-gray-600 tracking-wide">PTE Academic Preparation</span>
        </motion.div>

        {/* Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[110%] tracking-tight text-gray-900 max-w-4xl"
        >
          Master PTE Academic With <br className="hidden md:block"/>
          Real-Time <span className="text-cta-btn">AI Scoring .</span>
        </motion.h1>

        {/* Paragraph */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-gray-600 max-w-2xl leading-relaxed"
        >
          Mockea perfectly mimics the official Pearson computer-based test environment. Practice Describe Image, Retell Lecture, and Read Aloud with instant diagnostic scores.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center"
        >
          <Link to={'/dashboard'} className="group relative px-8 py-4 bg-cta-btn hover:opacity-90 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-200">
            <span className="relative z-10">Start PTE Practice</span>
            <FiArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button 
            onClick={handleWatchDemoClick}
            className="px-8 py-4 bg-gray-100 border border-gray-200 text-gray-800 font-bold rounded-xl transition-all hover:bg-gray-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiPlay /> Watch System Guide
          </button>
        </motion.div>

        {/* Interactive PTE Practice Sandbox Widget */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, delay: 0.4 }}
          className="w-full max-w-3xl mt-12 bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden p-6 sm:p-8 text-left"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 mb-6 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#E30613] bg-red-50 border border-red-100 px-2.5 py-1 rounded-md">
                PTE Interactive Demo
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-1">Read Aloud Task Type</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <FiCpu className="text-blue-600" /> Powered by Mockea AI Engine
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-6">
            <p className="text-gray-400 text-xs font-bold mb-2 tracking-wide uppercase">Prompt Text:</p>
            <p className="text-lg text-gray-700 leading-relaxed font-medium">
              "The development of easy-to-use digital mapping platforms has changed the way geographic data is processed, helping organizations organize logistics and visualize spatial statistics efficiently."
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
            {recordingState === 'idle' && (
              <div className="text-center space-y-4">
                <p className="text-sm font-semibold text-gray-600">Click the microphone to test your speaking speed & clarity</p>
                <button
                  onClick={handleStartSim}
                  className="mx-auto w-16 h-16 rounded-full bg-[#E30613] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg shadow-red-200"
                >
                  <FiMic size={24} />
                </button>
              </div>
            )}

            {recordingState === 'recording' && (
              <div className="text-center space-y-4 w-full px-12">
                <p className="text-sm font-semibold text-red-500 animate-pulse flex items-center justify-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span> Recording... Speak Now
                </p>
                
                {/* Voice bars animation */}
                <div className="flex justify-center items-end gap-1 h-8">
                  <div className="w-1.5 bg-[#E30613] rounded-full animate-voice-bar h-6" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 bg-[#E30613] rounded-full animate-voice-bar h-8" style={{ animationDelay: '0.3s' }}></div>
                  <div className="w-1.5 bg-[#E30613] rounded-full animate-voice-bar h-4" style={{ animationDelay: '0.5s' }}></div>
                  <div className="w-1.5 bg-[#E30613] rounded-full animate-voice-bar h-7" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 bg-[#E30613] rounded-full animate-voice-bar h-5" style={{ animationDelay: '0.4s' }}></div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#E30613] h-2 rounded-full transition-all duration-150" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {recordingState === 'analyzing' && (
              <div className="text-center space-y-4">
                <p className="text-sm font-semibold text-gray-600 animate-pulse">Mockea AI grading content, fluency, and pronunciation...</p>
                <div className="w-10 h-10 border-4 border-[#E30613] border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            )}

            {recordingState === 'completed' && (
              <div className="w-full px-6 sm:px-10 text-center space-y-6">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <FiCheckCircle size={22} />
                  <span className="text-sm font-bold">Speech successfully graded!</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Content</p>
                    <p className="text-2xl font-black text-gray-900">88 / 90</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Fluency</p>
                    <p className="text-2xl font-black text-gray-900">84 / 90</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Pronunciation</p>
                    <p className="text-2xl font-black text-[#E30613]">79 / 90</p>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  <button onClick={handleResetSim} className="text-xs font-bold text-gray-500 hover:text-gray-700 underline cursor-pointer">
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default PteHero;
