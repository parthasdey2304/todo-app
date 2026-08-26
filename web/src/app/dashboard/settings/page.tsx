"use client";
import { useState, useEffect } from "react";
import { Settings, User, Moon, Bell, HardDrive, Zap, Box, LogOut, Sun, Check } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Accent = "#FFE600" | "#22D3EE" | "#A78BFA";
const ACCENTS: { value: Accent; label: string }[] = [
  { value: "#FFE600", label: "BRUTAL YELLOW" },
  { value: "#22D3EE", label: "CYAN PUNCH" },
  { value: "#A78BFA", label: "PURPLE HAZE" },
];

export default function SettingsPage() {
  const { user } = useAuth();

  const [brutalMode, setBrutalMode] = useState(true);
  const [accent, setAccent] = useState<Accent>("#FFE600");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");
  const [toast, setToast] = useState("");
  const [mounted, setMounted] = useState(false);

  // hydrate from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const b = localStorage.getItem("vastavik-brutal-mode");
      if (b !== null) setBrutalMode(b === "true");
      const a = localStorage.getItem("vastavik-accent") as Accent | null;
      if (a && ["#FFE600", "#22D3EE", "#A78BFA"].includes(a)) setAccent(a);
      const p = localStorage.getItem("vastavik-push-enabled");
      // check real notification permission
      if (typeof window !== "undefined" && "Notification" in window) {
        setPushPermission(Notification.permission);
        if (p === "true" && Notification.permission === "granted") setPushEnabled(true);
        else if (Notification.permission === "denied") setPushEnabled(false);
      } else {
        setPushPermission("unsupported");
      }
    } catch {}
  }, []);

  // persist + apply global effects
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("vastavik-brutal-mode", String(brutalMode));
    } catch {}
    // apply to html for global brutal dark
    if (typeof document !== "undefined") {
      if (brutalMode) {
        document.documentElement.classList.add("brutal-dark");
        document.documentElement.style.setProperty("--brutal-bg", "#0a0a0a");
      } else {
        document.documentElement.classList.remove("brutal-dark");
        document.documentElement.style.setProperty("--brutal-bg", "#FFE600");
      }
    }
  }, [brutalMode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("vastavik-accent", accent);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--brutal-accent", accent);
    }
  }, [accent, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("vastavik-push-enabled", String(pushEnabled));
    } catch {}
  }, [pushEnabled, mounted]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const toggleBrutal = () => {
    const next = !brutalMode;
    setBrutalMode(next);
    showToast(next ? "BRUTAL MODE ON — ALWAYS DARK ✔" : "BRUTAL MODE OFF — SOFT MODE");
  };

  const selectAccent = (v: Accent) => {
    setAccent(v);
    showToast(`ACCENT: ${v} — SLAMMED!`);
  };

  const togglePush = async () => {
    if (pushPermission === "unsupported") {
      showToast("NOTIFICATIONS UNSUPPORTED IN THIS BROWSER");
      return;
    }
    if (!pushEnabled) {
      // try to enable
      try {
        if (typeof window === "undefined" || !("Notification" in window)) {
          showToast("NOTIFICATIONS UNSUPPORTED");
          return;
        }
        let perm: NotificationPermission = Notification.permission;
        if (perm === "default") {
          perm = await Notification.requestPermission();
          setPushPermission(perm);
        }
        if (perm === "granted") {
          setPushEnabled(true);
          showToast("PUSH REMINDERS ON — STAY LOUD 🔔");
          // fire a brutal test notification
          try {
            new Notification("VASTAVIK TODO — BRUTAL", {
              body: "Push reminders are LIVE. We will nudge you brutal.",
              icon: "/favicon.ico",
            });
          } catch {}
        } else if (perm === "denied") {
          showToast("PERMISSION BLOCKED — ENABLE IN BROWSER SETTINGS");
          setPushEnabled(false);
        } else {
          showToast("PERMISSION DISMISSED");
        }
      } catch (e: any) {
        showToast(e?.message || "FAILED TO ENABLE PUSH");
      }
    } else {
      setPushEnabled(false);
      showToast("PUSH REMINDERS OFF — SILENCE");
    }
  };

  if (!mounted) {
    // prevent hydration mismatch — render static skeleton until mounted
  }

  return (
    <div className="min-h-screen bg-[#FFE600] relative w-full overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 12px)` }} />
      <div className="bg-white border-b-[4px] border-black pl-[72px] md:pl-6 pr-3 sm:px-6 py-4 sm:py-6 shadow-[0px_4px_0px_0px_#000]">
        <h1 className="font-black text-[24px] sm:text-[32px] tracking-tighter uppercase flex flex-wrap items-center gap-2 sm:gap-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          <span className="h-10 w-10 sm:h-12 sm:w-12 bg-black border-[4px] border-black grid place-items-center text-[#FFE600] shadow-[4px_4px_0px_0px_#000] rotate-[1deg] shrink-0"><Settings className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" /></span>
          SETTINGS
          <span className="bg-[#FFE600] border-[3px] border-black text-[11px] sm:text-xs px-2 sm:px-3 py-1 font-mono tracking-widest">CONTROL PANEL</span>
        </h1>
        <p className="mt-2 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest bg-black text-[#FFE600] inline-block px-2 py-1 max-w-full">TUNE THE MACHINE — MAKE IT YOURS</p>
      </div>

      <div className="w-full max-w-[880px] mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-4">
        <section className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-5">
          <h2 className="font-black uppercase tracking-tight flex items-center gap-2 text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
            <span className="h-8 w-8 bg-[#FFE600] border-[3px] border-black grid place-items-center"><User className="w-4 h-4 stroke-[2.5]" /></span> ACCOUNT — WHO ARE YOU?
          </h2>
          <div className="mt-4 bg-[#FFE600] border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <p className="font-mono text-xs font-black tracking-widest uppercase">SIGNED IN AS:</p>
            <p className="mt-1 font-black text-lg uppercase tracking-tighter bg-black text-white inline-block px-3 py-1 border-[3px] border-black break-all">{user?.email || user?.phoneNumber || "GUEST // UNKNOWN"}</p>
          </div>
          <button 
            onClick={() => auth && signOut(auth)}
            className="mt-4 w-full sm:w-auto bg-[#FF3B30] text-white border-[4px] border-black px-6 py-3 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] hover:bg-black hover:text-[#FFE600] flex items-center justify-center gap-2 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            <LogOut className="w-5 h-5" /> LOG OUT — EXIT VOID
          </button>
        </section>

        <section className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-5">
          <h2 className="font-black uppercase tracking-tight flex items-center gap-2 text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
            <span className="h-8 w-8 bg-[#A78BFA] border-[3px] border-black grid place-items-center"><Moon className="w-4 h-4 stroke-[2.5]" /></span> APPEARANCE — LOOK BRUTAL
          </h2>
          {/* BRUTAL MODE TOGGLE — now functional */}
          <button
            type="button"
            role="switch"
            aria-checked={brutalMode}
            aria-label="Toggle brutal mode always dark"
            onClick={toggleBrutal}
            className={`mt-4 flex w-full items-center justify-between border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_#000] transition-colors ${brutalMode ? 'bg-black text-white' : 'bg-white text-black'}`}
          >
            <span className="font-mono text-sm font-black tracking-widest uppercase flex items-center gap-2">
              {brutalMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              BRUTAL MODE // ALWAYS DARK?
            </span>
            <span className={`w-16 h-8 border-[3px] relative flex items-center px-1 shrink-0 transition-colors ${brutalMode ? 'bg-[#FFE600] border-white' : 'bg-white border-black'}`}>
              <span
                className={`w-6 h-6 border-[2px] absolute transition-all duration-200 ${brutalMode ? 'bg-black border-white right-1 translate-x-0' : 'bg-black border-black left-1'}`}
                style={{ boxShadow: '2px 2px 0px 0px #000' }}
              />
              <span className={`font-mono text-[8px] font-black transition-opacity ${brutalMode ? 'text-black' : 'text-black ml-auto'}`}>
                {brutalMode ? 'ON' : 'OFF'}
              </span>
            </span>
          </button>
          {/* ACCENT PICKER — now functional */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {ACCENTS.map((a) => {
              const selected = accent === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => selectAccent(a.value)}
                  aria-label={`Select accent ${a.label}`}
                  aria-pressed={selected}
                  title={a.label}
                  className={`h-10 border-[3px] border-black shadow-[2px_2px_0px_0px_#000] relative flex items-center justify-center transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] ${selected ? 'ring-4 ring-black ring-offset-2 scale-[1.02]' : 'opacity-90 hover:opacity-100'}`}
                  style={{ background: a.value }}
                >
                  {selected && (
                    <span className="bg-black text-white border-[2px] border-white px-1 py-0.5 font-mono text-[8px] font-black flex items-center gap-1">
                      <Check className="w-3 h-3" /> ON
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-2 font-mono text-[10px] font-black uppercase tracking-widest opacity-60">
            ACCENT: <span className="bg-black text-[#FFE600] px-1.5 py-0.5 border border-black">{accent}</span> — TAP A SLAB TO SLAM COLOR
          </p>
        </section>
        
        <section className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-5">
          <h2 className="font-black uppercase tracking-tight flex items-center gap-2 text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
            <span className="h-8 w-8 bg-[#FF3B30] border-[3px] border-black grid place-items-center text-white"><Bell className="w-4 h-4 stroke-[2.5]" /></span> NOTIFICATIONS — STAY LOUD
          </h2>
          <button
            type="button"
            role="switch"
            aria-checked={pushEnabled}
            aria-label="Toggle push reminders"
            onClick={togglePush}
            className={`mt-4 flex w-full items-center justify-between border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_#000] transition-colors ${pushEnabled ? 'bg-black text-white' : 'bg-white text-black'}`}
          >
            <span className="font-mono text-sm font-black tracking-widest uppercase">ENABLE PUSH REMINDERS</span>
            <span className={`w-16 h-8 border-[3px] relative flex items-center px-1 shrink-0 transition-colors ${pushEnabled ? 'bg-[#FFE600] border-white' : 'bg-white border-black'}`}>
              <span className={`w-6 h-6 border-[2px] absolute transition-all duration-200 ${pushEnabled ? 'bg-black border-white right-1' : 'bg-black border-black left-1'}`} />
              <span className={`font-mono text-[8px] font-black ${pushEnabled ? 'text-black' : 'ml-auto text-black'}`}>{pushEnabled ? 'ON' : 'OFF'}</span>
            </span>
          </button>
          <p className="mt-2 font-mono text-[10px] font-black uppercase tracking-widest opacity-60">
            {pushPermission === "unsupported" ? "NOTIFICATIONS UNSUPPORTED IN THIS BROWSER" : pushPermission === "denied" ? "BLOCKED — ENABLE IN BROWSER SITE SETTINGS" : pushEnabled ? "LIVE — WE WILL NUDGE YOU BRUTAL" : "OFF — TAP TO REQUEST PERMISSION"}
          </p>
        </section>

        <div className="bg-black text-[#FFE600] border-[4px] border-black p-4 flex items-center gap-3 shadow-[6px_6px_0px_0px_#000]">
          <HardDrive className="w-5 h-5" />
          <span className="font-mono text-xs font-black tracking-[0.14em] uppercase">STORAGE: CONCRETE • SYNC: FIREBASE • STYLE: BRUTAL {brutalMode ? '• DARK: ON' : '• DARK: OFF'} {accent !== "#FFE600" ? `• ACCENT: ${accent}` : ''}</span>
          <Zap className="w-5 h-5 ml-auto fill-[#FFE600]" />
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black text-[#FFE600] border-[4px] border-black px-4 py-3 font-mono text-xs font-black tracking-widest uppercase shadow-[6px_6px_0px_0px_#000] animate-pop max-w-[90vw] text-center">
          {toast}
        </div>
      )}
    </div>
  );
}
