"use client";

import { Home, Inbox, Calendar, Folder, Settings, Search, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Inbox", icon: Inbox, href: "/dashboard/inbox" },
    { name: "Today", icon: Home, href: "/dashboard" },
    { name: "Upcoming", icon: Calendar, href: "/dashboard/upcoming" },
    { name: "Projects", icon: Folder, href: "/dashboard/projects" },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-[#1E293B] border border-[#2e3544] text-white hover:bg-[#2e3544] transition-colors shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-[#151E2E]/80 backdrop-blur-xl border-r border-[#2e3544] hidden md:flex flex-col h-screen fixed left-0 top-0 z-30">
        <div className="p-6 border-b border-[#2e3544] flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-[#c0c1ff]">Vastavik ToDo</h2>
        </div>

        <div className="px-4 py-4">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#98A6BD] bg-[#0c1321] rounded-lg border border-[#2e3544] hover:border-[#494bd6] transition-colors">
            <Search className="w-4 h-4" />
            <span>Search tasks (Ctrl+K)</span>
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-[#494bd6]/10 text-[#c0c1ff] border border-[#494bd6]/30"
                    : "text-[#98A6BD] hover:bg-[#1E293B] hover:text-[#dce2f6] border border-transparent"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-[#494bd6]" : "")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#2e3544]">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-[#98A6BD] hover:bg-[#1E293B] hover:text-[#dce2f6] transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Full-Screen Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0c1321] flex flex-col items-center justify-center md:hidden animate-in fade-in duration-200">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-6 right-6 p-2 text-[#98A6BD] hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          
          <h2 className="text-3xl font-bold tracking-tight text-[#c0c1ff] mb-12">Vastavik ToDo</h2>
          
          <nav className="flex flex-col items-center space-y-6 w-full px-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-center gap-4 w-full py-4 rounded-2xl text-xl font-medium transition-colors",
                    isActive
                      ? "bg-[#494bd6] text-white shadow-lg shadow-[#494bd6]/20"
                      : "text-[#98A6BD] bg-[#151E2E] border border-[#2e3544] hover:border-[#494bd6] hover:text-white"
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
              className="flex items-center justify-center gap-4 w-full py-4 rounded-2xl text-xl font-medium text-[#98A6BD] bg-[#151E2E] border border-[#2e3544] hover:border-[#494bd6] hover:text-white transition-colors mt-4"
            >
              <Settings className="w-6 h-6" />
              Settings
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
