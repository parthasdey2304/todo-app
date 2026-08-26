"use client";

import { Home, Inbox, Calendar, Folder, Settings, Search, Menu, X, Zap, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Inbox", icon: Inbox, href: "/dashboard/inbox", color: "bg-[#A78BFA]" },
    { name: "TODAY", icon: Home, href: "/dashboard", color: "bg-[#FFE600]" },
    { name: "Upcoming", icon: Calendar, href: "/dashboard/upcoming", color: "bg-[#22D3EE]" },
    { name: "Projects", icon: Folder, href: "/dashboard/projects", color: "bg-[#FF3B30]" },
  ];

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

        <div className="p-5 border-b-[4px] border-black bg-[#FFE600] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 10px)` }} />
          <div className="relative flex items-center gap-3">
            <div className="h-12 w-12 bg-black border-[4px] border-black grid place-items-center text-[#FFE600] font-black text-2xl leading-none shadow-[4px_4px_0px_0px_#000] rotate-[-2deg]">
              V
            </div>
            <div className="leading-none">
              <div className="font-black text-[22px] tracking-tighter uppercase flex items-baseline gap-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                VASTAVIK<span className="bg-black text-[#FFE600] px-1 border-[2px] border-black text-[18px] rotate-[1deg] inline-block">TODO</span>
              </div>
              <div className="text-[10px] font-mono font-black tracking-[0.18em] uppercase opacity-60">BRUTAL • TASK MACHINE</div>
            </div>
          </div>
          <div className="relative mt-3 flex items-center gap-2">
            <span className="bg-[#FF3B30] text-white border-[3px] border-black px-2 py-1 font-black text-[10px] tracking-widest flex items-center gap-1 shadow-[3px_3px_0px_0px_#000]">
              <span className="h-2 w-2 bg-white animate-pulse border border-black" /> LIVE
            </span>
            <span className="bg-black text-white px-2 py-1 font-mono text-[10px] font-black tracking-widest border-[2px] border-black">2026 // FUNK</span>
          </div>
        </div>

        <div className="px-3 py-3 border-b-[4px] border-black bg-white">
          <button className="w-full flex items-center gap-3 px-3 py-3 text-sm font-black uppercase tracking-widest bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFE600] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000] transition-all">
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
