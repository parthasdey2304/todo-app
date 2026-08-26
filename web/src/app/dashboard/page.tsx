"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { Task, Priority } from "@/types";
import { WeeklyDateSelector } from "@/components/WeeklyDateSelector";
import { TaskCard } from "@/components/TaskCard";
import { format } from "date-fns";
import { Plus, Check, Mic, Calendar as CalendarIcon, Flag, Clock, CircleDot, Zap } from "lucide-react";

export default function DashboardToday() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hasEverHadTasks, setHasEverHadTasks] = useState<boolean | null>(null);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [firestoreError, setFirestoreError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [pendingDeleteAll, setPendingDeleteAll] = useState(false);

  // Functional pills state
  const [priority, setPriority] = useState<Priority>('none');
  const [dueAt, setDueAt] = useState<string | null>(null);
  const [reminderAt, setReminderAt] = useState<string | null>(null);
  const [mangaMode, setMangaMode] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Init SpeechRecognition with robust error handling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.maxAlternatives = 1;
      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setNewTaskTitle(prev => (prev + ' ' + finalTranscript).trim());
        }
      };
      rec.onend = () => setIsListening(false);
      rec.onerror = (e: any) => {
        setIsListening(false);
        const err = e?.error || 'unknown';
        if (err === 'not-allowed') setVoiceError('Mic permission denied. Enable microphone in browser.');
        else if (err === 'no-speech') setVoiceError('No speech detected. Try again.');
        else if (err !== 'aborted') setVoiceError(`Voice error: ${err}`);
        setTimeout(()=> setVoiceError(""), 4000);
      };
      rec.onstart = () => setVoiceError("");
      recognitionRef.current = rec;
    } catch (e:any) {
      console.error("Speech init failed", e);
      recognitionRef.current = null;
    }
  }, []);

  const toggleListening = () => {
    setVoiceError("");
    if (!recognitionRef.current) {
      setVoiceError("Voice not supported. Use Chrome/Edge over HTTPS.");
      setTimeout(()=> setVoiceError(""), 4000);
      return;
    }
    if (isListening) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    } else {
      // must be triggered by user gesture; wrap in try
      try {
        // iOS requires user gesture; we already have click gesture
        recognitionRef.current.start();
        setIsListening(true);
        setVoiceError("");
      } catch (e:any) {
        setVoiceError(e?.message || "Failed to start mic. Check HTTPS + permissions.");
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user && db) {
      setTasksLoading(true);
      // Avoid composite index while it is CREATING — query without orderBy, sort client-side
      const q = query(collection(db!, "tasks"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksArray: Task[] = [];
        querySnapshot.forEach((doc) => tasksArray.push({ id: doc.id, ...doc.data() } as Task));
        // client-side sort: newest first (order fallback)
        tasksArray.sort((a,b) => {
          const aTime = (a as any).createdAt?.seconds ? (a as any).createdAt.seconds*1000 : (a.order || 0);
          const bTime = (b as any).createdAt?.seconds ? (b as any).createdAt.seconds*1000 : (b.order || 0);
          if (typeof aTime === 'string') return String(b.createdAt).localeCompare(String(a.createdAt));
          return (bTime as number) - (aTime as number);
        });
        setTasks(tasksArray);
        if (hasEverHadTasks === null) setHasEverHadTasks(tasksArray.length > 0);
        else if (tasksArray.length > 0 && !hasEverHadTasks) setHasEverHadTasks(true);
        setTasksLoading(false);
        setFirestoreError(""); // clear index-building error if recovered
      }, (err: any)=> {
        console.error("[today] firestore", err);
        setTasksLoading(false);
        // If index building, show transient but don't block writes
        if (err?.message?.includes("index") && err?.message?.includes("building")) {
          setFirestoreError("Index building — tasks still save! Read will stabilize in 1-2 min. Posting works now.");
          setTimeout(()=> setFirestoreError(""), 5000);
        } else setFirestoreError(err.message);
      });
      return () => unsubscribe();
    } else if (!user && !loading) {
      setTasksLoading(false);
    }
  }, [user, hasEverHadTasks, loading]);

  if (loading || !user) return null;

  const filteredTasks = tasks.filter(task => task.scheduledDate === format(selectedDate, "yyyy-MM-dd"));
  const activeTasks = filteredTasks.filter(t => t.status === 'active');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const addTask = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title || !user) {
      if(!title) setFirestoreError("Type a task first!");
      setTimeout(()=> setFirestoreError(""), 3000);
      return;
    }
    if (!db) { setFirestoreError("Firestore not configured — check env"); return; }
    try {
      setFirestoreError("");
      // Build payload with functional fields — stored in Firestore
      const payload: any = {
        userId: user.uid,
        title,
        status: 'active',
        scheduledDate: format(selectedDate, "yyyy-MM-dd"),
        priority,
        labels: mangaMode ? ["manga"] : [],
        attachments: [],
        order: Date.now(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (dueAt) payload.dueAt = new Date(dueAt).toISOString();
      if (reminderAt) payload.reminderAt = new Date(reminderAt).toISOString();
      await addDoc(collection(db!, "tasks"), payload);
      setNewTaskTitle("");
      // keep date/priority for next task? reset for crisp UX
      // optional: keep priority/dates — we reset due/reminder only after success if you want
      // setDueAt(null); setReminderAt(null);
      setVoiceError("");
      if(isListening) {
        try{ recognitionRef.current?.stop(); }catch{}
        setIsListening(false);
      }
    } catch (error:any) {
      console.error("Add task Firestore error:", error);
      let msg = error?.message || "Failed to save";
      if(msg.includes("Missing or insufficient permissions")) msg = "Firestore permission denied — check you are logged in and Firestore rules allow your UID. Re-login.";
      if(msg.includes("Cloud Firestore API has not been used")) msg = "Firestore API still enabling — wait 30s and retry.";
      setFirestoreError(msg);
    }
  };

  const seedOnboardingTasks = async () => {
    if (!user || !db) return;
    try {
      const batch = writeBatch(db!);
      const defaults = ["Organize the everyday chaos", "Focus on the right things", "Achieve goals and finish projects"];
      defaults.forEach((title, index) => {
        const docRef = doc(collection(db!, "tasks"));
        batch.set(docRef, {
          userId: user.uid,
          title: title,
          status: 'active',
          scheduledDate: format(selectedDate, "yyyy-MM-dd"),
          priority: index === 1 ? 'high' : 'none',
          labels: [],
          attachments: [],
          order: Date.now() - index * 1000,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      setHasEverHadTasks(true);
    } catch (e:any) {
      setFirestoreError(e.message);
    }
  };

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
    try {
      await deleteDoc(doc(db!, "tasks", task.id));
      setPendingDelete(null);
    } catch(e:any){ setFirestoreError(e.message); }
  };

  const deleteAllVisible = async () => {
    if (!db || !user) return;
    const ids = [...activeTasks, ...completedTasks].map(t=>t.id);
    if (ids.length===0) return;
    try {
      const batch = writeBatch(db!);
      ids.forEach(id=> batch.delete(doc(db!, "tasks", id)));
      await batch.commit();
      setPendingDeleteAll(false);
    } catch(e:any){ setFirestoreError(e.message); }
  };

  const priorityCycle: Priority[] = ['none','low','medium','high','urgent'];
  const nextPriority = () => {
    const idx = priorityCycle.indexOf(priority);
    setPriority(priorityCycle[(idx+1)%priorityCycle.length]);
  };

  return (
    <div className="min-h-screen bg-[#FFE600] relative w-full overflow-x-hidden">
      {/* hash bg */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 12px)` }} />

      <header className="sticky top-0 z-10 bg-white border-b-[4px] border-black shadow-[0px_4px_0px_0px_#000] flex items-center justify-between gap-2 pl-14 md:pl-6 pr-3 sm:px-6 py-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h1 className="font-black text-[22px] sm:text-[30px] tracking-tighter uppercase flex items-center gap-2 shrink-0" style={{ fontFamily: 'Syne, sans-serif' }}>
            <span className="bg-black text-[#FFE600] px-2 py-0.5 border-[3px] border-black shadow-[3px_3px_0px_0px_#000] rotate-[-1deg] text-[20px] sm:text-[30px]">TODAY</span>
            <span className="hidden lg:inline text-sm font-mono font-black bg-[#FFE600] border-[3px] border-black px-2 py-1 tracking-widest">{format(selectedDate, "EEEE — MMM d, yyyy").toUpperCase()}</span>
          </h1>
          <span className="hidden xl:inline-flex bg-[#22D3EE] border-[3px] border-black px-2 py-1 font-mono text-[11px] font-black tracking-widest shadow-[2px_2px_0px_0px_#000] shrink-0">{activeTasks.length} ACTIVE / {completedTasks.length} DONE</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:block font-mono text-xs font-black bg-black text-[#FFE600] px-2 py-1 border-[2px] border-black truncate max-w-[160px]">{user.email || user.phoneNumber}</span>
          <button onClick={() => auth && signOut(auth)} className="bg-[#FF3B30] text-white border-[3px] sm:border-[4px] border-black px-3 sm:px-4 py-2 font-black text-xs tracking-widest uppercase shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] hover:bg-black hover:text-[#FFE600] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1 shrink-0">
            <span className="hidden sm:inline">LOG OUT</span><span className="sm:hidden">EXIT</span> ✕
          </button>
        </div>
      </header>

      <div className="bg-black text-[#FFE600] border-y-[4px] border-black overflow-hidden py-1.5">
        <div className="flex animate-brutal-marquee whitespace-nowrap font-black tracking-[0.18em] text-xs uppercase gap-8" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <span>◆ TODAY IS YOURS — MAKE IT BRUTAL — NO SOFT TASKS — ONLY CONCRETE — VASTAVIK TODO —</span>
          <span>◆ TODAY IS YOURS — MAKE IT BRUTAL — NO SOFT TASKS — ONLY CONCRETE — VASTAVIK TODO —</span>
          <span>◆ TODAY IS YOURS — MAKE IT BRUTAL — NO SOFT TASKS — ONLY CONCRETE — VASTAVIK TODO —</span>
        </div>
      </div>

      {/* CENTERED CONTENT */}
      <main className="relative w-full max-w-[880px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 flex flex-col gap-4">
        <div className="bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] p-2.5 sm:p-3">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-[#FFE600] px-2 py-1 font-mono text-[9px] sm:text-[10px] font-black tracking-[0.15em] sm:tracking-[0.2em] border-[2px] border-black">WEEK SELECTOR // PICK YOUR BATTLE</span>
            <span className="ml-auto font-mono text-[9px] sm:text-[10px] font-black bg-[#FFE600] border-[2px] border-black px-2 py-0.5">7 DAYS — 1 MISSION</span>
          </div>
          <WeeklyDateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>

        {/* ERRORS */}
        {(voiceError || firestoreError) && (
          <div className={`border-[4px] border-black p-3 font-black text-sm shadow-[4px_4px_0px_0px_#000] animate-shake ${firestoreError ? 'bg-[#FF3B30] text-white' : 'bg-[#FFE600] text-black'}`}>
            ⚠ {voiceError || firestoreError}
          </div>
        )}

        <form onSubmit={addTask} className="relative bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] p-2.5 sm:p-3">
          <div className="flex items-stretch gap-2 sm:gap-3 w-full">
            <div className="h-11 w-11 sm:h-10 sm:w-10 bg-black text-[#FFE600] border-[3px] border-black grid place-items-center shadow-[3px_3px_0px_0px_#000] shrink-0">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <input
              type="text"
              placeholder={isListening ? "● LISTENING..." : "ADD A TASK... MAKE IT LOUD!"}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e)=> { if(e.key==='Enter'){ e.preventDefault(); addTask(); } }}
              className="flex-1 min-w-0 bg-[#FFFDE0] sm:bg-[#FFE600]/20 border-[3px] border-black px-3 py-2.5 font-black uppercase tracking-tight placeholder:text-black/40 focus:bg-[#FFE600] focus:outline-none text-sm sm:text-base shadow-[3px_3px_0px_0px_#000] focus:shadow-[4px_4px_0px_0px_#000]"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            />
            <button type="button" onClick={toggleListening} className={`px-3 py-2 sm:p-3 border-[3px] sm:border-[4px] border-black shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] transition-all shrink-0 hover:rotate-1 ${isListening ? 'bg-[#FF3B30] text-white animate-pulse border-[#000]' : 'bg-white text-black hover:bg-black hover:text-[#FFE600]'}`} title={recognitionRef.current ? "Voice input" : "Voice not supported"}>
              <Mic className={`w-5 h-5 stroke-[2.5] ${isListening ? 'animate-pulse' : ''}`} />
            </button>
            <button type="submit" className="hidden md:flex bg-black text-[#FFE600] border-[4px] border-black px-5 py-3 font-black tracking-widest uppercase shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFE600] hover:text-black shrink-0 text-sm items-center disabled:opacity-50" disabled={!newTaskTitle.trim()}>ADD — SLAM!</button>
          </div>
          <button type="submit" disabled={!newTaskTitle.trim()} className="md:hidden mt-2 w-full bg-black text-[#FFE600] border-[3px] border-black py-2.5 font-black tracking-widest uppercase text-sm shadow-[3px_3px_0px_0px_#000] flex items-center justify-center gap-2 disabled:opacity-50">ADD — SLAM! <Zap className="w-4 h-4 fill-[#FFE600]" /></button>

          {/* FUNCTIONAL PILLS — image 1 reference */}
          <div className="mt-3 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 relative">
            {/* THU — shows selected day, non-clickable info */}
            <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border-[2px] sm:border-[3px] border-black bg-[#A78BFA] text-black text-[11px] sm:text-xs font-black whitespace-nowrap shadow-[2px_2px_0px_0px_#000]">
              <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              {format(selectedDate, "EEE").toUpperCase()}
            </span>

            {/* DEADLINE — dueAt picker */}
            <button type="button" onClick={()=> setShowDuePicker(v=>!v)} className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border-[2px] sm:border-[3px] border-black text-[11px] sm:text-xs font-black whitespace-nowrap shadow-[2px_2px_0px_0px_#000] transition-colors ${dueAt ? 'bg-[#FFE600] text-black' : 'bg-white text-black hover:bg-[#FFE600]'}`}>
              <CircleDot className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {dueAt ? format(new Date(dueAt), "MMM d, h:mm a") : "DEADLINE"}
            </button>

            {/* P1 / Priority — cycles urgent levels */}
            <div className="relative">
              <button type="button" onClick={()=> setShowPriorityPicker(v=>!v)} className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border-[2px] sm:border-[3px] border-black text-[11px] sm:text-xs font-black whitespace-nowrap shadow-[2px_2px_0px_0px_#000] ${priority==='urgent' ? 'bg-[#FF3B30] text-white' : priority==='high' ? 'bg-[#FF9A00] text-black' : priority!=='none' ? 'bg-[#FFE600] text-black' : 'bg-[#FF3B30] text-white'}`}>
                <Flag className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {priority==='none' ? 'P1' : priority.toUpperCase()}
              </button>
              {showPriorityPicker && (
                <div className="absolute z-20 top-full mt-2 left-0 bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-2 flex flex-col gap-1 min-w-[160px]">
                  {(['none','low','medium','high','urgent'] as Priority[]).map(p=>(
                    <button key={p} type="button" onClick={()=> { setPriority(p); setShowPriorityPicker(false); }} className={`text-left px-3 py-2 border-[3px] border-black font-black text-xs uppercase ${priority===p ? 'bg-black text-[#FFE600]' : 'bg-white hover:bg-[#FFE600]'}`}>{p}</button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={nextPriority} className={`hidden sm:flex items-center gap-1 px-2 py-1 text-[11px] font-black border-[3px] border-black ${priority==='urgent' ? 'bg-[#FF3B30] text-white' : 'bg-white text-black'}`}>— URGENT</button>

            {/* REMINDER */}
            <button type="button" onClick={()=> setShowReminderPicker(v=>!v)} className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border-[2px] sm:border-[3px] border-black text-[11px] sm:text-xs font-black whitespace-nowrap shadow-[2px_2px_0px_0px_#000] ${reminderAt ? 'bg-[#22D3EE] text-black' : 'bg-[#22D3EE] text-black hover:brightness-110'}`}>
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {reminderAt ? format(new Date(reminderAt), "h:mm a") : "REMINDER"}
            </button>

            {/* MANGA */}
            <button type="button" onClick={()=> setMangaMode(v=>!v)} className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border-[2px] sm:border-[3px] border-black text-[11px] sm:text-xs font-black whitespace-nowrap shadow-[2px_2px_0px_0px_#000] ${mangaMode ? 'bg-black text-[#FFE600]' : 'bg-[#FFE600] text-black hover:bg-black hover:text-[#FFE600]'}`}>
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" /> MANGA
            </button>
          </div>

          {/* DUE PICKER DROPDOWN */}
          {showDuePicker && (
            <div className="mt-3 bg-[#FFE600] border-[4px] border-black shadow-[4px_4px_0px_0px_#000] p-3 animate-pop">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-black text-[#FFE600] px-2 py-1 font-mono text-xs font-black tracking-widest">SET DEADLINE // DUE DATE + TIME</span>
                <button type="button" onClick={()=> setShowDuePicker(false)} className="bg-white border-[3px] border-black px-2 py-1 font-black text-xs">✕ CLOSE</button>
              </div>
              <input type="datetime-local" value={dueAt ? dueAt.slice(0,16) : ""} onChange={e=> setDueAt(e.target.value || null)} className="w-full bg-white border-[4px] border-black p-3 font-mono font-black text-sm shadow-[3px_3px_0px_0px_#000] focus:outline-none" />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={()=> { setDueAt(null); setShowDuePicker(false); }} className="flex-1 bg-white border-[3px] border-black py-2 font-black text-xs uppercase">CLEAR</button>
                <button type="button" onClick={()=> setShowDuePicker(false)} className="flex-1 bg-black text-[#FFE600] border-[3px] border-black py-2 font-black text-xs uppercase">DONE ✓</button>
              </div>
            </div>
          )}
          {showReminderPicker && (
            <div className="mt-3 bg-[#22D3EE] border-[4px] border-black shadow-[4px_4px_0px_0px_#000] p-3 animate-pop">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-black text-white px-2 py-1 font-mono text-xs font-black tracking-widest">SET REMINDER // WHEN TO NUDGE</span>
                <button type="button" onClick={()=> setShowReminderPicker(false)} className="bg-white border-[3px] border-black px-2 py-1 font-black text-xs">✕ CLOSE</button>
              </div>
              <input type="datetime-local" value={reminderAt ? reminderAt.slice(0,16) : ""} onChange={e=> setReminderAt(e.target.value || null)} className="w-full bg-white border-[4px] border-black p-3 font-mono font-black text-sm shadow-[3px_3px_0px_0px_#000] focus:outline-none" />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={()=> { setReminderAt(null); setShowReminderPicker(false); }} className="flex-1 bg-white border-[3px] border-black py-2 font-black text-xs uppercase">CLEAR</button>
                <button type="button" onClick={()=> setShowReminderPicker(false)} className="flex-1 bg-black text-white border-[3px] border-black py-2 font-black text-xs uppercase">DONE ✓</button>
              </div>
            </div>
          )}
        </form>

        {isListening && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFE600]/90 backdrop-blur-[2px] p-4 animate-pop" onClick={()=> { try{ recognitionRef.current?.stop(); }catch{}; setIsListening(false); }}>
            <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6 sm:p-8 text-center max-w-md w-full rotate-[-0.6deg]" onClick={e=> e.stopPropagation()}>
              <div className="bg-black text-[#FFE600] inline-block px-3 py-1 font-mono text-xs font-black tracking-[0.2em] border-[2px] border-black">● REC — LISTENING</div>
              <h2 className="mt-3 font-black text-3xl tracking-tighter uppercase" style={{ fontFamily: 'Syne, sans-serif' }}>SHOUT IT!<span className="bg-[#FF3B30] text-white px-2 ml-2 border-[3px] border-black inline-block rotate-[1deg]">LOUD!</span></h2>
              <p className="mt-2 font-mono text-xs font-black uppercase tracking-widest opacity-60">SAY EVERYTHING YOU NEED TO GET DONE.</p>
              <p className="mt-1 font-mono text-[10px] font-black bg-[#FFFDE0] border border-black inline-block px-2 py-1 truncate max-w-full">{newTaskTitle || "Listening..."}</p>
              <div className="mt-6 flex items-center gap-4 justify-center">
                <button type="button" onClick={toggleListening} className="w-14 h-14 bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_#000] grid place-items-center hover:bg-black hover:text-white transition-colors" title="Stop">
                  <div className="w-5 h-5 bg-current border-2 border-black"></div>
                </button>
                <div className="flex items-end gap-1 h-10">
                  {[1,2,3,4,5,6,7,8,9,10].map(i => (
                    <div key={i} className="w-1.5 bg-[#FF3B30] border border-black animate-pulse" style={{ height: `${12 + (i%5)*5}px`, animationDelay: `${i * 0.08}s` }}></div>
                  ))}
                </div>
                <button type="button" onClick={()=> addTask()} className="w-14 h-14 bg-[#FF3B30] border-[4px] border-black shadow-[4px_4px_0px_0px_#000] grid place-items-center text-white hover:bg-black hover:text-[#FFE600] transition-colors" title="Save">
                  <Check className="w-7 h-7 stroke-[3]" />
                </button>
              </div>
              <div className="mt-4 font-mono text-[10px] font-black bg-[#FFE600] border-[2px] border-black px-2 py-1 inline-block">TAP ■ TO STOP • TAP ✓ TO SLAM TASK</div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {tasksLoading ? (
            <div className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 10px)` }} />
              <div className="absolute top-0 left-0 right-0 h-2 flex">
                <div className="flex-1 bg-[#FFE600] border-r-[2px] border-black animate-pulse" />
                <div className="flex-1 bg-[#22D3EE] border-r-[2px] border-black animate-pulse" style={{ animationDelay: '150ms'}} />
                <div className="flex-1 bg-[#A78BFA] border-r-[2px] border-black animate-pulse" style={{ animationDelay: '300ms'}} />
                <div className="flex-1 bg-[#FF3B30] animate-pulse" style={{ animationDelay: '450ms'}} />
              </div>
              <div className="relative text-center pt-3">
                <div className="inline-flex items-center gap-2 bg-black text-[#FFE600] px-3 py-1 font-mono text-[10px] font-black tracking-[0.18em] border-[2px] border-black">
                  <span className="h-2 w-2 bg-[#FFE600] animate-pulse" /> PULLING SLABS FROM THE VOID —
                  FIRESTORE SYNC
                </div>
                <h3 className="mt-3 font-black text-xl sm:text-2xl tracking-tighter uppercase flex items-center justify-center gap-2" style={{ fontFamily: 'Syne, sans-serif'}}>
                  <span className="bg-[#FFE600] border-[4px] border-black px-2 py-1 shadow-[4px_4px_0px_0px_#000] rotate-[-0.8deg]">DOWN</span>
                  <span className="bg-[#22D3EE] border-[4px] border-black px-2 py-1 shadow-[4px_4px_0px_0px_#000] rotate-[0.8deg]">LOADING</span>
                  <span className="bg-[#A78BFA] border-[4px] border-black px-2 py-1 shadow-[4px_4px_0px_0px_#000] rotate-[-0.5deg]">!!!</span>
                </h3>
                <p className="mt-2 font-mono text-xs font-black uppercase tracking-widest opacity-60">FETCHING YOUR CHAOS FROM THE DATABASE...</p>
                {/* funky loader — not circular: staggered brutal blocks */}
                <div className="mt-5 flex items-end justify-center gap-1.5 h-12">
                  <div className="w-3 bg-black border-[2px] border-black animate-[brutal-bar_600ms_ease-in-out_infinite]" style={{ height: '18px', animationDelay: '0ms'}} />
                  <div className="w-4 bg-[#FFE600] border-[3px] border-black animate-[brutal-bar_600ms_ease-in-out_infinite]" style={{ height: '36px', animationDelay: '90ms'}} />
                  <div className="w-3 bg-[#22D3EE] border-[2px] border-black animate-[brutal-bar_600ms_ease-in-out_infinite]" style={{ height: '24px', animationDelay: '180ms'}} />
                  <div className="w-5 bg-[#FF3B30] border-[3px] border-black animate-[brutal-bar_600ms_ease-in-out_infinite]" style={{ height: '42px', animationDelay: '270ms'}} />
                  <div className="w-3 bg-[#A78BFA] border-[2px] border-black animate-[brutal-bar_600ms_ease-in-out_infinite]" style={{ height: '20px', animationDelay: '360ms'}} />
                  <div className="w-4 bg-black border-[3px] border-white animate-[brutal-bar_600ms_ease-in-out_infinite]" style={{ height: '30px', animationDelay: '450ms'}} />
                </div>
                <div className="mt-4 flex justify-center gap-1">
                  <div className="h-1.5 w-8 bg-black animate-pulse" />
                  <div className="h-1.5 w-8 bg-[#FFE600] border border-black animate-pulse" style={{ animationDelay: '200ms'}} />
                  <div className="h-1.5 w-8 bg-[#22D3EE] border border-black animate-pulse" style={{ animationDelay: '400ms'}} />
                </div>
                <p className="mt-3 font-mono text-[10px] font-black tracking-[0.15em] uppercase bg-[#FFE600] border-[2px] border-black inline-block px-2 py-1">HOLD TIGHT — CONCRETE IS SETTING</p>
              </div>
              <style>{`@keyframes brutal-bar { 0%,100% { transform: scaleY(0.6)} 50% { transform: scaleY(1.35)} }`}</style>
            </div>
          ) : hasEverHadTasks === false ? (
            <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-5 sm:p-6 animate-slam">
              <div className="bg-[#FF3B30] text-white border-[4px] border-black inline-block px-3 py-1 font-black tracking-widest uppercase shadow-[4px_4px_0px_0px_#000] rotate-[-0.6deg]">WELCOME TO VASTAVIK TODO!</div>
              <div className="mt-4 bg-[#FFE600] border-[4px] border-black p-5 shadow-[6px_6px_0px_0px_#000]">
                <p className="font-mono text-xs font-black tracking-[0.14em] uppercase">VASTAVIK CAN HELP YOU...</p>
                <ul className="mt-4 space-y-3 font-black uppercase tracking-tight">
                  <li className="flex items-center gap-3 bg-white border-[3px] border-black p-2 shadow-[3px_3px_0px_0px_#000]"><span className="h-7 w-7 bg-[#22C55E] border-[3px] border-black grid place-items-center text-white"><Check className="w-4 h-4 stroke-[3]" /></span> ORGANIZE THE EVERYDAY CHAOS</li>
                  <li className="flex items-center gap-3 bg-white border-[3px] border-black p-2 shadow-[3px_3px_0px_0px_#000]"><span className="h-7 w-7 bg-[#22C55E] border-[3px] border-black grid place-items-center text-white"><Check className="w-4 h-4 stroke-[3]" /></span> FOCUS ON THE RIGHT THINGS</li>
                  <li className="flex items-center gap-3 bg-white border-[3px] border-black p-2 shadow-[3px_3px_0px_0px_#000]"><span className="h-7 w-7 bg-[#22C55E] border-[3px] border-black grid place-items-center text-white"><Check className="w-4 h-4 stroke-[3]" /></span> ACHIEVE GOALS & FINISH PROJECTS</li>
                  <li className="flex items-center gap-3 bg-black text-white border-[3px] border-black p-2 shadow-[3px_3px_0px_0px_#000]"><span className="h-7 w-7 bg-white border-[3px] border-black grid place-items-center text-black font-black">✦</span> NOW IT&apos;S YOUR TURN! <span className="ml-auto bg-[#FFE600] text-black px-2 py-0.5 text-xs border border-white">LET&apos;S GO</span></li>
                </ul>
                <button onClick={seedOnboardingTasks} className="mt-5 w-full py-3 bg-[#FF3B30] border-[4px] border-black font-black uppercase tracking-[0.14em] text-white shadow-[5px_5px_0px_0px_#000] hover:bg-black hover:text-[#FFE600] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">LET&apos;S GO — SLAM IT! →</button>
              </div>
            </div>
          ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-6 sm:p-10 text-center animate-pop">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-[#FFE600] border-[4px] border-black grid place-items-center shadow-[4px_4px_0px_0px_#000] rotate-[-2deg]">
                <Check className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3]" />
              </div>
              <p className="mt-4 font-black text-xl sm:text-2xl uppercase tracking-tighter" style={{ fontFamily: 'Syne, sans-serif' }}>ALL CAUGHT UP!</p>
              <p className="font-mono text-[11px] sm:text-xs font-black tracking-widest uppercase opacity-60 px-2">NO TASKS FOR {format(selectedDate, "MMM d").toUpperCase()} — GO MAKE SOME NOISE.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-black text-[#FFE600] px-3 py-1 font-mono text-xs font-black tracking-[0.16em] border-[3px] border-black">ACTIVE — {activeTasks.length}</span>
                <div className="h-[4px] flex-1 bg-black min-w-[40px]" />
                <span className="bg-[#FFE600] border-[3px] border-black px-2 py-1 font-mono text-[10px] font-black">{format(selectedDate, "yyyy-MM-dd").toUpperCase()}</span>
                {(activeTasks.length + completedTasks.length > 0) && (
                  <button onClick={()=> setPendingDeleteAll(true)} className="ml-auto bg-[#FF3B30] text-white border-[3px] border-black px-3 py-1 font-black text-xs tracking-widest uppercase shadow-[3px_3px_0px_0px_#000] hover:bg-black hover:text-[#FFE600]">DELETE ALL ({activeTasks.length + completedTasks.length}) ✕</button>
                )}
              </div>
              {activeTasks.map(task => <TaskCard key={task.id} task={task} onToggle={toggleTask} onClick={() => {}} onDelete={(t)=> setPendingDelete(t)} />)}
              {completedTasks.length > 0 && (
                <div className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="bg-[#22C55E] border-[3px] border-black px-3 py-1 font-black uppercase tracking-widest text-sm shadow-[3px_3px_0px_0px_#000]">COMPLETED — {completedTasks.length}</h3>
                    <div className="h-[3px] flex-1 bg-black opacity-40" />
                  </div>
                  <div className="space-y-3 opacity-90">
                    {completedTasks.map(task => <TaskCard key={task.id} task={task} onToggle={toggleTask} onClick={() => {}} onDelete={(t)=> setPendingDelete(t)} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* BRUTAL DELETE MODAL — on-screen, not browser confirm */}
      {pendingDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={()=> setPendingDelete(null)} />
          <div className="relative w-full max-w-[420px] bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-5 animate-pop">
            <div className="absolute top-0 left-0 right-0 h-2 flex">
              <div className="flex-1 bg-[#FF3B30] border-r-[2px] border-black" />
              <div className="flex-1 bg-black" />
              <div className="flex-1 bg-[#FFE600] border-l-[2px] border-black" />
            </div>
            <div className="bg-black text-[#FFE600] inline-block px-2 py-1 font-mono text-[10px] font-black tracking-[0.18em] border-[2px] border-black mt-2">⚠ CONFIRM DESTRUCTION</div>
            <h3 className="mt-3 font-black text-xl tracking-tighter uppercase" style={{ fontFamily: 'Syne, sans-serif'}}>DELETE THIS SLAB?</h3>
            <div className="mt-2 bg-[#FFE600] border-[3px] border-black p-3 shadow-[3px_3px_0px_0px_#000]">
              <p className="font-mono text-xs font-black uppercase tracking-wide break-words">“{pendingDelete.title}”</p>
              <p className="font-mono text-[10px] font-black uppercase opacity-60 mt-1">THIS WILL VAPORIZE THE TASK FROM FIRESTORE. NO UNDO.</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={()=> setPendingDelete(null)} className="bg-white text-black border-[4px] border-black py-3 font-black text-sm tracking-widest uppercase shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFE600]">CANCEL</button>
              <button onClick={()=> deleteTask(pendingDelete)} className="bg-[#FF3B30] text-white border-[4px] border-black py-3 font-black text-sm tracking-widest uppercase shadow-[4px_4px_0px_0px_#000] hover:bg-black hover:text-[#FFE600]">DELETE ✕</button>
            </div>
          </div>
        </div>
      )}
      {pendingDeleteAll && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={()=> setPendingDeleteAll(false)} />
          <div className="relative w-full max-w-[420px] bg-[#FF3B30] border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-5 animate-pop">
            <div className="bg-black text-white inline-block px-2 py-1 font-mono text-[10px] font-black tracking-[0.18em] border-[2px] border-black">☠ MASS DESTRUCTION</div>
            <h3 className="mt-3 font-black text-xl tracking-tighter uppercase text-white" style={{ fontFamily: 'Syne, sans-serif'}}>NUKE ALL {activeTasks.length + completedTasks.length} SLABS?</h3>
            <p className="mt-2 font-mono text-xs font-black uppercase bg-white border-[3px] border-black p-2">FOR {format(selectedDate, "MMM d").toUpperCase()} — THIS WIPES FIRESTORE. NO UNDO.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={()=> setPendingDeleteAll(false)} className="bg-white text-black border-[4px] border-black py-3 font-black text-sm tracking-widest uppercase shadow-[4px_4px_0px_0px_#000]">CANCEL</button>
              <button onClick={deleteAllVisible} className="bg-black text-[#FFE600] border-[4px] border-black py-3 font-black text-sm tracking-widest uppercase shadow-[4px_4px_0px_0px_#000]">DELETE ALL ✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
