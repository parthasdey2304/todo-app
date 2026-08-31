"use client";

import { Home, Inbox, Calendar, Folder, Settings, Search, Menu, X, Zap, Box, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Task } from "@/types";
import { format } from "date-fns";

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const navItems = [
    { name: "Inbox", icon: Inbox, href: "/dashboard/inbox", color: "bg-[#A78BFA]" },
    { name: "TODAY", icon: Home, href: "/dashboard", color: "bg-[#FFE600]" },
    { name: "Upcoming", icon: Calendar, href: "/dashboard/upcoming", color: "bg-[#22D3EE]" },
    { name: "Projects", icon: Folder, href: "/dashboard/projects", color: "bg-[#FF3B30]" },
  ];

  // Ctrl+K handler — works on all pages
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((v) => !v);
      }
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isSearchOpen]);

  // Fetch tasks for search — client sort, no index needed
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db!, "tasks"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Task[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() } as Task));
      arr.sort((a, b) => (b.order || 0) - (a.order || 0));
      setTasks(arr);
    });
    return () => unsub();
  }, [user]);

  const filtered = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.priority.toLowerCase().includes(q) ||
      t.labels.some((l) => l.toLowerCase().includes(q)) ||
      (t.categoryName?.toLowerCase().includes(q) ?? false) ||
      (t.scheduledDate?.includes(q) ?? false)
    );
  }).slice(0, 30);

  return (
    <>
      {/* Mobile Hamburger */}
      <button 
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_#000] text-black hover:bg-[#FFE600] hover:rotate-2 transition-all"
      >
        <Menu className="w-6 h-6 stroke-[3]" />
      </button>

      {/* DESKTOP SIDEBAR — BRUTAL */}
      <aside className="w-[280px] bg-white border-r-[4px] border-black hidden md:flex flex-col h-screen fixed left-0 top-0 z-30 shadow-[6px_0px_0px_0px_#000]">
        {/* hash top */}
        <div className="h-3 bg-black flex">
          <div className="flex-1 bg-[#FFE600] border-r-[2px] border-black" />
          <div className="flex-1 bg-[#22D3EE] border-r-[2px] border-black" />
          <div className="flex-1 bg-[#A78BFA] border-r-[2px] border-black" />
          <div className="flex-1 bg-[#FF3B30]" />
        </div>

        <div className="p-5 border-b-[4px] border-black bg-[#FFE600] relative">
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 10px)` }} />
          <div className="relative flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 bg-black border-[4px] border-black grid place-items-center text-[#FFE600] font-black text-2xl leading-none shadow-[4px_4px_0px_0px_#000] rotate-[-2deg] shrink-0">
              V
            </div>
            <div className="leading-none min-w-0 flex-1">
              <div className="font-black text-[20px] tracking-tighter uppercase flex flex-wrap items-baseline gap-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                <span className="whitespace-nowrap">VASTAVIK</span><span className="bg-black text-[#FFE600] px-1 border-[2px] border-black text-[16px] rotate-[1deg] inline-block whitespace-nowrap shrink-0">TODO</span>
              </div>
              <div className="text-[10px] font-mono font-black tracking-[0.18em] uppercase opacity-60 whitespace-nowrap">BRUTAL • TASK MACHINE</div>
            </div>
          </div>
          <div className="relative mt-3 flex flex-wrap items-center gap-2">
            <span className="bg-[#FF3B30] text-white border-[3px] border-black px-2 py-1 font-black text-[10px] tracking-widest flex items-center gap-1 shadow-[3px_3px_0px_0px_#000] whitespace-nowrap shrink-0">
              <span className="h-2 w-2 bg-white animate-pulse border border-black" /> LIVE
            </span>
            <span className="bg-black text-white px-2 py-1 font-mono text-[10px] font-black tracking-widest border-[2px] border-black whitespace-nowrap shrink-0">2026 // FUNK</span>
          </div>
        </div>

        <div className="px-3 py-3 border-b-[4px] border-black bg-white">
          <button onClick={()=> setIsSearchOpen(true)} className="w-full flex items-center gap-3 px-3 py-3 text-sm font-black uppercase tracking-widest bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFE600] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000] transition-all">
            <Search className="w-5 h-5 stroke-[3]" />
            <span>SEARCH // CTRL+K</span>
            <Zap className="w-4 h-4 ml-auto fill-black" />
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-2 bg-[#FFE600]/10 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 border-[4px] font-black uppercase tracking-tight text-[15px] transition-all shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000]",
                  isActive
                    ? "bg-black text-[#FFE600] border-black rotate-[-0.6deg]"
                    : "bg-white text-black border-black hover:bg-[#FFE600] hover:rotate-[0.6deg]"
                )}
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                <span className={cn("h-9 w-9 border-[3px] border-black grid place-items-center shadow-[2px_2px_0px_0px_#000]", isActive ? "bg-[#FFE600] text-black" : item.color + " text-black")}>
                  <item.icon className="w-5 h-5 stroke-[2.5]" />
                </span>
                {item.name}
                {isActive && <span className="ml-auto bg-[#FFE600] text-black text-[10px] px-2 py-1 border-[2px] border-white font-mono">● ACTIVE</span>}
              </Link>
            );
          })}
          <div className="pt-2">
            <div className="h-2 border-[3px] border-black bg-white flex overflow-hidden">
              <div className="flex-1 bg-black" /><div className="flex-1 bg-[#FFE600] border-l border-black" /><div className="flex-1 bg-[#22D3EE] border-l border-black" /><div className="flex-1 bg-[#A78BFA] border-l border-black" />
            </div>
          </div>
        </nav>

        <div className="p-3 border-t-[4px] border-black bg-white">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-3 border-[4px] border-black bg-[#A78BFA] font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_#000] hover:bg-black hover:text-[#FFE600] transition-colors"
          >
            <Settings className="w-5 h-5 stroke-[2.5]" />
            SETTINGS
            <Box className="w-4 h-4 ml-auto" />
          </Link>
          <div className="mt-3 bg-black text-[#FFE600] border-[3px] border-black p-2 font-mono text-[10px] font-black tracking-widest text-center">
            ZERO RADIUS • THICK BORDERS • FUNK FOREVER
          </div>
        </div>
      </aside>

      {/* SEARCH PALETTE — BRUTAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[8vh] p-3 sm:p-6">
          <div className="absolute inset-0 bg-[#FFE600]/70 backdrop-blur-[2px]" onClick={()=> setIsSearchOpen(false)} />
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 12px)` }} />
          <div className="relative w-full max-w-[640px] bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] animate-pop max-h-[80vh] flex flex-col overflow-hidden">
            <div className="h-2 flex shrink-0">
              <div className="flex-1 bg-[#FFE600] border-r-[2px] border-black" />
              <div className="flex-1 bg-[#22D3EE] border-r-[2px] border-black" />
              <div className="flex-1 bg-[#A78BFA] border-r-[2px] border-black" />
              <div className="flex-1 bg-[#FF3B30]" />
            </div>
            <div className="bg-black text-[#FFE600] px-3 py-2 flex items-center justify-between">
              <span className="font-mono text-[10px] font-black tracking-[0.18em]">SEARCH // CTRL+K — FIND YOUR SLAB</span>
              <button onClick={()=> setIsSearchOpen(false)} className="bg-white text-black border-[2px] border-black px-2 py-0.5 font-black text-xs hover:bg-[#FF3B30] hover:text-white">✕ ESC</button>
            </div>
            <div className="p-3 bg-[#FFE600] border-y-[4px] border-black">
              <div className="flex items-center gap-2 bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_#000] px-3 py-2">
                <Search className="w-5 h-5 stroke-[3] shrink-0" />
                <input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e)=> setSearchQuery(e.target.value)}
                  placeholder="TYPE TITLE, #MANGA, PRIORITY, DATE..."
                  className="flex-1 bg-transparent font-black uppercase tracking-tight placeholder:text-black/40 focus:outline-none text-sm"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                />
                {searchQuery && (
                  <button onClick={()=> setSearchQuery("")} className="bg-black text-white border-[2px] border-black px-2 py-0.5 font-black text-xs">CLEAR</button>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 font-mono text-[10px] font-black tracking-widest">
                <span className="bg-black text-white px-2 py-0.5 border border-black">{filtered.length} RESULTS</span>
                <span className="bg-white border-[2px] border-black px-2 py-0.5">TIP: TRY “MANGA” / “URGENT” / “HELLO”</span>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-2 bg-[#FFE600]/20 min-h-[200px]">
              {filtered.length === 0 ? (
                <div className="bg-white border-[4px] border-black p-8 text-center shadow-[4px_4px_0px_0px_#000]">
                  <div className="w-12 h-12 mx-auto bg-[#FFE600] border-[3px] border-black grid place-items-center rotate-2"><Search className="w-6 h-6" /></div>
                  <p className="mt-3 font-black uppercase tracking-tight">NO SLABS FOUND</p>
                  <p className="font-mono text-xs font-black uppercase opacity-50">TRY ANOTHER KEYWORD — {tasks.length} TOTAL</p>
                </div>
              ) : (
                filtered.map((t) => (
                  <div key={t.id} className="bg-white border-[3px] border-black p-3 shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex items-start gap-3">
                    <div className={`h-8 w-8 border-[3px] border-black grid place-items-center shrink-0 mt-0.5 ${t.status==="completed" ? "bg-[#FFE600]" : "bg-white"}`}>
                      {t.status==="completed" ? "✓" : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black uppercase tracking-tighter text-[15px] leading-none truncate" style={{ fontFamily: 'Syne, sans-serif'}}>{t.title}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {t.scheduledDate && <span className="bg-black text-[#FFE600] border-[2px] border-black px-1.5 py-0.5 font-mono text-[10px] font-black">{t.scheduledDate}</span>}
                        {t.priority !== "none" && <span className={`border-[2px] border-black px-1.5 py-0.5 font-black text-[10px] uppercase ${t.priority==="urgent" ? "bg-[#FF3B30] text-white" : t.priority==="high" ? "bg-[#FF9A00]" : t.priority==="medium" ? "bg-[#FFE600]" : "bg-[#22D3EE]"}`}>{t.priority}</span>}
                        {t.labels.map((l,i)=>(<span key={i} className="bg-[#A78BFA] border-[2px] border-black px-1.5 py-0.5 font-black text-[10px] uppercase">#{l}</span>))}
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex font-mono text-[10px] font-black bg-white border-[2px] border-black px-1 shrink-0">#{String(t.order).slice(-4)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="p-2 bg-black text-[#FFE600] flex items-center justify-between font-mono text-[10px] font-black tracking-widest">
              <span>↵ SELECT • ESC CLOSE • CTRL+K TOGGLE</span>
              <span className="bg-[#FFE600] text-black px-2 py-0.5 border border-white">{tasks.length} SLABS TOTAL</span>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE FULLSCREEN */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#FFE600] flex flex-col items-center justify-center md:hidden p-4 animate-pop overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 12px)` }} />
          {/* top marquee */}
          <div className="absolute top-0 left-0 right-0 bg-black text-[#FFE600] border-y-[4px] border-black overflow-hidden py-2">
            <div className="flex animate-brutal-marquee whitespace-nowrap font-black tracking-[0.2em] text-xs uppercase gap-8">
              <span>VASTAVIK TODO — BRUTAL — FUNKY — MANGA — VASTAVIK TODO — BRUTAL — FUNKY — MANGA —</span>
              <span>VASTAVIK TODO — BRUTAL — FUNKY — MANGA — VASTAVIK TODO — BRUTAL — FUNKY — MANGA —</span>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-12 right-4 p-2 bg-black text-[#FFE600] border-[3px] border-black shadow-[4px_4px_0px_0px_#000]"
          >
            <X className="w-7 h-7 stroke-[3]" />
          </button>
          
          <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-3 rotate-[-1deg] mt-8">
            <h2 className="text-3xl font-black tracking-tighter uppercase" style={{ fontFamily: 'Syne, sans-serif' }}>VASTAVIK<span className="bg-[#FFE600] border-[3px] border-black px-1 ml-1">TODO</span></h2>
            <div className="text-center font-mono text-[11px] font-black tracking-[0.2em] bg-black text-white mt-2 py-1">BRUTAL TASK MACHINE</div>
          </div>
          
          <nav className="flex flex-col items-center gap-3 w-full max-w-sm mt-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-center gap-3 w-full py-4 border-[4px] border-black text-lg font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_#000] transition-all",
                    isActive
                      ? "bg-black text-[#FFE600] rotate-[-0.8deg]"
                      : "bg-white text-black hover:bg-[#FFE600] rotate-[0.5deg]"
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  {item.name}
                </Link>
              );
            })}
            <Link
              href="/dashboard/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-3 w-full py-4 border-[4px] border-black bg-[#A78BFA] text-black font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_#000]"
            >
              <Settings className="w-6 h-6" />
              SETTINGS
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
