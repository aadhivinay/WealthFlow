import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md backdrop-blur-md bg-white/95 dark:bg-slate-900/95 rounded-t-3xl max-h-[88vh] overflow-y-auto app-scroll safe-bottom shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />
            <div className="flex items-center justify-between px-5 py-3 sticky top-0 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 z-10 rounded-t-3xl">
              <h2 className="font-bold text-slate-900 dark:text-slate-100">{title}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 active:scale-90 transition-transform">
                <X size={22} />
              </button>
            </div>
            <div className="px-5 pb-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
