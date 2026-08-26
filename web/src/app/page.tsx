"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

const COUNTRIES = [
  { code: "+1", name: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "+1", name: "Canada", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "+44", name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "+91", name: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "+971", name: "UAE", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "+966", name: "Saudi Arabia", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "+61", name: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "+49", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "+33", name: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "+81", name: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "+86", name: "China", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "+55", name: "Brazil", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "+27", name: "South Africa", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "+92", name: "Pakistan", flag: "\u{1F1F5}\u{1F1F0}" },
  { code: "+880", name: "Bangladesh", flag: "\u{1F1E7}\u{1F1E9}" },
  { code: "+94", name: "Sri Lanka", flag: "\u{1F1F1}\u{1F1F0}" },
  { code: "+977", name: "Nepal", flag: "\u{1F1F3}\u{1F1F5}" },
  { code: "+65", name: "Singapore", flag: "\u{1F1F8}\u{1F1EC}" },
  { code: "+60", name: "Malaysia", flag: "\u{1F1F2}\u{1F1FE}" },
  { code: "+62", name: "Indonesia", flag: "\u{1F1EE}\u{1F1E9}" },
];

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[3]);
  const [localNumber, setLocalNumber] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [authError, setAuthError] = useState("");

  const phoneNumber = `${selectedCountry.code}${localNumber}`;
  const filteredCountries = COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch)
  );

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
  };

  const handlePhoneSignIn = async () => {
    const cleaned = localNumber.replace(/\s/g, "");
    if (!/^\d{6,15}$/.test(cleaned)) {
      setAuthError("Enter a valid phone number (6\u201315 digits).");
      return;
    }
    try {
      setAuthError("");
      setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
    } catch (error: any) {
      console.error("Phone sign-in error:", error);
      let msg = error?.message || "Failed to send SMS.";
      if (msg.includes("operation-not-allowed")) {
        msg = `Phone sign-in is not enabled for ${selectedCountry.name}. Go to Firebase Console \u2192 Authentication \u2192 Sign-in method \u2192 enable Phone, and ensure SMS is enabled for this region under Project Settings \u2192 Phone verification.`;
      } else if (msg.includes("invalid-app-credential")) {
        msg = "reCAPTCHA verification failed. Ensure Phone sign-in is enabled in Firebase Console.";
      } else if (msg.includes("too-many-requests")) {
        msg = "Too many requests. Wait a few minutes before trying again.";
      }
      setAuthError(msg);
      window.recaptchaVerifier = null;
    }
  };

  const handleVerifyOtp = async () => {
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
      }
    } catch (error: any) {
      console.error("OTP verify error:", error);
      setAuthError("Invalid OTP. Try again.");
      setConfirmationResult(null);
      setOtp("");
    }
  };

  if (loading || user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c1321] p-4 pb-24 text-[#dce2f6]">
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
                <div className="flex gap-2">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => { setShowCountryDropdown(!showCountryDropdown); setCountrySearch(""); }}
                      className="flex items-center gap-1.5 rounded-lg bg-[#0c1321] border border-[#2e3544] p-3 text-white hover:border-[#494bd6] transition-colors h-[46px]"
                    >
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="text-sm font-medium">{selectedCountry.code}</span>
                      <svg className={`w-3 h-3 text-[#98A6BD] transition-transform ${showCountryDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute z-50 mt-1 w-64 max-h-60 overflow-y-auto rounded-lg bg-[#1a2336] border border-[#2e3544] shadow-xl">
                        <div className="sticky top-0 p-2 bg-[#1a2336]">
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full rounded-md bg-[#0c1321] border border-[#2e3544] px-3 py-1.5 text-sm text-white focus:border-[#494bd6] focus:outline-none"
                            autoFocus
                          />
                        </div>
                        {filteredCountries.map((c, i) => (
                          <button
                            key={`${c.code}-${c.name}-${i}`}
                            type="button"
                            onClick={() => { setSelectedCountry(c); setShowCountryDropdown(false); setCountrySearch(""); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#2e3544] transition-colors ${selectedCountry.name === c.name ? "bg-[#494bd6]/20 text-[#c0c1ff]" : "text-white"}`}
                          >
                            <span className="text-lg">{c.flag}</span>
                            <span className="flex-1 text-left">{c.name}</span>
                            <span className="text-[#98A6BD]">{c.code}</span>
                          </button>
                        ))}
                        {filteredCountries.length === 0 && (
                          <div className="px-3 py-2 text-sm text-[#98A6BD]">No countries found</div>
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={localNumber}
                    onChange={(e) => setLocalNumber(e.target.value.replace(/[^\d]/g, ""))}
                    className="flex-1 rounded-lg bg-[#0c1321] border border-[#2e3544] p-3 text-white focus:border-[#494bd6] focus:outline-none focus:ring-1 focus:ring-[#494bd6] transition-colors min-w-0"
                  />
                </div>
                <p className="mt-1.5 text-xs text-[#98A6BD]">Preview: {phoneNumber}</p>
                <button
                  onClick={handlePhoneSignIn}
                  disabled={!localNumber}
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
              <p className="text-xs text-[#98A6BD] mb-3">Sent to {phoneNumber}</p>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ""))}
                className="w-full rounded-lg bg-[#0c1321] border border-[#2e3544] p-3 text-white focus:border-[#494bd6] focus:outline-none focus:ring-1 focus:ring-[#494bd6] transition-colors text-center tracking-widest text-lg"
              />
              <button
                onClick={handleVerifyOtp}
                disabled={!otp}
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#494bd6] to-[#8083ff] p-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Verify & Sign In
              </button>
              <button
                onClick={() => { setConfirmationResult(null); setOtp(""); setAuthError(""); }}
                className="mt-2 w-full text-sm text-[#98A6BD] hover:text-[#c0c1ff] transition-colors py-1"
              >
                Change phone number
              </button>
            </div>
          )}
        </div>
      </div>
      <div id="recaptcha-container" className="fixed bottom-0 right-0" />
    </div>
  );
}
