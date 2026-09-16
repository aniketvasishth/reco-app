import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { parseReceiptWithGemini } from './server/geminiParser';

dotenv.config();

const app = express();
const PORT = 3000;

// Support base64 image uploads for phone camera scans
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Serve local tesseract assets if present to prevent cross-origin worker script failures
const tesseractDistPath = path.join(process.cwd(), 'node_modules/tesseract.js/dist');
const tesseractCorePath = path.join(process.cwd(), 'node_modules/tesseract.js-core');
if (fs.existsSync(tesseractDistPath)) {
  app.use('/tesseract-dist', express.static(tesseractDistPath));
}
if (fs.existsSync(tesseractCorePath)) {
  app.use('/tesseract-core', express.static(tesseractCorePath));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Gemini AI Vision Receipt Parser Endpoint (supports blurry, low-light, and multi-section long receipts)
app.post('/api/gemini/parse-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType, fileName, images } = req.body;
    if (!imageBase64 && (!images || !Array.isArray(images) || images.length === 0)) {
      return res.status(400).json({ error: 'imageBase64 or images payload is required' });
    }

    const aiResult = await parseReceiptWithGemini({
      imageBase64,
      mimeType,
      fileName,
      images,
    });

    if (
      !aiResult.isReceipt ||
      aiResult.isCostcoReceipt === false ||
      aiResult.hasCostcoLogoAtTop === false
    ) {
      return res.status(422).json({
        error:
          aiResult.nonReceiptReason ||
          'Receipt rejected: Costco receipts have the Costco Wholesale logo at the top. Non-Costco receipts are not accepted.',
        isReceipt: false,
        isCostcoReceipt: false,
        hasCostcoLogoAtTop: false,
      });
    }

    res.json({
      success: true,
      data: aiResult,
    });
  } catch (error: any) {
    console.error('Gemini receipt parsing error:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze receipt with Gemini AI.',
      details: error.toString(),
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

