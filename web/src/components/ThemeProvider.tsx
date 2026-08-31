"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Accent = "#FFE600" | "#22D3EE" | "#A78BFA";

interface ThemeContextType {
  brutalMode: boolean;
  accent: Accent;
  setBrutalMode: (v: boolean) => void;
  setAccent: (v: Accent) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  brutalMode: true,
  accent: "#FFE600",
  setBrutalMode: () => {},
  setAccent: () => {},
  mounted: false,
});

export const useTheme = () => useContext(ThemeContext);

const STORAGE_BRUTAL = "vastavik-brutal-mode";
const STORAGE_ACCENT = "vastavik-accent";

function applyTheme(brutalMode: boolean, accent: Accent) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  // brutalMode=true => ALWAYS DARK (dark bg), false => use accent as bg
  if (brutalMode) {
    html.classList.add("brutal-dark");
    html.style.setProperty("--brutal-bg", "#0a0a0a");
    html.style.setProperty("--brutal-accent", accent);
    // also set data for css overrides
    html.dataset.brutal = "dark";
  } else {
    html.classList.remove("brutal-dark");
    html.style.setProperty("--brutal-bg", accent);
    html.style.setProperty("--brutal-accent", accent);
    html.dataset.brutal = "light";
  }
  // expose accent for direct use
  html.dataset.accent = accent;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [brutalMode, setBrutalModeRaw] = useState(true);
  const [accent, setAccentRaw] = useState<Accent>("#FFE600");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const b = localStorage.getItem(STORAGE_BRUTAL);
      const a = localStorage.getItem(STORAGE_ACCENT) as Accent | null;
      if (b !== null) setBrutalModeRaw(b === "true");
      if (a && ["#FFE600", "#22D3EE", "#A78BFA"].includes(a)) setAccentRaw(a);
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(brutalMode, accent);
  }, [brutalMode, accent, mounted]);

  const setBrutalMode = useCallback((v: boolean) => {
    setBrutalModeRaw(v);
    try {
      localStorage.setItem(STORAGE_BRUTAL, String(v));
    } catch {}
  }, []);

  const setAccent = useCallback((v: Accent) => {
    setAccentRaw(v);
    try {
      localStorage.setItem(STORAGE_ACCENT, v);
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={{ brutalMode, accent, setBrutalMode, setAccent, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}
