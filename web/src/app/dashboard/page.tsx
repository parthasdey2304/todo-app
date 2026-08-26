"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  const handleSignOut = () => signOut(auth);

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask("");
    }
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="flex min-h-screen bg-[#0c1321] text-[#dce2f6]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#151E2E]/80 backdrop-blur-xl border-r border-[#2e3544] flex flex-col hidden md:flex">
        <div className="p-6 border-b border-[#2e3544]">
          <h2 className="text-xl font-bold tracking-tight text-[#c0c1ff]">Vastavik ToDo</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 rounded-lg bg-[#2e3544]/50 px-3 py-2 text-[#c0c1ff] font-medium border border-[#494bd6]/30">
            <span>📋</span> All Tasks
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#98A6BD] hover:bg-[#1E293B] hover:text-[#dce2f6] transition-colors">
            <span>⭐</span> Important
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-[#2e3544] bg-[#151E2E]/50 backdrop-blur-md">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#98A6BD]">{user.email || user.phoneNumber}</span>
            <button
              onClick={handleSignOut}
              className="rounded-full bg-[#1E293B] px-4 py-2 text-sm font-semibold hover:bg-[#2e3544] transition-colors border border-[#2e3544]"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
          {/* Add Task Input */}
          <div className="flex gap-4 mb-8">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              className="flex-1 rounded-xl bg-[#151E2E] border border-[#2e3544] p-4 text-white focus:border-[#494bd6] focus:outline-none focus:ring-1 focus:ring-[#494bd6] transition-colors text-lg shadow-inner"
            />
            <button
              onClick={addTask}
              className="rounded-xl bg-gradient-to-r from-[#494bd6] to-[#8083ff] px-8 font-semibold text-white transition-opacity hover:opacity-90 shadow-lg"
            >
              Add Task
            </button>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-[#98A6BD] rounded-2xl border border-dashed border-[#2e3544]">
                No tasks yet. Add one above!
              </div>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    task.completed 
                      ? 'bg-[#151E2E]/50 border-[#2e3544]/50 opacity-60' 
                      : 'bg-[#151E2E] border-[#2e3544] hover:border-[#494bd6]/50 shadow-md'
                  }`}
                >
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                      task.completed ? 'bg-[#44e2cd] border-[#44e2cd]' : 'border-[#98A6BD] hover:border-[#494bd6]'
                    }`}
                  >
                    {task.completed && <svg className="w-4 h-4 text-[#003731]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <span className={`text-lg ${task.completed ? 'line-through text-[#98A6BD]' : 'text-[#dce2f6]'}`}>
                    {task.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
