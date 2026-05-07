<div align="center">

<img src="eleviq_flutter/assets/images/Square_Icon.png" alt="ElevIQ Logo" width="120" height="120" style="border-radius: 20%; margin-bottom: 16px; box-shadow: 0 4px 14px 0 rgba(0,0,0,0.1);" />

# 🧠 ElevIQ

### *GenAI-Powered Personal Finance & Expense Management Ecosystem*

**A massive, production-grade cross-platform finance assistant featuring an AI-driven Next.js 14 Web Dashboard, a high-performance Flutter Mobile App, and a unified Firebase Serverless Backend.**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev)
[![Dart](https://img.shields.io/badge/Dart-3.x-0175C2?style=for-the-badge&logo=dart&logoColor=white)](https://dart.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-GenAI-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

<br/>

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [The Ecosystem](#-the-ecosystem)
- [What Makes It Special](#-what-makes-it-special)
- [Architecture & Data Flow](#-architecture--data-flow)
- [Tech Stack](#-tech-stack)
- [Core Features](#-core-features)
- [AI Capabilities (Gemini)](#-ai-capabilities-gemini)
- [Database Security (Firestore Rules)](#-database-security-firestore-rules)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [License](#-license)

---

## ✨ Overview

**ElevIQ** is an advanced, AI-native personal finance platform designed to eliminate the friction of tracking expenses, managing budgets, and gaining financial insights. 

Instead of manual data entry, ElevIQ uses **Google Gemini's GenAI** to automatically scan receipts, categorize expenses, chat about your financial health, and offer personalized insights. It is delivered as a robust **monorepo ecosystem** consisting of a sophisticated Next.js web application and a native-feeling Flutter mobile app, all synchronised in real-time through Firebase.

---

## 🌐 The Ecosystem

ElevIQ is composed of three tightly integrated pillars:

| Component | Role | Technology |
|-----------|------|------------|
| `eleviq_web` | **Web Dashboard** — Comprehensive desktop analytics, deep insights, and complex expense management. | Next.js 16, React 19, Zustand, Tailwind 4 |
| `eleviq_flutter` | **Mobile App** — On-the-go tracking, receipt scanning, and AI chat for Android & iOS. | Flutter 3.x, Riverpod, GoRouter |
| `firebase` | **Serverless Backend** — Real-time data sync, authentication, and secure document storage. | Firestore, Firebase Auth, Firebase Storage |

> **True Cross-Platform Sync**: Add an expense on your iPhone via the Flutter app, and watch the charts on your Next.js web dashboard update instantly via Firestore real-time listeners.

---

## 🚀 What Makes It Special

### 🤖 Google Gemini AI Integration
ElevIQ isn't just a CRUD app; it's an intelligent assistant. 
- **Receipt Scanning**: Upload a photo of a receipt, and Gemini Vision extracts the amount, vendor, date, and automatically categorizes it.
- **Conversational Finance**: Ask *"How much did I spend on food this month compared to last?"* and get contextual, data-backed answers via the integrated AI Chat.

### ⚡ Real-Time Sync & Offline Support
Both the Web and Flutter applications utilize Firestore's real-time snapshot listeners. Data mutations reflect across all active sessions in milliseconds. The Flutter app natively supports offline caching, allowing you to log expenses without an internet connection.

### 🔒 Military-Grade Security
- **No Backend Servers**: 100% Serverless architecture reduces attack vectors.
- **Granular Firestore Rules**: Custom security rules guarantee that users can only read, write, or modify their own data.
- **Strict Validation**: Zod on the web and strongly-typed models in Dart ensure data integrity before it ever touches the database.

### 🎨 Beautiful, Fluid UI
- **Web**: Built with Framer Motion and Tailwind CSS 4, featuring smooth modal transitions, animated charts (Recharts), and a clean, modern aesthetic.
- **Mobile**: Custom animations, dynamic theming, and an intuitive bottom-nav architecture designed for one-handed use.

---

## 🏗 Architecture & Data Flow

ElevIQ employs a **Shared Backend / Multi-Client** architecture:

```
┌───────────────────────┐         ┌─────────────────────────┐
│     ElevIQ Web        │         │    ElevIQ Flutter       │
│    (Next.js 16)       │         │      (Mobile OS)        │
│  Zustand · Tailwind   │         │  Riverpod · GoRouter    │
└───────────────────────┘         └─────────────────────────┘
            │                                  │
            │        Real-time Streams         │
            └───────────────┬──────────────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │    Firebase Services   │
               │                        │
               │  • Auth (JWT/Session)  │
               │  • Firestore (NoSQL)   │
               │  • Storage (Receipts)  │
               └────────────┬───────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │    Google Gemini AI    │
               │  (Vision & Chat APIs)  │
               └────────────────────────┘
```

---

## 🛠 Tech Stack

### Web Dashboard (`eleviq_web`)
- **Framework**: Next.js 16 (App Router), React 19
- **State Management**: Zustand (Auth & Expense Stores)
- **Styling & UI**: Tailwind CSS 4, Framer Motion, Lucide Icons
- **Forms & Validation**: React Hook Form, Zod
- **Data Visualization**: Recharts
- **PDF/Export**: jspdf, pdf-parse

### Mobile App (`eleviq_flutter`)
- **Framework**: Flutter 3.x
- **State Management**: Riverpod (`flutter_riverpod`, `riverpod_annotation`)
- **Navigation**: GoRouter
- **Local Storage**: Shared Preferences
- **Charting**: FL Chart
- **Camera/Images**: Image Picker, Image Cropper

### Backend & AI
- **Database**: Cloud Firestore (Real-time NoSQL)
- **Auth**: Firebase Authentication (Email/Password, Google OAuth)
- **Storage**: Firebase Cloud Storage
- **AI Engine**: Google Generative AI (`@google/genai`, `google_generative_ai` for Dart)

---

## 🎯 Core Features

### 📊 Dashboard & Analytics
- Multi-dimensional charts visualizing spending trends.
- Category breakdowns and monthly summaries.
- Real-time aggregation of expenses.

### 💸 Expense Management
- Fast, intuitive manual entry.
- Sub-itemization (add multiple items per receipt).
- Recurring expense tracking.
- Receipt image uploads.

### 🤖 AI Finance Assistant (Chat)
- Context-aware chat interface.
- Ask questions about your spending habits.
- AI analyzes your Firestore data to provide tailored advice.

### 🛠 Powerful Utilities
- **Receipt Scanner**: Auto-fill expenses from images.
- **Bill Reminders**: Never miss a due date.
- **Goal Tracking**: Set and monitor saving targets.
- **Split Bills**: Calculate shared expenses with friends.
- **Export**: Generate PDF or CSV reports for tax season.

---

## 🔐 Database Security (Firestore Rules)

ElevIQ utilizes strict Firebase Security Rules to ensure absolute data privacy. Users cannot access each other's financial data under any circumstances.

```javascript
match /expenses/{expenseId} {
  // Read: Only if authenticated and you own the document
  allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;

  // Create: Must be authenticated, set yourself as owner, and pass schema validation
  allow create: if isAuthenticated()
    && request.resource.data.userId == request.auth.uid
    && isValidExpense();

  // Update: Must be owner before AND after update
  allow update: if isAuthenticated()
    && resource.data.userId == request.auth.uid
    && request.resource.data.userId == request.auth.uid;

  // Delete: Only the owner
  allow delete: if isAuthenticated()
    && resource.data.userId == request.auth.uid;
}
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js ≥ 18.x
- Flutter SDK ≥ 3.3.0
- Firebase Project configured for Web, Android, and iOS.

### 1. Clone the Repository
```bash
git clone https://github.com/SiddhuSaai/ElevIQ.git
cd ElevIQ
```

### 2. Setup Firebase
1. Create a Firebase project.
2. Enable Authentication (Email/Password & Google).
3. Enable Firestore Database.
4. Apply the security rules from `firebase/firestore.rules`.
5. Get your Web SDK config and `google-services.json` / `GoogleService-Info.plist`.

### 3. Run the Web Dashboard
```bash
cd eleviq_web
npm install

# Create .env.local
cp .env.example .env.local
# Add your Firebase Web config and Google Gemini API Key

npm run dev
# Open http://localhost:3000
```

### 4. Run the Flutter Mobile App
```bash
cd eleviq_flutter
flutter pub get

# Setup environment variables (or hardcode config for dev)
# Ensure connected device or emulator is running

flutter run
```

---

## 📂 Project Structure

```text
ElevIQ/
├── eleviq_web/                  → Next.js 16 Web Dashboard
│   ├── src/app/                 → App Router pages & layouts
│   ├── src/components/          → Reusable React UI (Framer Motion, Tailwind)
│   ├── src/store/               → Zustand state (Auth, Expenses, Sidebar)
│   ├── src/lib/                 → Firebase initialization & Gemini API clients
│   └── src/types/               → Zod schemas & TypeScript definitions
│
├── eleviq_flutter/              → Flutter Mobile Application
│   ├── lib/features/            → Feature-first architecture (auth, expenses, chat)
│   │   ├── auth/                → Login, registration, Google OAuth
│   │   ├── dashboard/           → Analytics & charts (FL Chart)
│   │   ├── expenses/            → Expense CRUD & Receipt Scanner
│   │   └── ai_chat/             → Gemini-powered conversational UI
│   ├── lib/core/                → Themes, utilities, constants
│   ├── lib/shared/              → Common widgets & models
│   └── lib/routes/              → GoRouter configuration
│
└── firebase/                    → Backend Configuration
    ├── firestore.rules          → Strict Row-Level Security equivalents
    └── firebase.json            → Hosting & deployment rules
```

---

## 🌍 Deployment

### Web Dashboard (Vercel)
The web app is optimized for Vercel deployment.
1. Connect your GitHub repository to Vercel.
2. Set the Root Directory to `eleviq_web`.
3. Add the required Environment Variables (Firebase config & Gemini Key).
4. Deploy!

### Mobile App (Stores)
1. Run `flutter build apk --release` for Android.
2. Run `flutter build ipa` for iOS (requires macOS and Xcode).

---

## 📜 License

**Private** — All rights reserved. © 2026 ElevIQ / Saai Sidd.

---

<div align="center">
  <strong>Elevate your Financial IQ</strong><br>
  <em>Built with Next.js · Flutter · Firebase · Google Gemini</em>
</div>
