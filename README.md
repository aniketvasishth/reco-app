# Reco 🧾
### Costco Wholesale Receipt Search, Price Tracker & Instant On-Device Inventory Indexer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![On-Device AI](https://img.shields.io/badge/On--Device_AI-Gemini_Nano-059669?logo=google&logoColor=white)](https://developer.chrome.com/docs/ai/built-in)
[![Material You](https://img.shields.io/badge/Material_You-M3_Palettes-4285F4?logo=google&logoColor=white)](https://m3.material.io/)
[![Privacy First](https://img.shields.io/badge/Privacy--First-100%25_On--Device-emerald)](https://github.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Designed in Canada](https://img.shields.io/badge/Designed_in_%F0%9F%87%A8%F0%9F%87%A6_by-Aniket_Vasishth-red.svg)](https://github.com/aniketvashisht)

**Reco** is a privacy-first, offline-first Progressive Web App (PWA) tailored exclusively for **Costco Wholesale** members. It is engineered to digitize, index, search, and track Costco purchases—including warehouse register paper receipts, digital e-commerce order slips (Costco.com & Costco.ca), and customer service return receipts.

Reco is architected to run **100% on the user's Android phone or browser**, utilizing **Android On-Device Gemini Nano** (via the Chrome Built-in AI Prompt API) and accelerated local WebAssembly OCR. All receipt parsing, price indexing, and data indexing execute locally on your device with complete privacy.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Costco Wholesale Specialization](#-costco-wholesale-specialization)
- [Desktop & Mobile Responsive Experience](#-desktop--mobile-responsive-experience)
- [Architecture & Processing Pipeline](#-architecture--processing-pipeline)
- [Material 3 Design & Dynamic System Accent](#-material-3-design--dynamic-system-accent)
- [Enabling Gemini Nano on Android & Desktop](#-enabling-gemini-nano-on-android--desktop)
- [Multi-Mode Receipt Capture](#-multi-mode-receipt-capture)
- [Search, Filters & Price Analytics](#-search-filters--price-analytics)
- [Privacy, Backup & Sync](#-privacy-backup--sync)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [Credits & License](#-credits--license)

---

## ✨ Key Features

- 🛒 **Exclusively Tailored for Costco Wholesale**
  - **Strict Costco Receipt Validation**: Deterministically verifies the official Costco Wholesale logo or wordmark at the top of receipts; automatically detects and rejects non-Costco receipts (e.g., Walmart, FreshCo, Target) with helpful explanatory feedback.
  - **Warehouse & Online Invoicing**: Seamlessly processes both long physical register tapes and digital Costco.com / Costco.ca e-receipt PDFs.
  - **Costco Savings Analytics**: Computes your estimated 2% Executive Membership reward, 2% Costco/CIBC/Citi credit card cash back, and instant manufacturer savings.

- 🖥️ **Adaptive Desktop & Mobile UI Engine**
  - **Auto Platform Detection**: Checks client user agent, screen dimensions, and input capabilities to serve either a rich full-width desktop workstation or an ergonomics-first mobile interface.
  - **Desktop Dashboard**: Expansive desktop layout featuring high-level metrics cards (Total Spend, Receipts, Indexed Items, Executive Reward), quick action buttons, and keyboard navigation.
  - **Table & Grid View Toggle**: Switch between an informative multi-column data table (with SKU copying, channel badges, unit/total prices) and a responsive 3-column card grid.
  - **Global Keyboard Shortcuts**: Power-user productivity shortcuts (`⌘K` / `/` to search, `S` to scan, `U` to upload, `B` to backup, `Esc` to reset).
  - **Manual View Mode Switcher**: User override in header to force `Desktop View`, `Mobile View`, or `Auto-Detect`.

- 🧠 **On-Device First AI Engine (Gemini Nano)**
  - **100% On-Device Processing**: Runs directly on your device's NPU/GPU with zero cloud telemetry.
  - **Offline-Only Mode**: Toggle on "Offline Only" to disable all external network calls and force local-only execution.
  - **Chrome Built-in AI**: Uses Chrome's native Prompt API (`window.ai.languageModel` / `window.model.languageModel`) powered by Gemini Nano.
  - **WebAssembly OCR Fallback**: If Gemini Nano is unavailable, Reco automatically switches to client-side Tesseract.js WebAssembly OCR combined with a built-in 2,500+ SKU Costco Wholesale catalog matcher.
  - **Optional Cloud Vision Fallback**: User-controlled fallback to Gemini 2.5 Flash for cloud vision OCR (supports personal API key / BYOK).

- 🎨 **Material 3 / Pixel-Inspired Dynamic Theming**
  - **Android 17 / Pixel Wallpaper & Style Sync**: Live system accent detection with dynamic palette generation matching your device wallpaper accent.
  - **Consistent Action Buttons**: Material 3 buttons with state feedback, elevation, and touch accessibility across all drawers and modals.
  - **Curated Dual-Tone Palettes**: 9 expressive Material You color palettes (Pixel Slate, Plum Taupe, Burgundy Rose, Peach Teal, Charcoal Lavender, Royal Blue, Cobalt Emerald, Forest Sage, Dynamic System).
  - **System Synchronized Theming**: Dynamic light and dark mode switching with system preference synchronization, dynamic PWA manifest, theme-color meta tag, and favicon auto-switching.

- 📷 **Multi-Modal Receipt Ingestion**
  - **Live Camera Scanner**: Viewfinder with real-time perspective guidance, framing guides, and torch toggle.
  - **Long Receipt Stitching**: Multi-shot continuous capture for tall thermal Costco warehouse receipts.
  - **Digital PDF Invoices**: Client-side parsing of official PDF e-commerce orders (e.g., Costco.com / Costco.ca).
  - **Image Upload**: Drag-and-drop or file selector for JPG, PNG, and WebP images.
  - **Smart Deduplication**: Automatically detects and prevents duplicate scans via timestamp, warehouse ID, and item hash matching.

- 📊 **Instant Item & Price Analytics**
  - Real-time search across item names, SKUs, warehouse locations, and purchase dates.
  - Interactive price fluctuation charts with unit price historical trends, lowest/highest price markers, and inflation alerts.
  - Spending summary dashboard with warehouse breakdown and category distributions.

- 🔒 **Local-First & Multi-Tier Backup**
  - **Zero-Cloud Default**: Receipts and index data are stored locally in browser storage (LocalStorage / IndexedDB).
  - **Direct Google Drive Sync**: Optional client-to-cloud backup directly to the user's personal Google Drive via OAuth 2.0.
  - **Universal JSON Export/Import**: One-click local backup and restore for cross-device portability.
  - **Automated Nightly Sync**: Configurable background sync schedule at 3:00 AM.

---

## 🏬 Costco Wholesale Specialization

Reco is purposefully built around Costco Wholesale's operational paradigms:

1. **Receipt Header Validation**: Every receipt is checked for the official `COSTCO WHOLESALE` wordmark or logo. If an uploaded document is from another retailer, Reco safely rejects it and alerts you.
2. **Abbreviation Expansion**: Decodes cryptic register receipt abbreviations (e.g., `KS ORG EVOO` &rarr; `Kirkland Signature Organic Extra Virgin Olive Oil`, `ROTISSERIE CHK` &rarr; `Kirkland Signature Fresh Rotisserie Chicken`).
3. **Gift Card Intelligence**: Accurately recognizes and tags popular Costco electronic and physical gift cards (Air Canada, DoorDash, Uber, SkipTheDishes, Cineplex, Nintendo, PlayStation) with correct denominations and tax treatment.
4. **Member Savings Summary**: Quantifies warehouse discounts, instant rebates, Executive 2% reward tier accruals, and eligible credit card rewards.

---

## 🖥️ Desktop & Mobile Responsive Experience

Reco automatically adapts its interface based on platform intelligence:

### Desktop Experience
- **Expansive Hero & Metrics Banner**: Quick glance at total Costco spending, total receipts digitized, unique indexed items, and estimated 2% Executive Membership rebate.
- **Action Grid**: One-click shortcuts for Camera Scan, File/PDF Upload, Spending Summary, and Google Drive Backup.
- **View Toggle & Custom Sorting**: Easily switch between an information-dense Data Table and a responsive 3-column Card Grid. Sort items on the fly by Price (High/Low), Item Name (A–Z), or Purchase Date (Newest/Oldest).
- **Keyboard Shortcuts**:
  - `⌘K` or `/` &mdash; Focus search bar
  - `Esc` &mdash; Clear current search
  - `M` or `R` &mdash; Open Spending Summary & 2% Executive rewards drawer
  - `S` &mdash; Open live receipt scanner
  - `U` &mdash; Open upload dialog (images/PDF/JSON)
  - `B` &mdash; Open backup & Google Drive sync
  - `?` &mdash; Open How-To guide

### Mobile Experience
- **Single-Thumb Ergonomics**: Centered search bar with quick access to common Costco queries and recent searches.
- **Floating Action Bar**: Bottom-anchored touch buttons for high-speed register tape scanning, uploading, and drawer access.
- **Swipe Drawers**: Smooth gesture-friendly Material 3 modal sheets for summaries, settings, and receipt detail views.

### View Mode Selector
Users can change their preferred view mode at any time using the selector in the header bar:
- **Auto-Detect** (Default): Uses user agent and window dimensions.
- **Desktop View**: Locks to the full-width desktop dashboard.
- **Mobile View**: Locks to the compact mobile phone layout.

---

## 🏗️ Architecture & Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    Receipt Input Layer                          │
│  [ Live Camera ]  [ Photo Upload ]  [ Multi-Segment ]  [ PDF ]  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Client-Side Image Preprocessing                 │
│  - Grayscale & High-Pass Filter                                 │
│  - Adaptive Contrast & Binarization                             │
│  - Perspective Rectification                                    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
  ┌──────────────────────────────┐ ┌──────────────────────────────┐
  │  Primary: On-Device AI       │ │  Fallback: WebAssembly OCR   │
  │  Chrome Gemini Nano API      │ │  Tesseract.js WASM + SIMD    │
  │  (window.ai.languageModel)   │ │  + 2,500+ SKU Costco Matcher │
  └──────────────┬───────────────┘ └──────────────┬───────────────┘
                 │                                │
                 └───────────────┬────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Structured Parsing Engine                     │
│  - Warehouse #, Transaction Date & Time, Member ID Extraction   │
│  - Line Item Parser (SKU, Name, Unit Price, Qty, Tax Flag)      │
│  - Discount / Instant Rebate Normalization                      │
│  - Deduplication & Checksum Verification                        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Local Storage & Indexing Layer                  │
│  - IndexedDB & LocalStorage Key-Value Store                     │
│  - Instant In-Memory Search Index & Price Trend Aggregator      │
│  - Optional Direct Client-to-Drive Sync (Google Drive OAuth)    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Material 3 Design & Dynamic System Accent

Reco implements Google's Material Design 3 (M3) design system with adaptive tonal palettes:

| Palette Name | Primary Hue | Mood / Theme Character |
| :--- | :--- | :--- |
| **Dynamic System** | Adaptive Device Accent | Syncs with Android 17 / Pixel Wallpaper & Style accent |
| **Pixel Slate & Blue** | Slate `#2563EB` | Professional, high-contrast cool tech |
| **Plum & Warm Taupe** | Plum `#7C2D64` | Warm, organic, editorial feel |
| **Burgundy & Soft Rose** | Burgundy `#9C1D42` | Elegant, refined wine-tone palette |
| **Peach & Deep Teal** | Coral Teal `#B45309` | Vibrant, energetic modern contrast |
| **Charcoal & Lavender** | Lavender `#6D28D9` | High-tech, subdued nocturnal contrast |
| **Royal Blue & Magenta** | Indigo `#1D4ED8` | Bold, dynamic digital aesthetic |
| **Cobalt & Emerald** | Cobalt Green `#0284C7` | Crisp financial / commerce palette |
| **Forest Green & Sage** | Forest `#15803D` | Natural, grounding botanical theme |

---

## 📱 Enabling Gemini Nano on Android & Desktop

To unlock on-device Gemini Nano receipt parsing:

### On Android (Chrome 128+)

1. **Enable Prompt API**:
   - Open Chrome and navigate to: `chrome://flags/#prompt-api-for-gemini-nano`
   - Set the flag to **Enabled**.

2. **Enable Optimization Guide On-Device Model**:
   - Navigate to: `chrome://flags/#optimization-guide-on-device-model`
   - Set the flag to **Enabled BypassPrefRequirement**.

3. **Relaunch Chrome**:
   - Tap **Relaunch** at the bottom of the screen.

4. **Trigger Model Weight Download**:
   - Navigate to: `chrome://components/`
   - Locate **Optimization Guide On Device Model** and tap **Check for update**.
   - Your device will download the Gemini Nano model weights over Wi-Fi in the background.

### On Desktop (Chrome 128+)

1. Enable the same flags in `chrome://flags`.
2. Ensure you have at least 22 GB of free storage on your primary drive for model weight caching.
3. Verify on-device model status at `chrome://components`.

> **Note:** If your device or browser does not yet support Gemini Nano, Reco's WebAssembly OCR engine runs immediately with zero setup required.

---

## ⚙️ AI Engine Settings

Under **Settings > AI Processing Engine**, you can configure:

| Option | Default | Behavior |
| :--- | :--- | :--- |
| **Offline Only** | `OFF` | Strictly disables all cloud API network requests. Forces 100% on-device Gemini Nano and WebAssembly OCR. |
| **Allow Cloud AI Fallback** | `OFF` | Allows optional cloud vision requests only if on-device Gemini Nano is not available. |
| **Engine Preference** | `100% On-Device` | Prioritizes on-device NPU/GPU execution before any other method. |
| **Personal Gemini Key (BYOK)** | None | Optional Google AI Studio API key stored locally in browser storage. |
| **Hardware Diagnostic** | — | Interactive modal testing Prompt API, WASM/SIMD, and Camera availability. |

---

## 🛠️ Tech Stack

- **Core**: [React 19](https://react.dev/), [TypeScript 5.8](https://www.typescriptlang.org/), [Vite 6](https://vitejs.dev/)
- **Server**: [Express 4](https://expressjs.com/) with [esbuild](https://esbuild.github.io/) bundling
- **UI & Animations**: [Tailwind CSS v4](https://tailwindcss.com/), [Motion](https://motion.dev/), [Lucide React](https://lucide.dev/)
- **On-Device AI**: Chrome Prompt API (Gemini Nano)
- **Local OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/) WebAssembly with SIMD
- **Cloud Fallback**: [@google/genai](https://www.npmjs.com/package/@google/genai)
- **PDF Processing**: [PDF.js](https://mozilla.github.io/pdf.js/)
- **Charts & Visualization**: [Recharts](https://recharts.org/)
- **PWA & Icons**: [Vite PWA Plugin](https://vite-pwa-org.netlify.app/), [Sharp](https://sharp.pixelplumbing.com/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aniketvashisht/reco.git
   cd reco
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 📦 Available Scripts

- `npm run dev` — Starts the Express backend and Vite development server on port 3000.
- `npm run build` — Builds the Vite client to `dist/` and compiles `server.ts` to `dist/server.cjs`.
- `npm run start` — Boots the compiled production server (`node dist/server.cjs`).
- `npm run lint` — Runs TypeScript type verification (`tsc --noEmit`).

---

## 🔐 Security & Privacy

- **On-Device First**: All receipt images, extracted text, and item catalog indexing happen directly within the user's browser environment.
- **Local Storage by Default**: Receipts never leave your device unless you explicitly initiate a personal Google Drive sync.
- **Direct OAuth Communication**: When using Google Drive backup, credentials and files travel strictly between your client browser and Google APIs via official OAuth 2.0 tokens without third-party proxy servers.

---

## 🇨🇦 Credits & License

Designed in 🇨🇦 by **Aniket Vasishth**.

This project is licensed under the [MIT License](LICENSE).
