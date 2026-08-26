"use client";

import { Home, Inbox, Calendar, Folder, Settings, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Inbox", icon: Inbox, href: "/dashboard/inbox" },
    { name: "Today", icon: Home, href: "/dashboard" },
    { name: "Upcoming", icon: Calendar, href: "/dashboard/upcoming" },
    { name: "Projects", icon: Folder, href: "/dashboard/projects" },
  ];

  return (
    <aside className="w-64 bg-[#151E2E]/80 backdrop-blur-xl border-r border-[#2e3544] hidden md:flex flex-col h-screen fixed left-0 top-0">
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
  );
}
