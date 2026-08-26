"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Task } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { Calendar } from "lucide-react";

export default function UpcomingPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (user && db) {
      const q = query(collection(db!, "tasks"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksArray: Task[] = [];
        snapshot.forEach((doc) => tasksArray.push({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksArray);
      }, (err)=> console.error("[upcoming] firestore", err));
      return () => unsubscribe();
    }
  }, [user]);

  const toggleTask = async (task: Task) => {
    if (!db) return;
    const taskRef = doc(db!, "tasks", task.id);
    await updateDoc(taskRef, {
      status: task.status === 'completed' ? 'active' : 'completed',
      completedAt: task.status === 'completed' ? null : serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const upcomingTasks = tasks.filter(t => t.scheduledDate && t.status === 'active');

  return (
    <div className="min-h-screen bg-[#FFE600] relative w-full overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 12px)` }} />
      <div className="bg-white border-b-[4px] border-black pl-14 md:pl-6 pr-3 sm:px-6 py-4 sm:py-6 shadow-[0px_4px_0px_0px_#000] relative">
        <h1 className="font-black text-[24px] sm:text-[32px] tracking-tighter uppercase flex flex-wrap items-center gap-2 sm:gap-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          <span className="h-10 w-10 sm:h-12 sm:w-12 bg-[#22D3EE] border-[4px] border-black grid place-items-center shadow-[4px_4px_0px_0px_#000] rotate-[1deg] shrink-0"><Calendar className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" /></span>
          UPCOMING
          <span className="bg-black text-[#FFE600] text-[11px] sm:text-xs px-2 sm:px-3 py-1 font-mono tracking-widest border-[3px] border-black">{upcomingTasks.length} SCHEDULED</span>
        </h1>
        <p className="mt-2 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest bg-[#22D3EE] border-[3px] border-black inline-block px-2 py-1 shadow-[2px_2px_0px_0px_#000] max-w-full">FUTURE SLABS — SEE WHAT&apos;S COMING — STAY BRUTAL</p>
      </div>
      <div className="bg-black text-[#FFE600] border-y-[4px] border-black overflow-hidden py-1.5">
        <div className="flex animate-brutal-marquee whitespace-nowrap font-black tracking-[0.18em] text-xs uppercase gap-8" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <span>◆ UPCOMING — THE FUTURE IS CONCRETE — PLAN HARD — EXECUTE HARDER —</span>
          <span>◆ UPCOMING — THE FUTURE IS CONCRETE — PLAN HARD — EXECUTE HARDER —</span>
          <span>◆ UPCOMING — THE FUTURE IS CONCRETE — PLAN HARD — EXECUTE HARDER —</span>
        </div>
      </div>
      <div className="w-full max-w-[880px] mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-3">
        {upcomingTasks.length === 0 ? (
          <div className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-10 text-center">
            <div className="w-16 h-16 mx-auto bg-[#22D3EE] border-[4px] border-black grid place-items-center shadow-[4px_4px_0px_0px_#000] -rotate-2"><Calendar className="w-8 h-8" /></div>
            <p className="mt-3 font-black uppercase tracking-tight text-lg">NO UPCOMING SLABS</p>
            <p className="font-mono text-xs font-black uppercase opacity-50">THE HORIZON IS CLEAR — GO BUILD</p>
          </div>
        ) : (
          upcomingTasks.map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={() => {}} />)
        )}
      </div>
    </div>
  );
}
