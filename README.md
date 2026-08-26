# Vastavik ToDo Ecosystem: The Ultimate Guide

Welcome to the **Vastavik ToDo** repository! This document serves as the monolithic, comprehensive, and definitive guide to understanding, building, maintaining, and scaling the Vastavik ToDo ecosystem. 

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision & Philosophy](#product-vision--philosophy)
3. [Architecture Overview](#architecture-overview)
4. [Technology Stack](#technology-stack)
5. [Directory Structure](#directory-structure)
6. [Android Native Application (`app/`)](#android-native-application)
    - [Prerequisites](#android-prerequisites)
    - [Setup & Build](#android-setup)
    - [Jetpack Compose UI Architecture](#android-ui)
    - [State Management](#android-state)
7. [Next.js Web Application (`web/`)](#nextjs-web-application)
    - [Prerequisites](#web-prerequisites)
    - [Setup & Run](#web-setup)
    - [Tailwind & Glassmorphism](#web-design)
    - [Firebase Authentication Flow](#web-auth)
    - [Firestore Real-time Sync](#web-firestore)
8. [Electron Desktop Application (`desktop/`)](#electron-desktop-application)
    - [Prerequisites](#desktop-prerequisites)
    - [Setup & Run](#desktop-setup)
    - [Next.js Integration with Electron](#desktop-nextjs)
    - [IPC Communication](#desktop-ipc)
9. [Firebase Infrastructure](#firebase-infrastructure)
    - [Project Configuration](#firebase-config)
    - [Authentication Setup (Google & Phone)](#firebase-auth-setup)
    - [Firestore Data Modeling](#firebase-data-model)
    - [Security Rules](#firebase-security)
10. [Design System & UI/UX Guidelines](#design-system)
11. [Deployment & CI/CD](#deployment)
12. [Troubleshooting & FAQ](#troubleshooting)
13. [Contribution Guidelines](#contribution)
14. [License](#license)
15. [Extensive Code References](#extensive-code-references)

---

## 1. Executive Summary <a name="executive-summary"></a>

Vastavik ToDo is not just a simple task list; it is a fully integrated, multi-platform ecosystem designed to keep users productive across every device they own. Whether a user is on their Android smartphone, at a public computer using a web browser, or working deep in their desktop environment, Vastavik ToDo provides a seamless, real-time synchronized experience.

Built utilizing cutting-edge technologies like Kotlin Jetpack Compose, Next.js 14, Electron, and Firebase, this ecosystem is designed for extreme scale, security, and aesthetic superiority.

---

## 2. Product Vision & Philosophy <a name="product-vision--philosophy"></a>

The core philosophy behind Vastavik ToDo is **"Frictionless Productivity wrapped in Premium Aesthetics."**

Users are often discouraged by clunky, slow, or ugly productivity tools. Vastavik ToDo solves this by implementing a **Glassmorphic Dark Mode** design system that feels futuristic and premium.

### Key Pillars:
- **Instant Sync:** A task checked off on the Android app reflects instantaneously on the Web dashboard.
- **Uncompromised Security:** Utilizing Google Identity Platform and Invisible reCAPTCHA, we ensure zero unauthorized access without adding friction.
- **Platform Native Feel:** The Android app feels like a true Android app (Jetpack Compose). The desktop app behaves like a native window (Electron). The web app is blazingly fast (Next.js).

---

## 3. Architecture Overview <a name="architecture-overview"></a>

Vastavik ToDo operates on a **Serverless Monorepo Architecture**.

- **Client 1:** Android App (Native Kotlin)
- **Client 2:** Next.js Web App (React Server Components / Client Components)
- **Client 3:** Electron Desktop App (Next.js statically exported into a Chromium shell)
- **Backend/BaaS:** Firebase (Auth, Firestore)

All clients communicate directly with the Firebase backend via secure, encrypted WebSockets (Firestore) and REST APIs (Auth).

---

## 4. Technology Stack <a name="technology-stack"></a>

### Mobile (Android)
- **Language:** Kotlin
- **UI Toolkit:** Jetpack Compose
- **Build System:** Gradle (KTS)
- **Min SDK:** 24

### Web (Frontend)
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + PostCSS
- **State:** React Context API

### Desktop (Wrapper)
- **Framework:** Electron.js
- **Builder:** electron-builder
- **Dev Server:** concurrently & wait-on

### Backend & Infrastructure
- **Database:** Cloud Firestore (NoSQL)
- **Authentication:** Firebase Auth (Google OAuth, Phone SMS OTP)
- **Hosting (Planned):** Vercel / Firebase Hosting

---

## 5. Directory Structure <a name="directory-structure"></a>

```text
e:\todo-app\
├── app/                    # Android Native Kotlin Application
│   ├── build.gradle.kts
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           └── java/com/vastavik/todo/MainActivity.kt
├── web/                    # Next.js Web Application
│   ├── .env.local          # Firebase Secrets
│   ├── package.json
│   └── src/
│       ├── app/
│       │   ├── page.tsx    # Auth Screen
│       │   └── dashboard/  # Protected ToDo List
│       ├── components/     # React Components
│       └── lib/            # Firebase Initialization
├── desktop/                # Electron Desktop Application
│   ├── electron/
│   │   └── main.js         # Electron Entry Point
│   ├── next.config.ts      # Static Export Config
│   └── package.json
├── gradle-8.2/             # Local Gradle Wrapper
├── build.gradle.kts        # Root Gradle Config
└── settings.gradle.kts     # Root Settings
```

---

## 6. Android Native Application (`app/`) <a name="android-native-application"></a>

The mobile application is built natively to ensure maximum performance and battery efficiency on Android devices.

### Prerequisites <a name="android-prerequisites"></a>
- Android Studio Ladybug or newer.
- Android SDK 34 (API Level 34).
- JDK 17.

### Setup & Build <a name="android-setup"></a>
1. Open the root `todo-app` folder in Android Studio.
2. Allow Gradle to sync. Ensure `android.useAndroidX=true` is present in `gradle.properties`.
3. Click **Run** or use the CLI: `./gradle-8.2/bin/gradle assembleDebug`.
4. To install via ADB manually: `adb install app/build/outputs/apk/debug/app-debug.apk`.

*(Note: If ADB reports "no devices found", ensure Developer Options and USB Debugging are enabled on your Android device, and that the device is authorized.)*

### Jetpack Compose UI Architecture <a name="android-ui"></a>
We utilize a declarative UI approach. `MainActivity.kt` hosts a `LazyColumn` for infinite scrolling of tasks. Checkboxes use `MutableState` to trigger immediate recomposition upon user interaction, eliminating the need for complex `RecyclerView` adapters.

---

## 7. Next.js Web Application (`web/`) <a name="nextjs-web-application"></a>

The web platform is designed to be accessible from any public or private computer securely.

### Prerequisites <a name="web-prerequisites"></a>
- Node.js v18+
- npm v9+

### Setup & Run <a name="web-setup"></a>
```bash
cd web
npm install
npm run dev
```
Navigate to `http://localhost:3000`.

### Tailwind & Glassmorphism <a name="web-design"></a>
We use heavily customized Tailwind utility classes to achieve a "Glassmorphism" effect. Core utilities used:
- `bg-[#151E2E]/80` (80% opacity background)
- `backdrop-blur-xl` (Intense background blur)
- `border border-[#2e3544]` (Subtle rim lighting)

### Firebase Authentication Flow <a name="web-auth"></a>
The app relies on two primary auth methods:
1. **Google OAuth**: Triggered via `signInWithPopup(auth, provider)`.
2. **Phone OTP**: Utilizes `signInWithPhoneNumber` and `RecaptchaVerifier`. The reCAPTCHA is invisible and attaches to a dedicated DOM node (`#recaptcha-container`).

### Firestore Real-time Sync <a name="web-firestore"></a>
The dashboard implements an `onSnapshot` listener attached to the `tasks` collection. Any change made (even from the Android app) will trigger the snapshot callback, updating the React state instantly.

---

## 8. Electron Desktop Application (`desktop/`) <a name="electron-desktop-application"></a>

The desktop wrapper takes the Next.js web application and packages it as a standalone executable for Windows, Mac, and Linux.

### Prerequisites <a name="desktop-prerequisites"></a>
- Node.js v18+

### Setup & Run <a name="desktop-setup"></a>
```bash
cd desktop
npm install
# Start Next.js and Electron concurrently
npm run dev:electron 
```

### Next.js Integration with Electron <a name="desktop-nextjs"></a>
Electron cannot natively run a Next.js server in production. To solve this, `next.config.ts` is configured with `output: 'export'`. This generates static HTML/JS/CSS files in the `out/` directory. `electron/main.js` is programmed to load `localhost:3000` during development, but loads `file://.../out/index.html` when packaged for production.

---

## 9. Firebase Infrastructure <a name="firebase-infrastructure"></a>

The entire backend relies on Firebase (Project ID: `lovi-clone-app-001`).

### Authentication Setup (Google & Phone) <a name="firebase-auth-setup"></a>
To prevent `auth/configuration-not-found` errors, you MUST ensure that both Google and Phone providers are enabled in the Firebase Console under `Authentication -> Sign-in method`.

### Firestore Data Modeling <a name="firebase-data-model"></a>
Collection: `tasks`
Document Structure:
```json
{
  "userId": "string (Firebase UID)",
  "text": "string (Task description)",
  "completed": "boolean",
  "createdAt": "timestamp"
}
```

### Security Rules <a name="firebase-security"></a>
*IMPORTANT: Before going to production, deploy these rules to Firestore to prevent unauthorized access:*
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      // Only allow users to read/write their own tasks
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      // Allow creation if the userId matches the authenticated user
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## 10. Design System & UI/UX Guidelines <a name="design-system"></a>

The Vastavik ToDo design system ("Obsidian Neon") is meticulously crafted to reduce eye strain while maintaining a high-performance, futuristic aesthetic.

- **Background:** `#0c1321` (Deep Space Navy)
- **Surfaces:** `#151E2E` (Slate)
- **Primary Accent:** `#494bd6` (Electric Indigo) to `#8083ff` (Radiant Violet) gradients.
- **Success/Checkmarks:** `#44e2cd` (Mint Teal)
- **Typography:** Geist / Inter for maximum legibility of tasks.

Every interactive element must have a transition (e.g., `transition-colors`, `transition-opacity`) to ensure the app feels "alive" and responsive to user input.

---

## 11. Deployment & CI/CD <a name="deployment"></a>

### Web App Deployment
1. Connect the GitHub repository to **Vercel**.
2. Set the Root Directory to `web/`.
3. Add the Firebase environment variables from `.env.local` to Vercel's Environment Variables settings.
4. Deploy.

### Android App Deployment
1. Generate a signed APK/AAB in Android Studio via `Build -> Generate Signed Bundle / APK`.
2. Upload to the Google Play Console.

### Desktop App Deployment
1. Run `npm run build` in the `desktop/` folder (requires configuring `electron-builder` in `package.json`).
2. Distribute the generated `.exe` or `.dmg` files.

---

## 12. Troubleshooting & FAQ <a name="troubleshooting"></a>

**Q: I am getting `Firebase: Error (auth/configuration-not-found).` when testing phone login!**
A: This means Phone Authentication is not enabled in your Firebase Console. Go to the console, click Authentication -> Sign-in method, and toggle "Phone" to Enabled.

**Q: `adb install` says `no devices/emulators found`.**
A: Your phone is either not plugged in, or USB debugging is disabled. Go to Settings -> Developer Options -> Enable USB Debugging. When you plug it in, accept the RSA key fingerprint prompt.

**Q: The web app dashboard redirects me back to the login screen immediately.**
A: The global `AuthProvider` didn't detect a valid session. Make sure you successfully completed the OTP or Google Sign-In flow, and that your browser isn't blocking third-party cookies (which Firebase uses for auth state).

---

## 13. Contribution Guidelines <a name="contribution"></a>

We welcome contributions! When committing code, please adhere to the following standards:
1. **Commit Messages:** Use Conventional Commits (e.g., `feat: add new button`, `fix: resolve auth crash`).
2. **TypeScript:** Always define interfaces for new data structures. Avoid `any`.
3. **Styling:** Stick strictly to the predefined Tailwind color palette. Do not introduce arbitrary hex codes into the class names unless absolutely necessary.

---

## 14. License <a name="license"></a>

This project is proprietary and confidential. Unauthorized copying of this repository, via any medium, is strictly prohibited. 
Property of Vastavik ToDo Ecosystem.

---

## 15. Extensive Code References <a name="extensive-code-references"></a>

To ensure this documentation is completely comprehensive, below are the core architectural reference implementations used in the ecosystem.

### Firebase Initialization (Web/Desktop)
```typescript
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
```

### Global Auth State Provider (React Context)
```typescript
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

*(End of Documentation)*
