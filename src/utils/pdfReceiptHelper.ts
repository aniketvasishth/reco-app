import * as pdfjsLib from 'pdfjs-dist';

// Set up worker source with CDN fallback
try {
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('PDF.js worker setup warning:', e);
}

export interface PdfRenderResult {
  dataUrl: string;
  numPages: number;
  extractedText: string;
}

/**
 * Checks if a file is a PDF based on type or extension.
 */
export function isPdfFile(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  );
}

/**
 * Converts a PDF file into a rendered image preview (pages combined vertically) and extracts any embedded text.
 */
export async function renderPdfToImage(file: File): Promise<PdfRenderResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    let extractedText = '';
    const pagesToScan = Math.min(numPages, 4);
    const renderedPages: { canvas: HTMLCanvasElement; width: number; height: number }[] = [];
    let totalHeight = 0;
    let maxWidth = 0;

    for (let i = 1; i <= pagesToScan; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .filter(Boolean)
          .join(' ');
        extractedText += `\n--- PAGE ${i} ---\n${pageStrings}`;

        const viewport = page.getViewport({ scale: 1.8 });
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = viewport.width;
        pageCanvas.height = viewport.height;
        const pctx = pageCanvas.getContext('2d');
        if (pctx) {
          pctx.fillStyle = '#FFFFFF';
          pctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          await page.render({
            canvasContext: pctx,
            viewport,
            canvas: pageCanvas as any,
          } as any).promise;

          renderedPages.push({ canvas: pageCanvas, width: viewport.width, height: viewport.height });
          totalHeight += viewport.height;
          if (viewport.width > maxWidth) maxWidth = viewport.width;
        }
      } catch (pageErr) {
        console.warn(`Could not render page ${i}:`, pageErr);
      }
    }

    if (renderedPages.length > 0 && maxWidth > 0 && totalHeight > 0) {
      const combinedCanvas = document.createElement('canvas');
      combinedCanvas.width = maxWidth;
      combinedCanvas.height = totalHeight;
      const cctx = combinedCanvas.getContext('2d');
      if (cctx) {
        cctx.fillStyle = '#FFFFFF';
        cctx.fillRect(0, 0, maxWidth, totalHeight);
        let currentY = 0;
        for (const p of renderedPages) {
          cctx.drawImage(p.canvas, 0, currentY);
          currentY += p.height;
        }
        const dataUrl = combinedCanvas.toDataURL('image/jpeg', 0.88);
        return { dataUrl, numPages, extractedText };
      }
    }

    return { dataUrl: '', numPages, extractedText };
  } catch (error) {
    console.warn('PDF client-side render failed, falling back to direct base64:', error);
    return { dataUrl: '', numPages: 1, extractedText: '' };
  }
}
