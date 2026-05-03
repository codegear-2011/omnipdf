import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  return await mergedPdf.save();
}

export async function splitPDF(file: File, pageRanges: number[][]): Promise<Uint8Array[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const results: Uint8Array[] = [];
  
  for (const range of pageRanges) {
    const subPdf = await PDFDocument.create();
    const pagesToCopy = range.map(p => p - 1); // 1-based to 0-based
    const copiedPages = await subPdf.copyPages(pdf, pagesToCopy);
    copiedPages.forEach(p => subPdf.addPage(p));
    results.push(await subPdf.save());
  }
  
  return results;
}

export async function imagesToPDF(files: File[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    let image;
    
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(arrayBuffer);
    } else if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      continue;
    }
    
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }
  
  return await pdfDoc.save();
}

export async function rotatePDF(file: File, degrees: number): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  const rotation = (degrees % 360 + 360) % 360; 
  
  pages.forEach(page => {
    const currentRotation = page.getRotation().angle;
    page.setRotation({ type: 'degrees', angle: (currentRotation + rotation) % 360 } as any);
  });
  
  return await pdf.save();
}

export async function addWatermark(file: File, text: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const HelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - (text.length * 20) / 2,
      y: height / 2,
      size: 50,
      font: HelveticaBold,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.3,
      rotate: { type: 'degrees', angle: 45 } as any,
    });
  }

  return await pdfDoc.save();
}

export async function addPageNumbers(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width } = page.getSize();
    const text = `Page ${i + 1} of ${pages.length}`;
    page.drawText(text, {
      x: width - 100,
      y: 20,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  return await pdfDoc.save();
}

export async function removePages(file: File, pagesToRemove: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  
  const originalIndices = Array.from({ length: totalPages }, (_, i) => i);
  const indicesToKeep = originalIndices.filter(i => !pagesToRemove.includes(i + 1));
  
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdf, indicesToKeep);
  copiedPages.forEach(p => newPdf.addPage(p));
  
  return await newPdf.save();
}

export async function unlockPDF(file: File, password: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  // To unlock, we load with password and save without it
  const pdf = await PDFDocument.load(arrayBuffer, { password } as any);
  return await pdf.save();
}

export async function textToPDF(text: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  const fontSize = 12;
  
  // Basic multi-line text wrapping for textToPDF
  const lines = text.split('\n');
  let cursorY = height - 50;
  
  for (const line of lines) {
    if (cursorY < 50) {
      const newPage = pdfDoc.addPage();
      cursorY = newPage.getSize().height - 50;
    }
    const currentPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
    currentPage.drawText(line, {
      x: 50,
      y: cursorY,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    cursorY -= fontSize + 5;
  }
  
  return await pdfDoc.save();
}

export async function signPDF(file: File, signatureFile: File, pageIndex: number): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  const sigBuffer = await signatureFile.arrayBuffer();
  let sigImage;
  if (signatureFile.type === 'image/png') {
    sigImage = await pdfDoc.embedPng(sigBuffer);
  } else {
    sigImage = await pdfDoc.embedJpg(sigBuffer);
  }
  
  const pages = pdfDoc.getPages();
  const targetPage = pages[Math.min(pageIndex - 1, pages.length - 1)];
  const { width } = targetPage.getSize();
  
  // Draw signature at bottom right
  const sigWidth = 150;
  const sigHeight = (sigImage.height / sigImage.width) * sigWidth;
  
  targetPage.drawImage(sigImage, {
    x: width - sigWidth - 50,
    y: 50,
    width: sigWidth,
    height: sigHeight,
  });
  
  return await pdfDoc.save();
}

export function downloadBlob(data: Uint8Array, filename: string, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
