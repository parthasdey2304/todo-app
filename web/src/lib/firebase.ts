import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if config is valid — during Vercel prerender env vars may be missing.
// Avoid throwing auth/invalid-api-key during static generation.
const isConfigValid = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.startsWith("AIza") &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig as any) : getApps()[0]!;
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.warn("[firebase] init failed, using null auth/db for prerender", e);
  }
} else {
  // During SSR prerender on Vercel without env vars, keep null to avoid crash.
  // Client will re-init when env vars are available; AuthProvider handles null.
  if (typeof window === "undefined") {
    console.warn("[firebase] config missing/invalid — skipping init during SSR. Set NEXT_PUBLIC_FIREBASE_* on Vercel.");
  } else {
    console.error("[firebase] missing env vars — check .env.local / Vercel env");
  }
}

// Export nullable; callers must handle null (AuthProvider does).
export { app, auth, db };
export const isFirebaseConfigured = isConfigValid;
