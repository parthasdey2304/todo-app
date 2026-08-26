"use client";
import { Settings, User, Moon, Bell, HardDrive, Zap, Box, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#FFE600] relative w-full overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 12px)` }} />
      <div className="bg-white border-b-[4px] border-black pl-14 md:pl-6 pr-3 sm:px-6 py-4 sm:py-6 shadow-[0px_4px_0px_0px_#000]">
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
          <div className="mt-4 flex items-center justify-between bg-black text-white border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <span className="font-mono text-sm font-black tracking-widest uppercase">BRUTAL MODE // ALWAYS DARK?</span>
            <div className="w-16 h-8 bg-[#FFE600] border-[3px] border-white relative cursor-pointer flex items-center px-1">
              <div className="w-6 h-6 bg-black border-[2px] border-white absolute right-1"></div>
              <span className="font-mono text-[8px] font-black text-black">ON</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="h-10 bg-[#FFE600] border-[3px] border-black shadow-[2px_2px_0px_0px_#000]" />
            <div className="h-10 bg-[#22D3EE] border-[3px] border-black shadow-[2px_2px_0px_0px_#000]" />
            <div className="h-10 bg-[#A78BFA] border-[3px] border-black shadow-[2px_2px_0px_0px_#000]" />
          </div>
        </section>
        
        <section className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-5">
          <h2 className="font-black uppercase tracking-tight flex items-center gap-2 text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
            <span className="h-8 w-8 bg-[#FF3B30] border-[3px] border-black grid place-items-center text-white"><Bell className="w-4 h-4 stroke-[2.5]" /></span> NOTIFICATIONS — STAY LOUD
          </h2>
          <div className="mt-4 flex items-center justify-between bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <span className="font-mono text-sm font-black tracking-widest uppercase">ENABLE PUSH REMINDERS</span>
            <div className="w-16 h-8 bg-white border-[3px] border-black relative cursor-pointer flex items-center px-1">
              <div className="w-6 h-6 bg-black border-[2px] border-black absolute left-1"></div>
              <span className="font-mono text-[8px] font-black ml-auto">OFF</span>
            </div>
          </div>
        </section>

        <div className="bg-black text-[#FFE600] border-[4px] border-black p-4 flex items-center gap-3 shadow-[6px_6px_0px_0px_#000]">
          <HardDrive className="w-5 h-5" />
          <span className="font-mono text-xs font-black tracking-[0.14em] uppercase">STORAGE: CONCRETE • SYNC: FIREBASE • STYLE: BRUTAL</span>
          <Zap className="w-5 h-5 ml-auto fill-[#FFE600]" />
        </div>
      </div>
    </div>
  );
}
