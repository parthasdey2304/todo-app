"use client";
import { Folder } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold flex items-center gap-3 mb-8">
        <Folder className="w-6 h-6 text-[#494bd6]" />
        Projects
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Placeholder for projects/categories */}
        <div className="bg-[#151E2E] border border-[#2e3544] p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-[#dce2f6]">Personal</h2>
          <p className="text-sm text-[#98A6BD] mt-1">0 tasks</p>
        </div>
        <div className="bg-[#151E2E] border border-[#2e3544] p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-[#dce2f6]">Work</h2>
          <p className="text-sm text-[#98A6BD] mt-1">0 tasks</p>
        </div>
      </div>
    </div>
  );
}
