"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Task } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { Calendar } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function UpcomingPage() {
  const { user } = useAuth();
  const { brutalMode, accent } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [pendingDeleteAll, setPendingDeleteAll] = useState(false);

  useEffect(() => {
    if (user && db) {
      const q = query(collection(db!, "tasks"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksArray: Task[] = [];
        snapshot.forEach((doc) => tasksArray.push({ id: doc.id, ...doc.data() } as Task));
        tasksArray.sort((a,b)=> (b.order||0) - (a.order||0));
        setTasks(tasksArray);
      }, (err: any)=> {
        console.error("[upcoming] firestore", err);
        if (err?.message?.includes("building")) console.warn("index building, retry");
      });
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
  const deleteTask = async (task: Task) => {
    if (!db) return;
    await deleteDoc(doc(db!, "tasks", task.id));
    setPendingDelete(null);
  };

  const upcomingTasks = tasks.filter(t => t.scheduledDate && t.status === 'active');

  return (
    <div className="min-h-screen relative w-full overflow-x-hidden" style={{ background: brutalMode ? "#0a0a0a" : accent }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 12px)` }} />
      <div className="bg-white border-b-[4px] border-black pl-[72px] md:pl-6 pr-3 sm:px-6 py-4 sm:py-6 shadow-[0px_4px_0px_0px_#000] relative">
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
        {upcomingTasks.length > 0 && (
          <div className="flex justify-end">
            <button onClick={()=> setPendingDeleteAll(true)} className="bg-[#FF3B30] text-white border-[3px] border-black px-3 py-1 font-black text-xs tracking-widest uppercase shadow-[3px_3px_0px_0px_#000]">DELETE ALL ✕</button>
          </div>
        )}
        {upcomingTasks.length === 0 ? (
          <div className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-10 text-center">
            <div className="w-16 h-16 mx-auto bg-[#22D3EE] border-[4px] border-black grid place-items-center shadow-[4px_4px_0px_0px_#000] -rotate-2"><Calendar className="w-8 h-8" /></div>
            <p className="mt-3 font-black uppercase tracking-tight text-lg">NO UPCOMING SLABS</p>
            <p className="font-mono text-xs font-black uppercase opacity-50">THE HORIZON IS CLEAR — GO BUILD</p>
          </div>
        ) : (
          upcomingTasks.map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={() => {}} onDelete={(t)=> setPendingDelete(t)} />)
        )}
      </div>
      {pendingDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={()=> setPendingDelete(null)} />
          <div className="relative w-full max-w-[420px] bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-5 animate-pop">
            <div className="bg-black text-[#FFE600] inline-block px-2 py-1 font-mono text-[10px] font-black tracking-[0.18em] border-[2px] border-black">⚠ CONFIRM DESTRUCTION</div>
            <h3 className="mt-3 font-black text-xl uppercase" style={{ fontFamily: 'Syne, sans-serif'}}>DELETE THIS SLAB?</h3>
            <div className="mt-2 bg-[#FFE600] border-[3px] border-black p-3"><p className="font-mono text-xs font-black uppercase break-words">“{pendingDelete.title}”</p></div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={()=> setPendingDelete(null)} className="bg-white border-[4px] border-black py-3 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000]">CANCEL</button>
              <button onClick={()=> deleteTask(pendingDelete)} className="bg-[#FF3B30] text-white border-[4px] border-black py-3 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000]">DELETE ✕</button>
            </div>
          </div>
        </div>
      )}
      {pendingDeleteAll && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={()=> setPendingDeleteAll(false)} />
          <div className="relative w-full max-w-[420px] bg-[#FF3B30] border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-5 animate-pop">
            <h3 className="font-black text-xl uppercase text-white" style={{ fontFamily: 'Syne, sans-serif'}}>NUKE ALL {upcomingTasks.length}?</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={()=> setPendingDeleteAll(false)} className="bg-white border-[4px] border-black py-3 font-black text-sm uppercase">CANCEL</button>
              <button onClick={async ()=> { if(!db) return; const b=writeBatch(db!); upcomingTasks.forEach(t=> b.delete(doc(db!, "tasks", t.id))); await b.commit(); setPendingDeleteAll(false); }} className="bg-black text-[#FFE600] border-[4px] border-black py-3 font-black text-sm uppercase">DELETE ALL ✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
