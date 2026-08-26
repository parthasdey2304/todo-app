# Vastavik ToDo Ecosystem: The Ultimate Engineering Guide

Welcome to the **Vastavik ToDo** repository! This document serves as the monolithic, comprehensive, and definitive guide to understanding, building, maintaining, and scaling the Vastavik ToDo ecosystem. This repository houses three distinct but synchronized platforms: Native Android (Jetpack Compose), Web (Next.js), and Desktop (Electron).

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Philosophy](#2-product-vision--philosophy)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Technology Stack](#4-technology-stack)
5. [Directory Structure](#5-directory-structure)
6. [Android Native Application (`app/`)](#6-android-native-application)
    - [Prerequisites & Environment Setup](#android-prerequisites)
    - [Jetpack Compose UI Architecture](#android-ui)
    - [Voice Input Integration (SpeechRecognizer)](#android-voice)
    - [State Management & Flow](#android-state)
7. [Next.js Web Application (`web/`)](#7-nextjs-web-application)
    - [Prerequisites & Initialization](#web-prerequisites)
    - [Tailwind, Glassmorphism, & Obsidian Neon](#web-design)
    - [Firebase Authentication Flow](#web-auth)
    - [Firestore Real-time Sync & Pagination](#web-firestore)
    - [Web Speech API Integration](#web-voice)
8. [Electron Desktop Application (`desktop/`)](#8-electron-desktop-application)
    - [Next.js Static Export Integration](#desktop-nextjs)
    - [IPC Communication bridging](#desktop-ipc)
9. [Firebase Infrastructure](#9-firebase-infrastructure)
    - [Project Configuration](#firebase-config)
    - [Authentication Setup (Google & Phone)](#firebase-auth-setup)
    - [Firestore Data Modeling](#firebase-data-model)
    - [Strict Security Rules](#firebase-security)
10. [Design System & UI/UX Guidelines (Stitch)](#10-design-system)
11. [Deployment & CI/CD](#11-deployment)
12. [Troubleshooting & FAQ](#12-troubleshooting)
13. [Contribution Guidelines](#13-contribution)
14. [License](#14-license)

---

## 1. Executive Summary <a name="1-executive-summary"></a>

Vastavik ToDo is not just a simple task list; it is a fully integrated, multi-platform ecosystem designed to keep users productive across every device they own. Whether a user is on their Android smartphone, at a public computer using a web browser, or working deep in their desktop environment, Vastavik ToDo provides a seamless, real-time synchronized experience.

This ecosystem relies heavily on Firebase as its backend-as-a-service (BaaS), utilizing Firestore for real-time document synchronization, Firebase Authentication for secure identity management, and Firebase Storage for handling heavy task attachments (images, PDFs, audio notes).

---

## 2. Product Vision & Philosophy <a name="2-product-vision--philosophy"></a>

The core design philosophy is "Obsidian Neon"—a dark, premium, charcoal slate environment accented by striking Electric Indigo (`#494bd6`) interactions.

- **Speed to Capture:** Users should be able to create tasks instantly. This is why we integrated Native Voice Dictation (Android) and the Web Speech API (Next.js). Users simply click the microphone and speak their tasks into existence.
- **Hierarchical Clarity:** Using subtle glassmorphism and exact spacing, tasks have a clear visual hierarchy. Priorities (P1-P4) are instantly recognizable via colored pills.
- **Zero Friction:** Brand new users receive an automated "Welcome Onboarding" state that instantly seeds their database with 3 tutorial tasks to teach them the UI without a massive onboarding carousel.

---

## 3. System Architecture Overview <a name="3-system-architecture-overview"></a>

The repository is structured as a standard Monorepo.

```
/
├── app/          # Native Android Application (Kotlin, Jetpack Compose)
├── web/          # Next.js 14+ Web Application (React, TypeScript, Tailwind)
├── desktop/      # Electron Desktop Wrapper (Loads Next.js export)
├── build.gradle  # Root Android build configuration
└── package.json  # Root Node configuration
```

Because of the varying build systems (Gradle vs. npm), the directories operate independently but share the exact same Firestore backend and data schema.

---

## 4. Technology Stack <a name="4-technology-stack"></a>

### Mobile (Android)
- **Language:** Kotlin 1.9.x
- **UI Toolkit:** Jetpack Compose (Material 3)
- **Navigation:** Navigation Compose
- **Backend SDK:** `firebase-firestore-ktx`, `firebase-auth-ktx`
- **Asynchrony:** Kotlin Coroutines & Flows

### Web
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + `clsx` + `tailwind-merge`
- **Icons:** `lucide-react`
- **Date Manipulation:** `date-fns`

### Desktop
- **Framework:** Electron.js
- **Renderer:** Next.js (Static HTML Export `output: 'export'`)

---

## 5. Firebase Infrastructure & Data Models <a name="9-firebase-infrastructure"></a>

The central nervous system of Vastavik ToDo is Cloud Firestore.

### Task Data Model (`tasks` collection)
Every task document contains highly detailed metadata to support advanced filtering, recurring logic, and deadline management.

```typescript
interface Task {
  id: string; // Auto-generated Document ID
  userId: string; // The UID of the authenticated user
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  scheduledDate?: string; // YYYY-MM-DD format for fast querying
  dueAt?: string; // ISO string for exact deadlines
  reminderAt?: string; // ISO string for push notifications
  recurrence?: 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';
  categoryId?: string;
  categoryName?: string;
  labels: string[]; // e.g. ["urgent", "home"]
  priority: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  attachments: Attachment[];
  order: number; // For drag-and-drop sorting
  createdAt: timestamp;
  updatedAt: timestamp;
  completedAt?: timestamp;
}
```

### Security Rules (Firestore)
Before pushing to production, the default Test Mode rules must be replaced.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      // Users can only read/write their own tasks
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## 6. Android Native Application (`app/`) <a name="6-android-native-application"></a>

The Android app provides the fastest, most native experience possible using modern Android development standards.

### Jetpack Compose UI Architecture
Instead of using XML layouts, the entire UI is written in declarative Kotlin using Jetpack Compose.
- `MainActivity.kt` hosts the `NavHost` and the `Scaffold`.
- The `BottomNavigationBar` handles routing between `Inbox`, `Today`, and `Settings`.
- A massive technical achievement here is the **Weekly Date Selector**, implemented via `LazyRow` combined with `java.util.Calendar` to precisely match the web's horizontal date scrolling.

### Voice Input Integration (SpeechRecognizer)
Instead of relying on clunky keyboards, users can dictate tasks.
```kotlin
val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
}
speechRecognizerLauncher.launch(intent)
```
The result is instantly stored in `voiceInputResult` and injected into the task creation UI.

### Build Instructions
1. Open the `todo-app` folder in Android Studio.
2. Wait for Gradle Sync to complete.
3. Ensure you have `google-services.json` inside the `app/` directory (created via Firebase Console).
4. Hit **Run (Shift + F10)**.

---

## 7. Next.js Web Application (`web/`) <a name="7-nextjs-web-application"></a>

### File-Based Routing (App Router)
- `/`: Landing page and Authentication UI.
- `/dashboard`: The "Today" view featuring the `WeeklyDateSelector`.
- `/dashboard/inbox`: Tasks without a scheduled date.
- `/dashboard/upcoming`: Tasks scheduled for future dates.
- `/dashboard/projects`: High-level folder views.
- `/dashboard/settings`: Dark mode toggles and account management.

### Web Speech API Integration
We bypass third-party dependencies by utilizing the native `window.SpeechRecognition` API. When the user clicks the microphone, the browser requests audio permissions, listens to the stream, and performs continuous transcription directly into the task input bar.

### Build Instructions
```bash
cd web
npm install
npm run dev
```

---

## 8. Deployment & CI/CD <a name="11-deployment"></a>

### Web App Deployment (Vercel)
The web application is fully optimized for Vercel. 
1. Connect the GitHub repository to Vercel.
2. Set the Root Directory to `web/`.
3. Add the Firebase API keys to Vercel Environment Variables.
4. Deploy!

### Android Deployment (Google Play)
1. Run `./gradlew bundleRelease` in the root directory.
2. Sign the `.aab` (Android App Bundle) with your keystore.
3. Upload to the Google Play Console.

---

## 9. Design System & UI/UX Guidelines (Stitch) <a name="10-design-system"></a>

The UI for this application was meticulously generated and prototyped using the **Stitch MCP**. 
- **Primary Background:** `#0C1321` (Deep Space Charcoal)
- **Surface Color:** `#151E2E` (Slate)
- **Primary Accent:** `#494BD6` (Electric Indigo)
- **Text Primary:** `#DCE2F6`
- **Text Secondary:** `#98A6BD`
- **Border Radius:** `rounded-xl` (12dp) to `rounded-2xl` (16dp).
- **Elevation:** We avoid heavy shadows in dark mode, opting instead for precise 1px borders (`#2e3544`) to separate z-indexes.

---

*End of Vastavik ToDo Documentation.*
