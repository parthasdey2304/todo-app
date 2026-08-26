"use client";
import { Settings, User, Moon, Bell, HardDrive } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold flex items-center gap-3 mb-8">
        <Settings className="w-6 h-6 text-[#494bd6]" />
        Settings
      </h1>
      
      <div className="space-y-6">
        <section className="bg-[#151E2E] border border-[#2e3544] p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-[#dce2f6] flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-[#98A6BD]" /> Account
          </h2>
          <div className="text-sm text-[#98A6BD]">
            <p>Signed in as: <strong className="text-white">{user?.email || user?.phoneNumber || "Guest"}</strong></p>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="mt-4 px-4 py-2 bg-red-500/10 text-red-500 font-semibold rounded-lg hover:bg-red-500/20 transition-colors"
          >
            Log out
          </button>
        </section>

        <section className="bg-[#151E2E] border border-[#2e3544] p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-[#dce2f6] flex items-center gap-2 mb-4">
            <Moon className="w-5 h-5 text-[#98A6BD]" /> Appearance
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#98A6BD]">Dark Mode</span>
            <div className="w-12 h-6 bg-[#494bd6] rounded-full relative cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
            </div>
          </div>
        </section>
        
        <section className="bg-[#151E2E] border border-[#2e3544] p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-[#dce2f6] flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-[#98A6BD]" /> Notifications
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#98A6BD]">Enable Push Reminders</span>
            <div className="w-12 h-6 bg-[#2e3544] rounded-full relative cursor-pointer">
              <div className="w-5 h-5 bg-gray-400 rounded-full absolute left-0.5 top-0.5"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
