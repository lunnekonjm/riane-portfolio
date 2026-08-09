# ✨ Ryan's Portfolio — Interactive Developer Showcase & Gemini AI Engine

[![Live Website](https://img.shields.io/badge/Live%20Website-riane--portfolio--one.vercel.app-0070F3?style=for-the-badge&logo=vercel&logoColor=white)](https://riane-portfolio-one.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-v16.2.12-black?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-v19.2.4-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Google Gemini AI](https://img.shields.io/badge/Google%20Gemini-AI%20Engine-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

> **Ryan's Portfolio** is a modern, high-performance developer portfolio built with **Next.js 16 (App Router)**, **React 19**, and **TypeScript**. It features an integrated **Google Gemini AI Assistant** that answers questions about skills, projects, and architecture in real time, backed by **Firebase** Cloud Infrastructure.

🌐 **Live Demo Website**: [https://riane-portfolio-one.vercel.app](https://riane-portfolio-one.vercel.app)

---

## 🌟 Key Features

### 🤖 Google Gemini AI Chat Assistant
- Embedded AI subagent (`@google/generative-ai`) trained on developer knowledge, project details, and technical expertise.
- Context-aware responses with markdown formatting and real-time streaming capability.

### 💼 Interactive Project Showcase & Experience Timeline
- Detailed project breakdown with live demo links, GitHub repositories, and tech stack tags.
- Responsive grid and card views optimized for desktop, tablet, and mobile displays.

### 🔥 Firebase Cloud Infrastructure
- Integration with **Firebase Firestore** for dynamic content updates and analytical telemetry.
- Secure client-side rules and environment variable isolation.

### 🎨 Modern Aesthetic & Glassmorphism Design
- Custom typography using Vercel Geist Font family.
- Dark mode primary design with smooth micro-animations and micro-interactions.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org) |
| **UI Library** | [React 19](https://react.dev) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org) |
| **AI Integration** | [@google/generative-ai](https://ai.google.dev) (Gemini API) |
| **Backend / Database** | [Firebase Firestore](https://firebase.google.com) |
| **Styling & Fonts** | Tailwind CSS / CSS Modules & Geist Font |
| **Deployment** | [Vercel Platform](https://vercel.com) |

```
src/
├── app/          # Next.js App Router pages and API routes
├── components/   # UI components (AI Chat Drawer, Project Cards, Navigation)
├── data/         # Project metadata and AI knowledge base schemas
├── engines/      # Gemini AI prompt processing engine
├── hooks/        # Custom React hooks
├── services/     # Firebase SDK and Gemini API wrappers
└── types/        # TypeScript type definitions
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `^20.0.0` or higher
- **npm** / **yarn** / **pnpm**

### Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/fnnktkygl-coderesume/riane-portfolio.git
   cd riane-portfolio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🌐 Live Web Deployment

The portfolio is deployed live on Vercel with automatic GitHub workflow deployments.

- **Primary Web URL**: [https://riane-portfolio-one.vercel.app](https://riane-portfolio-one.vercel.app)

---

## 📜 License

© 2026 Ryan. All rights reserved.
