"use client";

import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFE600] text-black">
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
