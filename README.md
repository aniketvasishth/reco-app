# Reco 🧾
### Costco Wholesale Receipt Search & Instant On-Device Inventory Indexer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-Vision_API-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

**Reco** is a private, offline-first web application designed to scan, digitize, search, and track wholesale receipts (including Costco warehouse paper receipts, e-invoices, and refund slips). It extracts structured item numbers, quantities, unit prices, discounts, and warehouse locations using Google Gemini Vision, while keeping your personal financial data securely indexed on your device.

---

## ✨ Features

- **📷 AI-Powered Receipt Scanner**
  - **Standard Capture**: Single-shot receipt photo capture with automatic perspective correction and edge detection.
  - **Long Receipt Stitching**: Multi-section continuous capture for extra-long thermal paper receipts.
  - **Digital PDF Invoices**: Native client-side parsing for downloaded digital e-commerce invoices (Costco.com / Costco.ca).
  - **Intelligent Item Extraction**: Powered by Google Gemini 2.5 Flash to automatically detect item names, item numbers, unit costs, discounts, tax flags, and payment totals.

- **🔍 Instant Item & Price Search**
  - Search across all historical purchases by keyword, product name, Costco item number, or warehouse location.
  - Interactive price trend charts showing unit price fluctuations, promotions, and inflation over time.
  - Category breakdown and spend analytics powered by Recharts.

- **🔒 Privacy-First Architecture**
  - All receipt data is stored locally on your device by default (IndexedDB / LocalStorage).
  - No third-party data tracking, telemetry, or analytics.
  - Optional cloud backup & multi-device sync via your own personal Firebase Firestore database.

- **💾 Data Portability & Local Backups**
  - **Native File System "Save As"**: Choose your destination folder directly via the File System Access API.
  - **JSON Backups**: Complete database export and restore with automatic duplicate resolution.
  - **CSV Export**: Clean spreadsheet export formatted for Excel, Google Sheets, or personal accounting software.

- **📱 Installable PWA & Responsive Design**
  - Built with Material 3 (M3) design principles and smooth animations using `motion/react`.
  - Supports adaptive light and dark themes.
  - Fully installable on iOS, Android, macOS, and Windows with offline access.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), [Motion](https://motion.dev/), [Lucide React](https://lucide.dev/)
- **Backend / API**: [Express](https://expressjs.com/), [Node.js](https://nodejs.org/)
- **AI & Vision**: [@google/genai](https://www.npmjs.com/package/@google/genai) (Google Gemini API)
- **Document Processing**: [PDF.js](https://mozilla.github.io/pdf.js/) for digital invoices, [Tesseract.js](https://tesseract.projectnaptha.com/) for offline OCR fallback
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Storage**: Client-side storage (IndexedDB / LocalStorage) with optional [Firebase](https://firebase.google.com/) Firestore sync

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (free tier available)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/reco.git
   cd reco
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy the example environment file and add your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`.

---

## 📦 Available Scripts

- `npm run dev` — Starts the Express backend and Vite development server on port 3000.
- `npm run build` — Compiles the Vite client app into `dist/` and bundles `server.ts` into `dist/server.cjs` via esbuild.
- `npm run start` — Runs the compiled production server (`node dist/server.cjs`).
- `npm run lint` — Runs TypeScript type-checking (`tsc --noEmit`).
- `npm run preview` — Previews the built production client locally.

---

## 📂 Project Structure

```
├── public/                 # Static assets, PWA icons, manifest
├── src/
│   ├── components/         # Modular UI components
│   │   ├── ReceiptCameraScanner.tsx # Camera viewfinder & edge alignment
│   │   ├── ScanReceiptModal.tsx     # Camera mode selection
│   │   ├── UploadModal.tsx          # Multi-file batch upload (PDFs/images/CSV)
│   │   ├── SettingsDrawer.tsx       # Local backup, themes, sync settings
│   │   ├── PriceHistoryModal.tsx    # Price trend analytics & item history
│   │   └── ...
│   ├── services/           # Local storage, backup & File System Access APIs
│   ├── utils/              # PDF extraction, parsing utilities, mock samples
│   ├── App.tsx             # Main application dashboard
│   ├── main.tsx            # React application entry point
│   └── types.ts            # TypeScript interfaces and data models
├── server/
│   └── geminiParser.ts     # Server-side Gemini Vision OCR & schema extraction
├── server.ts               # Express server and Vite SPA middleware
├── package.json            # Project dependencies and npm scripts
├── vite.config.ts          # Vite build, PWA manifest, and plugin setup
└── README.md               # Project documentation
```

---

## 🔐 Security & Privacy

- **Server-Side API Key Protection**: Your Gemini API key is never exposed to the client browser. All AI vision requests are proxied through the local Express server `/api/gemini/parse-receipt` endpoint.
- **Local-First Storage**: Receipt images, extracted product names, and purchase amounts remain within your browser storage unless you explicitly connect your personal Firebase project.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
