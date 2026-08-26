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
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+86", name: "China", flag: "🇨🇳" },
  { code: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "+94", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "+977", name: "Nepal", flag: "🇳🇵" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "+62", name: "Indonesia", flag: "🇮🇩" },
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
    if (!loading && user) router.push("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowCountryDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGoogleSignIn = async () => {
    if (!auth) { setAuthError("Firebase not configured — check Vercel env"); return; }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) { setAuthError(error.message); }
  };

  const setupRecaptcha = () => {
    if (!auth) { setAuthError("Firebase not configured"); return; }
    if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
  };

  const handlePhoneSignIn = async () => {
    if (!auth) { setAuthError("Firebase not configured"); return; }
    const cleaned = localNumber.replace(/\s/g, "");
    if (!/^\d{6,15}$/.test(cleaned)) { setAuthError("Enter a valid phone number (6–15 digits)."); return; }
    try {
      setAuthError("");
      setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
    } catch (error: any) {
      let msg = error?.message || "Failed to send SMS.";
      if (msg.includes("operation-not-allowed")) msg = `Phone sign-in not enabled for ${selectedCountry.name}. Enable in Firebase Console.`;
      else if (msg.includes("invalid-app-credential")) msg = "reCAPTCHA failed. Enable Phone sign-in in Firebase Console.";
      else if (msg.includes("too-many-requests")) msg = "Too many requests. Wait a few minutes.";
      setAuthError(msg);
      window.recaptchaVerifier = null;
    }
  };

  const handleVerifyOtp = async () => {
    try { if (confirmationResult) await confirmationResult.confirm(otp); }
    catch (error: any) { setAuthError("Invalid OTP. Try again."); setConfirmationResult(null); setOtp(""); }
  };

  if (loading || user) return null;

  return (
    <div className="min-h-screen bg-[#FFE600] text-black selection:bg-black selection:text-[#FFE600] overflow-x-hidden relative">
      {/* HASH BG */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 12px)` }} />

      {/* TOP MARQUEE */}
      <div className="relative z-20 bg-black text-[#FFE600] border-y-[4px] border-black overflow-hidden py-2">
        <div className="flex animate-brutal-marquee whitespace-nowrap text-sm font-black tracking-[0.2em] uppercase gap-8" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <span>VASTAVIK TODO — BRUTAL TASK MACHINE — ZERO RADIUS — THICK BORDERS — MANGA TYPE — FUNK FOREVER —</span>
          <span>VASTAVIK TODO — BRUTAL TASK MACHINE — ZERO RADIUS — THICK BORDERS — MANGA TYPE — FUNK FOREVER —</span>
          <span>VASTAVIK TODO — BRUTAL TASK MACHINE — ZERO RADIUS — THICK BORDERS — MANGA TYPE — FUNK FOREVER —</span>
        </div>
      </div>

      {/* HEADER */}
      <header className="relative z-20 max-w-[1400px] mx-auto px-3 sm:px-6 mt-3">
        <div className="bg-white border-[4px] border-black flex items-center justify-between px-4 py-3 shadow-[8px_8px_0px_0px_#000]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-black border-[3px] border-black grid place-items-center text-[#FFE600] font-black text-2xl rotate-[-2deg] shadow-[3px_3px_0px_0px_#000]">V</div>
            <div className="leading-none">
              <div className="font-black text-[22px] sm:text-[26px] tracking-tighter uppercase flex items-baseline gap-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                VASTAVIK<span className="bg-[#FFE600] border-[3px] border-black px-1 shadow-[2px_2px_0px_0px_#000] rotate-[1deg]">TODO</span>
              </div>
              <div className="text-[11px] font-mono font-black tracking-[0.16em] uppercase opacity-60">BRUTAL • FUNKY • MANGA</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="bg-[#FF3B30] text-white border-[3px] border-black px-3 py-1 font-black text-xs tracking-widest shadow-[3px_3px_0px_0px_#000] animate-jitter">● SYSTEM ONLINE</span>
            <span className="bg-black text-white px-3 py-2 font-mono text-xs font-black tracking-widest border-[2px] border-black">2026 // FUNK</span>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-6 pb-10 mt-4 grid grid-cols-12 gap-4">
        {/* LEFT HERO */}
        <div className="col-span-12 lg:col-span-7 bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-5 sm:p-8 relative overflow-hidden animate-slam">
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10" style={{ backgroundImage: `repeating-linear-gradient(45deg, #000 0 2px, transparent 2px 8px)` }} />
          <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 font-mono text-[11px] font-black tracking-[0.2em] uppercase border-[2px] border-black">
            <span className="h-2 w-2 bg-[#FFE600] animate-pulse" /> AUTH GATE — STEP INSIDE
          </div>
          <h1 className="mt-4 font-black leading-[0.85] tracking-tighter uppercase" style={{ fontFamily: 'Syne, sans-serif' }}>
            <span className="block text-[34px] sm:text-[48px] md:text-[58px]">GET</span>
            <span className="block text-[36px] sm:text-[52px] md:text-[64px] bg-[#22D3EE] border-[4px] border-black px-2 inline-block shadow-[6px_6px_0px_0px_#000] -rotate-[1deg]">SH*T</span>
            <span className="block text-[36px] sm:text-[52px] md:text-[64px] bg-[#FFE600] border-[4px] border-black px-2 inline-block shadow-[6px_6px_0px_0px_#000] rotate-[0.6deg] mt-1">DONE.</span>
            <span className="block text-[18px] sm:text-[22px] mt-3 bg-black text-white inline-block px-3 py-1 tracking-widest">BRUTAL TODO MACHINE</span>
          </h1>
          <p className="mt-5 font-mono text-xs sm:text-sm font-bold leading-relaxed border-l-[4px] border-black pl-3 bg-[#FFE600]/30 py-2">
            Zero radius. Thick borders. Manga shouts. Every task is a<br className="hidden sm:block"/> concrete slab. No soft UI. Only funk.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#FFE600] border-[3px] border-black p-2 shadow-[3px_3px_0px_0px_#000]"><div className="font-black text-lg leading-none">0%</div><div className="font-mono text-[9px] font-black tracking-widest">SOFT</div></div>
            <div className="bg-black text-[#FFE600] border-[3px] border-black p-2 shadow-[3px_3px_0px_0px_#000]"><div className="font-black text-lg leading-none">100%</div><div className="font-mono text-[9px] font-black tracking-widest">BRUTAL</div></div>
            <div className="bg-[#A78BFA] border-[3px] border-black p-2 shadow-[3px_3px_0px_0px_#000]"><div className="font-black text-lg leading-none">∞</div><div className="font-mono text-[9px] font-black tracking-widest">FUNK</div></div>
          </div>
          <div className="mt-4 h-3 border-[3px] border-black bg-white relative overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(90deg, #000 0 3px, transparent 3px 10px)` }} />
          </div>
        </div>

        {/* RIGHT — AUTH CARD */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-4 sm:p-6 animate-stamp relative overflow-hidden">
            {/* tape */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-black text-[#FFE600] text-[8px] font-black tracking-[0.3em] px-3 py-0.5 border border-white rotate-[1deg] z-10">VASTAVIK ★ VASTAVIK</div>
            <div className="flex items-center justify-between bg-black text-white px-3 py-2 font-mono text-[11px] font-black tracking-widest border-[3px] border-black mt-2">
              <span>▓ SIGN IN — TERMINAL 01</span>
              <span className="bg-[#FFE600] text-black px-2 py-0.5 border border-white">● READY</span>
            </div>

            <div className="mt-4 text-center">
              <h2 className="font-black text-[26px] tracking-tighter uppercase" style={{ fontFamily: 'Syne, sans-serif' }}>ENTER THE<span className="bg-[#FFE600] border-[3px] border-black px-1 ml-1 inline-block rotate-[-0.8deg] shadow-[3px_3px_0px_0px_#000]">VOID</span></h2>
              <p className="mt-1 font-mono text-xs font-bold tracking-widest uppercase opacity-60">SIGN IN TO SYNC YOUR CHAOS</p>
            </div>

            {authError && (
              <div className="mt-4 bg-[#FF3B30] text-white border-[4px] border-black p-3 font-black text-sm shadow-[4px_4px_0px_0px_#000] animate-shake">
                ⚠ {authError}
              </div>
            )}

            <div className="mt-5 space-y-5">
              {!confirmationResult ? (
                <>
                  <div>
                    <label className="block font-black text-xs tracking-[0.16em] uppercase mb-2 bg-black text-[#FFE600] inline-block px-2 py-1 border-[2px] border-black">Phone Number //</label>
                    <div className="flex gap-2">
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => { setShowCountryDropdown(!showCountryDropdown); setCountrySearch(""); }}
                          className="flex items-center gap-1.5 bg-white border-[4px] border-black p-3 font-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFE600] transition-colors h-[54px]"
                        >
                          <span className="text-lg">{selectedCountry.flag}</span>
                          <span className="text-sm">{selectedCountry.code}</span>
                          <svg className={`w-3 h-3 transition-transform ${showCountryDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {showCountryDropdown && (
                          <div className="absolute z-50 mt-1 w-64 max-h-60 overflow-y-auto bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000]">
                            <div className="sticky top-0 p-2 bg-[#FFE600] border-b-[3px] border-black">
                              <input type="text" placeholder="SEARCH COUNTRY..." value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} className="w-full bg-white border-[3px] border-black px-3 py-2 text-sm font-black uppercase focus:outline-none" autoFocus />
                            </div>
                            {filteredCountries.map((c, i) => (
                              <button key={`${c.code}-${c.name}-${i}`} type="button" onClick={() => { setSelectedCountry(c); setShowCountryDropdown(false); setCountrySearch(""); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-black border-b border-black/10 hover:bg-[#FFE600] ${selectedCountry.name === c.name ? "bg-black text-[#FFE600]" : "bg-white text-black"}`}>
                                <span>{c.flag}</span><span className="flex-1 text-left uppercase text-xs">{c.name}</span><span>{c.code}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input type="tel" placeholder="PHONE NUMBER" value={localNumber} onChange={(e) => setLocalNumber(e.target.value.replace(/[^\d]/g, ""))} className="flex-1 bg-white border-[4px] border-black p-3 font-black text-lg tracking-widest placeholder:text-black/30 focus:bg-[#FFE600] focus:outline-none shadow-[4px_4px_0px_0px_#000] min-w-0 uppercase" />
                    </div>
                    <p className="mt-2 font-mono text-[11px] font-black bg-black text-[#FFE600] inline-block px-2 py-1">PREVIEW: {phoneNumber || "—"}</p>
                    <button onClick={handlePhoneSignIn} disabled={!localNumber} className="mt-3 w-full bg-[#FFE600] border-[4px] border-black p-3 font-black text-sm tracking-[0.14em] uppercase shadow-[5px_5px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                      <span className="bg-black text-white px-2 py-0.5 text-xs">▶</span> SEND OTP — BLAST IT
                    </button>
                  </div>

                  <div className="flex items-center gap-2 py-2">
                    <div className="h-[4px] flex-1 bg-black" /><div className="bg-black text-[#FFE600] px-3 py-1 font-mono text-xs font-black tracking-widest border-[2px] border-black">OR</div><div className="h-[4px] flex-1 bg-black" />
                  </div>

                  <button onClick={handleGoogleSignIn} className="w-full bg-white border-[4px] border-black p-3 font-black uppercase tracking-widest shadow-[5px_5px_0px_0px_#000] hover:bg-black hover:text-white flex justify-center items-center gap-3 hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    SIGN IN WITH GOOGLE
                  </button>
                </>
              ) : (
                <div className="animate-pop">
                  <label className="block font-black text-xs tracking-[0.16em] uppercase mb-2 bg-[#22D3EE] border-[3px] border-black px-2 py-1 inline-block shadow-[3px_3px_0px_0px_#000]">ENTER OTP // SENT TO {phoneNumber}</label>
                  <input type="text" placeholder="● ● ● ● ● ●" value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ""))} className="w-full bg-white border-[4px] border-black p-4 text-center tracking-[0.4em] text-2xl font-black focus:bg-[#FFE600] focus:outline-none shadow-[4px_4px_0px_0px_#000]" />
                  <button onClick={handleVerifyOtp} disabled={!otp} className="mt-4 w-full bg-black text-[#FFE600] border-[4px] border-black p-3 font-black tracking-[0.14em] uppercase shadow-[5px_5px_0px_0px_#000] hover:bg-[#FFE600] hover:text-black disabled:opacity-50 transition-colors">
                    VERIFY & ENTER — GO!
                  </button>
                  <button onClick={() => { setConfirmationResult(null); setOtp(""); setAuthError(""); }} className="mt-2 w-full bg-white border-[3px] border-black py-2 font-black text-xs tracking-widest uppercase hover:bg-black hover:text-white transition-colors">← CHANGE PHONE NUMBER</button>
                </div>
              )}
            </div>

            <div className="mt-6 bg-[#FFE600] border-[3px] border-black p-2 font-mono text-[10px] font-black tracking-widest text-center flex justify-between">
              <span>◆ ZERO RADIUS</span><span>◆ THICK BORDERS</span><span>◆ MANGA TYPE</span>
            </div>
          </div>
        </div>
      </main>

      <div className="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-6 pb-6">
        <div className="bg-black text-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px] font-black tracking-widest uppercase">
          <span>© 2026 VASTAVIK TODO — BRUTALISM IS NOT A TREND. IT&apos;S A WARNING.</span>
          <span className="bg-[#FFE600] text-black px-2 py-1 border-[2px] border-white">BUILT WITH CONCRETE + FUNK</span>
        </div>
      </div>
      <div id="recaptcha-container" className="fixed bottom-0 right-0" />
    </div>
  );
}
