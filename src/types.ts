export type ToolType = 'merge' | 'split' | 'image-to-pdf' | 'pdf-to-image' | 'extract-text' | 'rotate' | 'watermark' | 'page-numbers' | 'remove-pages' | 'unlock' | 'text-to-pdf' | 'sign';

export interface PDFTool {
  id: ToolType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const PDF_TOOLS: PDFTool[] = [
  {
    id: 'merge',
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into one document.',
    icon: 'Combine',
    color: 'bg-red-600',
  },
  {
    id: 'split',
    title: 'Split PDF',
    description: 'Extract pages from your PDF or save each page as a separate PDF.',
    icon: 'Scissors',
    color: 'bg-orange-600',
  },
  {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Convert JPG, PNG, and more into a single PDF document.',
    icon: 'Image',
    color: 'bg-indigo-600',
  },
  {
    id: 'extract-text',
    title: 'Extract Text',
    description: 'Pull all text from a PDF document into a text file.',
    icon: 'Type',
    color: 'bg-purple-600',
  },
  {
    id: 'pdf-to-image',
    title: 'PDF to Image',
    description: 'Convert PDF pages into high-quality JPG images.',
    icon: 'Image',
    color: 'bg-pink-600',
  },
  {
    id: 'rotate',
    title: 'Rotate PDF',
    description: 'Rotate your PDF pages precisely as you need.',
    icon: 'RotateCw',
    color: 'bg-cyan-600',
  },
  {
    id: 'watermark',
    title: 'Watermark',
    description: 'Add a custom text watermark to all pages of your PDF.',
    icon: 'Type',
    color: 'bg-rose-600',
  },
  {
    id: 'page-numbers',
    title: 'Page Numbers',
    description: 'Easily add page numbers to your PDF document.',
    icon: 'Hash',
    color: 'bg-violet-600',
  },
  {
    id: 'remove-pages',
    title: 'Remove Pages',
    description: 'Delete unwanted pages from your PDF file.',
    icon: 'Trash2',
    color: 'bg-slate-700',
  },
  {
    id: 'unlock',
    title: 'Unlock PDF',
    description: 'Remove password protection from your PDF file.',
    icon: 'Unlock',
    color: 'bg-emerald-600',
  },
  {
    id: 'text-to-pdf',
    title: 'Text to PDF',
    description: 'Convert plain text directly into a PDF document.',
    icon: 'FileText',
    color: 'bg-blue-600',
  },
  {
    id: 'sign',
    title: 'Sign PDF',
    description: 'Add a signature image to your PDF pages.',
    icon: 'PenTool',
    color: 'bg-amber-600',
  }
];
