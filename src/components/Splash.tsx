import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashProps {
  onComplete: () => void;
}

const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="app-shell bg-slate-950 flex flex-col items-center justify-center max-w-md mx-auto relative overflow-hidden">
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative"
      >
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.9, 1, 0.9],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-28 h-28 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #FF9933 0%, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%, #138808 100%)',
          }}
        >
          <span className="text-5xl font-bold text-slate-900 drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            ₹
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-8 text-center"
      >
        <h1 className="text-xl font-bold text-white tracking-wide">WealthFlow Engine</h1>
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-sm text-slate-400 mt-2"
        >
          Your personal finance execution engine
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 120 }}
        transition={{ duration: 2.8, ease: 'easeInOut' }}
        className="absolute bottom-20 h-0.5 bg-emerald-500 rounded-full"
      />
    </div>
  );
};

export default Splash;
