"use client";

import { Sidebar } from "@/components/Sidebar";
import { useTheme } from "@/components/ThemeProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { brutalMode, accent } = useTheme();
  return (
    <div className="min-h-screen text-black" style={{ background: brutalMode ? "#0a0a0a" : accent }}>
      <Sidebar />
      {/* pl reserves fixed sidebar space on desktop; w-full ensures centering is calc(100vw - 280px), not offset */}
      <div className="min-h-screen flex flex-col w-full md:pl-[280px]">
        <div className="flex-1 flex flex-col w-full max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
}
