import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { ToolCard } from './components/ToolCard.tsx';
import { FileUploader } from './components/FileUploader.tsx';
import { ProcessingOverlay } from './components/ProcessingOverlay.tsx';
import { PDF_TOOLS, PDFTool } from './types.ts';
import { mergePDFs, splitPDF, imagesToPDF, rotatePDF, addWatermark, addPageNumbers, removePages, unlockPDF, textToPDF, signPDF, downloadBlob } from './lib/pdf-engine.ts';
import { cn } from './lib/utils.ts';
import confetti from 'canvas-confetti';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export default function App() {
  const [selectedTool, setSelectedTool] = useState<PDFTool | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [splitRanges, setSplitRanges] = useState<string>("1-2, 3-5");
  const [watermarkText, setWatermarkText] = useState<string>("CONFIDENTIAL");
  const [toRemove, setToRemove] = useState<string>("1, 3, 5");
  const [rotateAngle, setRotateAngle] = useState<number>(90);
  const [textInput, setTextInput] = useState<string>("This is a new PDF document.");
  const [unlockPassword, setUnlockPassword] = useState<string>("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signPage, setSignPage] = useState<number>(1);

  const reset = () => {
    setFiles([]);
    setSelectedTool(null);
    setError(null);
    setIsProcessing(false);
    setUnlockPassword("");
    setSignatureFile(null);
  };

  const handleProcess = async () => {
    if (files.length === 0 && selectedTool?.id !== 'text-to-pdf') return;
    setIsProcessing(true);
    setError(null);

    try {
      if (selectedTool?.id === 'merge') {
        const mergedData = await mergePDFs(files);
        downloadBlob(mergedData, 'merged_omnipdf.pdf', 'application/pdf');
      } 
      else if (selectedTool?.id === 'split') {
        const ranges = splitRanges.split(',').map(r => {
          const [start, end] = r.trim().split('-').map(Number);
          if (!end) return [start];
          const result = [];
          for (let i = start; i <= end; i++) result.push(i);
          return result;
        });
        
        const results = await splitPDF(files[0], ranges);
        results.forEach((data, i) => {
          downloadBlob(data, `split_part_${i + 1}_omnipdf.pdf`, 'application/pdf');
        });
      }
      else if (selectedTool?.id === 'image-to-pdf') {
        const pdfData = await imagesToPDF(files);
        downloadBlob(pdfData, 'images_to_pdf_omnipdf.pdf', 'application/pdf');
      }
      else if (selectedTool?.id === 'rotate') {
        const rotatedData = await rotatePDF(files[0], rotateAngle);
        downloadBlob(rotatedData, 'rotated_omnipdf.pdf', 'application/pdf');
      }
      else if (selectedTool?.id === 'watermark') {
        const watermarkedData = await addWatermark(files[0], watermarkText);
        downloadBlob(watermarkedData, 'watermarked_omnipdf.pdf', 'application/pdf');
      }
      else if (selectedTool?.id === 'page-numbers') {
        const numberedData = await addPageNumbers(files[0]);
        downloadBlob(numberedData, 'numbered_omnipdf.pdf', 'application/pdf');
      }
      else if (selectedTool?.id === 'remove-pages') {
        const pagesToRemove = toRemove.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
        const limitedData = await removePages(files[0], pagesToRemove);
        downloadBlob(limitedData, 'cleaned_omnipdf.pdf', 'application/pdf');
      }
      else if (selectedTool?.id === 'unlock') {
        if (!unlockPassword) throw new Error("Please enter the password to unlock this PDF.");
        const unlockedData = await unlockPDF(files[0], unlockPassword);
        downloadBlob(unlockedData, 'unlocked_omnipdf.pdf', 'application/pdf');
      }
      else if (selectedTool?.id === 'text-to-pdf') {
        const pdfData = await textToPDF(textInput);
        downloadBlob(pdfData, 'text_to_pdf_omnipdf.pdf', 'application/pdf');
      }
      else if (selectedTool?.id === 'sign') {
        if (!signatureFile) throw new Error("Please upload a signature image.");
        const signedData = await signPDF(files[0], signatureFile, signPage);
        downloadBlob(signedData, 'signed_omnipdf.pdf', 'application/pdf');
      }
      else if (selectedTool?.id === 'pdf-to-image') {
        const loadingTask = pdfjs.getDocument(await files[0].arrayBuffer());
        const pdf = await loadingTask.promise;
        const maxPages = Math.min(pdf.numPages, 10);
        
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({ canvasContext: context, viewport }).promise;
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          downloadBlob(new Uint8Array(arrayBuffer), `page_${i}_image.jpg`, 'image/jpeg');
        }
      }
      else if (selectedTool?.id === 'extract-text') {
        let fullText = "";
        for (const file of files) {
          const loadingTask = pdfjs.getDocument(await file.arrayBuffer());
          const pdf = await loadingTask.promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
          }
        }
        const textBlob = new Uint8Array(new TextEncoder().encode(fullText));
        downloadBlob(textBlob, 'extracted_text_omnipdf.txt', 'text/plain');
      }

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b']
      });
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while processing the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 pb-20">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-100 h-16 px-8 flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={reset}
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
            <Icons.LayoutGrid size={22} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">Swift<span className="text-indigo-600">PDF</span></span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
          <div className="flex items-center hover:text-indigo-600 transition-colors cursor-default">
            <Icons.ShieldCheck size={16} className="mr-2 text-indigo-500" />
            100% Private
          </div>
          <div className="flex items-center hover:text-indigo-600 transition-colors cursor-default">
            <Icons.Zap size={16} className="mr-2 text-amber-500" />
            Fast Processing
          </div>
          <button className="px-5 py-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">Login</button>
          <button className="px-5 py-2 bg-indigo-600 text-white rounded-full shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-colors">Sign Up Free</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-8 flex flex-col gap-8">
        <AnimatePresence mode="wait">
          {!selectedTool ? (
            <motion.section
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-8"
            >
              <div className="text-center space-y-3">
                <motion.h1 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
                >
                  Every PDF tool you'll ever need.
                </motion.h1>
                <p className="max-w-2xl mx-auto text-lg text-slate-500">
                  Fast, simple, and secure document processing directly in your browser. No installation required.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PDF_TOOLS.map((tool) => (
                  <ToolCard 
                    key={tool.id} 
                    tool={tool} 
                    onClick={setSelectedTool} 
                  />
                ))}
              </div>

              {/* Stats Footer Mockup */}
              <div className="flex justify-center gap-12 py-8 mt-4 border-t border-slate-100">
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-800">12M+</div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Files Converted</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-800">4.9/5</div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">User Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-800">0.4s</div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Avg Speed</div>
                </div>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="tool-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <button 
                onClick={reset}
                className="mb-8 flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Icons.ArrowLeft size={16} className="mr-2" />
                Back to all tools
              </button>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl",
                  selectedTool.color
                )}>
                  {(Icons as any)[selectedTool.icon] && React.createElement((Icons as any)[selectedTool.icon], { size: 32 })}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">{selectedTool.title}</h2>
                  <p className="text-slate-500">{selectedTool.description}</p>
                </div>
              </div>

              <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm">
                <FileUploader 
                  files={files} 
                  setFiles={setFiles} 
                  accept={selectedTool.id === 'image-to-pdf' ? { 'image/*': ['.jpg', '.jpeg', '.png'] } : { 'application/pdf': ['.pdf'] }}
                  label={selectedTool.id === 'image-to-pdf' ? "Select Images" : "Select PDF files"}
                />

                {selectedTool.id === 'split' && files.length > 0 && (
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Split Ranges</label>
                    <input 
                      type="text" 
                      value={splitRanges}
                      onChange={(e) => setSplitRanges(e.target.value)}
                      placeholder="e.g. 1-2, 3-5"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                    <p className="mt-2 text-xs text-slate-400">Separate ranges with commas. Example: 1-2 will extract the first two pages as one PDF.</p>
                  </div>
                )}

                {selectedTool.id === 'rotate' && files.length > 0 && (
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                    <label className="block text-sm font-bold text-slate-700 mb-4">Rotation Angle</label>
                    <div className="flex space-x-4">
                      {[0, 90, 180, 270].map(angle => (
                        <button
                          key={angle}
                          onClick={() => setRotateAngle(angle)}
                          className={cn(
                            "px-6 py-3 rounded-xl font-semibold transition-all border",
                            rotateAngle === angle 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                              : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                          )}
                        >
                          {angle}°
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTool.id === 'watermark' && files.length > 0 && (
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Watermark Text</label>
                    <input 
                      type="text" 
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                )}

                {selectedTool.id === 'remove-pages' && files.length > 0 && (
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Pages to Remove</label>
                    <input 
                      type="text" 
                      value={toRemove}
                      onChange={(e) => setToRemove(e.target.value)}
                      placeholder="e.g. 1, 3, 5"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                    <p className="mt-2 text-xs text-slate-400">Enter page numbers separated by commas.</p>
                  </div>
                )}

                {selectedTool.id === 'unlock' && files.length > 0 && (
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                    <input 
                      type="password" 
                      value={unlockPassword}
                      onChange={(e) => setUnlockPassword(e.target.value)}
                      placeholder="Enter the PDF password"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                    <p className="mt-2 text-xs text-slate-400">Required to remove security from the file.</p>
                  </div>
                )}

                {selectedTool.id === 'text-to-pdf' && (
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Content</label>
                    <textarea 
                      rows={6}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter the text for your PDF..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                    />
                  </div>
                )}

                {selectedTool.id === 'sign' && files.length > 0 && (
                  <div className="mt-8 space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className="block text-sm font-bold text-slate-700 mb-4">Upload Signature Image</label>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSignatureFile(e.target.files ? e.target.files[0] : null)}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                      />
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Page Number</label>
                      <input 
                        type="number"
                        min={1}
                        value={signPage}
                        onChange={(e) => setSignPage(parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-start space-x-3 text-sm animate-shake">
                    <Icons.AlertCircle size={20} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mt-12 flex items-center justify-center">
                  <button
                    disabled={files.length === 0 || isProcessing}
                    onClick={handleProcess}
                    className={cn(
                      "group relative px-10 py-4 rounded-2xl font-bold text-white transition-all duration-300 transform active:scale-95 flex items-center space-x-3",
                      files.length === 0 ? "bg-slate-200 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-xl shadow-indigo-500/20"
                    )}
                  >
                    <span>{selectedTool.id === 'extract-text' ? 'Extract Text' : `Convert to ${selectedTool.id === 'image-to-pdf' ? 'PDF' : selectedTool.title.split(' ')[0]}`}</span>
                    <Icons.Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {isProcessing && <ProcessingOverlay message={`Optimizing your ${selectedTool?.id === 'image-to-pdf' ? 'images' : 'document'}...`} />}
      </AnimatePresence>
    </div>
  );
}
