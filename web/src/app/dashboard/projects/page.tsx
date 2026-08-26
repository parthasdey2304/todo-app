"use client";
import { Folder, Zap, Box } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-[#FFE600] relative w-full overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 12px)` }} />
      <div className="bg-white border-b-[4px] border-black pl-14 md:pl-6 pr-3 sm:px-6 py-4 sm:py-6 shadow-[0px_4px_0px_0px_#000]">
        <h1 className="font-black text-[24px] sm:text-[32px] tracking-tighter uppercase flex flex-wrap items-center gap-2 sm:gap-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          <span className="h-10 w-10 sm:h-12 sm:w-12 bg-[#FF3B30] border-[4px] border-black grid place-items-center text-white shadow-[4px_4px_0px_0px_#000] rotate-[-1deg] shrink-0"><Folder className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" /></span>
          PROJECTS
          <span className="bg-black text-white text-[11px] sm:text-xs px-2 sm:px-3 py-1 font-mono tracking-widest border-[3px] border-black">2 BOARDS</span>
        </h1>
        <p className="mt-2 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest bg-[#FF3B30] text-white border-[3px] border-black inline-block px-2 py-1 shadow-[2px_2px_0px_0px_#000] max-w-full">CONCRETE BOARDS — EACH PROJECT IS A SLAB</p>
      </div>
      <div className="bg-black text-[#FFE600] border-y-[4px] border-black overflow-hidden py-1.5">
        <div className="flex animate-brutal-marquee whitespace-nowrap font-black tracking-[0.18em] text-xs uppercase gap-8" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <span>◆ PROJECTS — BUILD IN PUBLIC — STACK YOUR SLABS — BRUTAL BOARDS —</span>
          <span>◆ PROJECTS — BUILD IN PUBLIC — STACK YOUR SLABS — BRUTAL BOARDS —</span>
          <span>◆ PROJECTS — BUILD IN PUBLIC — STACK YOUR SLABS — BRUTAL BOARDS —</span>
        </div>
      </div>
      <div className="w-full max-w-[880px] mx-auto px-3 sm:px-4 md:px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "PERSONAL", tasks: 0, color: "bg-[#FFE600]", icon: "◆" },
            { name: "WORK", tasks: 0, color: "bg-[#22D3EE]", icon: "▓" },
            { name: "SIDE QUESTS", tasks: 0, color: "bg-[#A78BFA]", icon: "★" },
            { name: "SHOPPING", tasks: 0, color: "bg-[#FF3B30] text-white", icon: "●" },
          ].map((p, i) => (
            <div key={p.name} className={`border-[4px] border-black p-6 shadow-[6px_6px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all ${p.color} ${i%2===0 ? 'rotate-[-0.4deg]' : 'rotate-[0.4deg]'}`}>
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 bg-black text-white border-[3px] border-black grid place-items-center font-black text-xl shadow-[3px_3px_0px_0px_#000]">{p.icon}</div>
                <span className="bg-white text-black border-[3px] border-black px-2 py-1 font-mono text-xs font-black">#{String(i+1).padStart(2,'0')}</span>
              </div>
              <h2 className="mt-4 font-black text-[22px] tracking-tighter uppercase" style={{ fontFamily: 'Syne, sans-serif' }}>{p.name}</h2>
              <p className="mt-1 font-mono text-xs font-black tracking-widest uppercase bg-black text-white inline-block px-2 py-1">{p.tasks} TASKS — EMPTY SLAB</p>
              <div className="mt-4 h-2 border-[3px] border-black bg-white flex overflow-hidden">
                <div className="flex-1 bg-black" style={{ width: '40%' }} />
                <div className="flex-1 bg-white" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-black text-[#FFE600] border-[4px] border-black p-4 flex items-center gap-3 shadow-[6px_6px_0px_0px_#000]">
          <Zap className="w-6 h-6 fill-[#FFE600]" />
          <span className="font-mono text-xs font-black tracking-[0.16em] uppercase">MORE PROJECTS COMING — STAY BRUTAL — KEEP STACKING</span>
          <Box className="w-5 h-5 ml-auto" />
        </div>
      </div>
    </div>
  );
}
