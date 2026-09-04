# OmniStream — Universal Social Media & Document Downloader

<!-- ![OmniStream Banner](public/globe.svg) -->

**OmniStream** is a modern, high-performance web application for resolving and downloading public media from **Instagram** and **LinkedIn**. It allows users to preview photos, reels, videos, and multi-page carousel slides, download items individually, bundle selections into high-speed ZIP archives, or convert image sets into multi-page PDF documents.

---

## ✨ Features

- 📸 **Instagram Support**:
  - Download single photos, videos, Reels, and multi-item carousel albums.
  - High-resolution direct streaming with custom proxy tokenization.

- 💼 **LinkedIn Support**:
  - Download public LinkedIn post images, multi-image gallery carousels, and videos.
  - Dynamic **LinkedIn Electric Blue** theme with custom UI accents.

- 📦 **Batch ZIP Archiving**:
  - Select up to 20 media items and bundle them into a single `.zip` file with real-time progress indicators.

- 📄 **PDF Document Export**:
  - Combine multiple photos or document slide decks directly into a formatted `.pdf` document using `pdf-lib`.

- 🔍 **Interactive Lightbox Preview**:
  - Fullscreen responsive lightbox modal with carousel navigation, keyboard shortcuts (`←`, `→`, `Esc`), and individual download buttons.

- 🌐 **6-Language Internationalization (i18n)**:
  - English (`en`), Hindi (`hi`), Chinese (`zh`), Japanese (`ja`), Spanish (`es`), and French (`fr`).

- 🔒 **Privacy & Zero Persistence**:
  - Media streams directly from origin to browser without persisting user media or credentials on the server.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16 (Turbopack, App Router)](https://nextjs.org/)
- **UI & Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Radix UI, Lucide Icons, Sonner Toasts
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
- **Document & Archive Processing**: `pdf-lib`, `archiver`, `sharp`
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.17+ or 20+
- npm, pnpm, or yarn

### 1. Clone & Install Dependencies

```bash
git clone <your-repository-url>
cd OmniStream
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Add your RapidAPI credentials:

```env
RAPIDAPI_KEY=your_rapidapi_key_here
PORT=3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Build & Production

```bash
npm run build
npm run start
```

---

## 📜 License & Legal Disclaimer

OmniStream is an independent utility tool designed exclusively for public, freely accessible content. Instagram is a trademark of Meta Platforms, Inc. LinkedIn is a trademark of Microsoft Corporation.
