"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Task } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { Inbox as InboxIcon, Zap } from "lucide-react";

export default function InboxPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (user && db) {
      const q = query(collection(db!, "tasks"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksArray: Task[] = [];
        snapshot.forEach((doc) => tasksArray.push({ id: doc.id, ...doc.data() } as Task));
        tasksArray.sort((a,b)=> (b.order||0) - (a.order||0));
        setTasks(tasksArray);
      }, (err: any)=> {
        console.error("[inbox] firestore", err);
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
    if (!confirm(`Delete "${task.title}"?`)) return;
    await deleteDoc(doc(db!, "tasks", task.id));
  };

  const inboxTasks = tasks.filter(t => !t.scheduledDate && t.status === 'active');

  return (
    <div className="min-h-screen bg-[#FFE600] relative w-full overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 12px)` }} />
      <div className="bg-white border-b-[4px] border-black pl-14 md:pl-6 pr-3 sm:px-6 py-4 sm:py-6 shadow-[0px_4px_0px_0px_#000] relative">
        <h1 className="font-black text-[24px] sm:text-[32px] tracking-tighter uppercase flex flex-wrap items-center gap-2 sm:gap-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          <span className="h-10 w-10 sm:h-12 sm:w-12 bg-[#A78BFA] border-[4px] border-black grid place-items-center shadow-[4px_4px_0px_0px_#000] rotate-[-2deg] shrink-0"><InboxIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" /></span>
          INBOX
          <span className="bg-black text-[#FFE600] text-[11px] sm:text-xs px-2 sm:px-3 py-1 font-mono tracking-widest border-[3px] border-black">{inboxTasks.length} UNSORTED</span>
        </h1>
        <p className="mt-2 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest bg-[#FFE600] border-[3px] border-black inline-block px-2 py-1 shadow-[2px_2px_0px_0px_#000] max-w-full">CAPTURE EVERYTHING — SORT LATER — NO TASK LEFT</p>
      </div>
      <div className="bg-black text-[#FFE600] border-y-[4px] border-black overflow-hidden py-1.5">
        <div className="flex animate-brutal-marquee whitespace-nowrap font-black tracking-[0.18em] text-xs uppercase gap-8" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <span>◆ INBOX — ZERO FRICTION — DUMP IT HERE — SORT IT LATER — BRUTAL CAPTURE —</span>
          <span>◆ INBOX — ZERO FRICTION — DUMP IT HERE — SORT IT LATER — BRUTAL CAPTURE —</span>
          <span>◆ INBOX — ZERO FRICTION — DUMP IT HERE — SORT IT LATER — BRUTAL CAPTURE —</span>
        </div>
      </div>
      <div className="w-full max-w-[880px] mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-3">
        {inboxTasks.length > 0 && (
          <div className="flex justify-end">
            <button onClick={async ()=> { if(!db) return; if(!confirm(`Delete all ${inboxTasks.length} inbox tasks?`)) return; const b=writeBatch(db!); inboxTasks.forEach(t=> b.delete(doc(db!, "tasks", t.id))); await b.commit(); }} className="bg-[#FF3B30] text-white border-[3px] border-black px-3 py-1 font-black text-xs tracking-widest uppercase shadow-[3px_3px_0px_0px_#000]">DELETE ALL ✕</button>
          </div>
        )}
        {inboxTasks.length === 0 ? (
          <div className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-10 text-center">
            <div className="w-16 h-16 mx-auto bg-[#A78BFA] border-[4px] border-black grid place-items-center shadow-[4px_4px_0px_0px_#000] rotate-2"><InboxIcon className="w-8 h-8" /></div>
            <p className="mt-3 font-black uppercase tracking-tight text-lg">INBOX EMPTY</p>
            <p className="font-mono text-xs font-black uppercase opacity-50">NO UNSCHEDULED CHAOS — YOU&apos;RE CLEAN</p>
          </div>
        ) : (
          inboxTasks.map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={() => {}} onDelete={deleteTask} />)
        )}
      </div>
    </div>
  );
}
