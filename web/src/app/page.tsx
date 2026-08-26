"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const handlePhoneSignIn = async () => {
    try {
      setAuthError("");
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
    } catch (error: any) {
      setAuthError("Failed to send SMS. Ensure number has country code (e.g., +1).");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
      }
    } catch (error: any) {
      setAuthError("Invalid OTP. Try again.");
    }
  };

  if (loading || user) return null; // Avoid flashing content before redirect

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c1321] p-4 text-[#dce2f6]">
      <div className="w-full max-w-md rounded-2xl bg-[#151E2E]/80 p-8 shadow-2xl backdrop-blur-xl border border-[#2e3544]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#c0c1ff]">Vastavik ToDo</h1>
          <p className="mt-2 text-sm text-[#98A6BD]">Sign in to sync your tasks everywhere.</p>
        </div>

        {authError && (
          <div className="mb-6 rounded-lg bg-[#93000a]/20 p-3 text-sm text-[#ffb4ab] border border-[#93000a]">
            {authError}
          </div>
        )}

        <div className="space-y-6">
          {!confirmationResult ? (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#dce2f6]">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-lg bg-[#0c1321] border border-[#2e3544] p-3 text-white focus:border-[#494bd6] focus:outline-none focus:ring-1 focus:ring-[#494bd6] transition-colors"
                />
                <button
                  onClick={handlePhoneSignIn}
                  disabled={!phoneNumber}
                  className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#494bd6] to-[#8083ff] p-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Send OTP
                </button>
              </div>

              <div className="relative flex items-center justify-center py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2e3544]"></div>
                </div>
                <div className="relative bg-[#151E2E] px-4 text-sm text-[#98A6BD]">or</div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="w-full rounded-lg border border-[#2e3544] bg-[#0c1321] p-3 font-semibold hover:bg-[#19202e] transition-colors flex justify-center items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </>
          ) : (
            <div>
              <label className="block text-sm font-semibold mb-2 text-[#dce2f6]">Enter OTP</label>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-lg bg-[#0c1321] border border-[#2e3544] p-3 text-white focus:border-[#494bd6] focus:outline-none focus:ring-1 focus:ring-[#494bd6] transition-colors text-center tracking-widest text-lg"
              />
              <button
                onClick={handleVerifyOtp}
                disabled={!otp}
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#494bd6] to-[#8083ff] p-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Verify & Sign In
              </button>
            </div>
          )}
        </div>
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
