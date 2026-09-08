import React, { useEffect, useState } from 'react';
import { useNavigation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TopProgressBar: Sleek top-of-screen loading indicator (YouTube/Linear style)
 * Provides instantaneous visual feedback for route changes and async data fetches
 * without causing full-screen flashes or layout shifts.
 */
export default function TopProgressBar({ active }) {
  let isRouteNavigating = false;
  try {
    const navigation = useNavigation();
    isRouteNavigating = navigation.state !== 'idle';
  } catch {
    // Fallback if rendered outside data router context
    isRouteNavigating = false;
  }

  const isVisible = active !== undefined ? active : isRouteNavigating;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer;
    if (isVisible) {
      setProgress(25);
      timer = setTimeout(() => {
        setProgress(70);
      }, 200);
    } else {
      setProgress(100);
      timer = setTimeout(() => {
        setProgress(0);
      }, 300);
    }

    return () => clearTimeout(timer);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[99999] h-[3px] pointer-events-none bg-transparent"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{
              ease: [0.16, 1, 0.3, 1],
              duration: progress === 100 ? 0.2 : 0.6,
            }}
            className="h-full bg-linear-to-r from-blue-600 via-indigo-500 to-primary shadow-[0_0_12px_rgba(37,99,235,0.8)]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
