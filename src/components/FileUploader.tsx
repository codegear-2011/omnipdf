import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, File as FileIcon, Plus } from 'lucide-react';
import { cn } from '../lib/utils.ts';

interface FileUploaderProps {
  files: File[];
  setFiles: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  label?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  files, 
  setFiles, 
  accept = { 'application/pdf': ['.pdf'] },
  maxFiles = 50,
  label = "Select files"
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles([...files, ...acceptedFiles].slice(0, maxFiles));
  }, [files, setFiles, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: accept as any,
    multiple: true
  } as any);

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full space-y-6">
      <div 
        {...getRootProps()} 
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center",
          isDragActive 
            ? "border-indigo-500 bg-indigo-50/50" 
            : "border-slate-100 hover:border-slate-300 bg-slate-50/50"
        )}
        id="dropzone"
      >
        <input {...getInputProps()} />
        
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-100">
          <Upload className={cn("transition-colors", isDragActive ? "text-indigo-500" : "text-slate-400")} />
        </div>
        
        <h4 className="text-lg font-bold text-slate-900 mb-1">{label}</h4>
        <p className="text-sm text-slate-500">or drag and drop them here</p>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative flex items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-blue-500 mr-3">
                  <FileIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))}
            
            {files.length < maxFiles && (
              <button 
                {...getRootProps()}
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 hover:border-gray-200 hover:text-gray-600 transition-all cursor-pointer"
              >
                <Plus size={20} className="mr-2" />
                <span className="text-sm font-medium">Add more</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
