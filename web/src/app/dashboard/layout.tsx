"use client";

import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0c1321] text-[#dce2f6]">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative">
        {children}
      </div>
    </div>
  );
}
