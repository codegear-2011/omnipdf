import React from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { PDFTool } from '../types.ts';
import { cn } from '../lib/utils.ts';

interface ToolCardProps {
  tool: PDFTool;
  onClick: (tool: PDFTool) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  const IconComponent = (Icons as any)[tool.icon] || Icons.File;

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(tool)}
      className="group relative flex flex-col items-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 text-center w-full h-full"
      id={`tool-card-${tool.id}`}
    >
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
        tool.color.replace('600', '100'),
        "shadow-sm"
      )}>
        <IconComponent size={32} className={tool.color.replace('bg-', 'text-')} />
      </div>
      
      <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-black transition-colors">
        {tool.title}
      </h3>
      <p className="text-xs text-slate-400 leading-relaxed">
        {tool.description}
      </p>
    </motion.button>
  );
};
