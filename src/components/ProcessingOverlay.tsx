import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface ProcessingOverlayProps {
  message?: string;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ message = "Processing your PDF..." }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full flex flex-col items-center text-center border border-slate-100">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">SwiftPDF Engine</h3>
        <p className="text-slate-500">{message}</p>
        <div className="mt-8 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-full bg-indigo-600 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
};
