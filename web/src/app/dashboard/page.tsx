"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy, writeBatch } from "firebase/firestore";
import { Task } from "@/types";
import { WeeklyDateSelector } from "@/components/WeeklyDateSelector";
import { TaskCard } from "@/components/TaskCard";
import { format, isSameDay } from "date-fns";
import { Plus, Check, Mic, Calendar as CalendarIcon, Flag, Clock, CircleDot } from "lucide-react";

export default function DashboardToday() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hasEverHadTasks, setHasEverHadTasks] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Speech Recognition setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setNewTaskTitle(prev => prev + ' ' + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setNewTaskTitle("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "tasks"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksArray: Task[] = [];
        querySnapshot.forEach((doc) => tasksArray.push({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksArray);
        if (hasEverHadTasks === null) {
          setHasEverHadTasks(tasksArray.length > 0);
        } else if (tasksArray.length > 0 && !hasEverHadTasks) {
          setHasEverHadTasks(true);
        }
      });
      return () => unsubscribe();
    }
  }, [user, hasEverHadTasks]);

  if (loading || !user) return null;

  const filteredTasks = tasks.filter(task => {
    if (!task.scheduledDate) return false;
    return task.scheduledDate === format(selectedDate, "yyyy-MM-dd");
  });

  const activeTasks = filteredTasks.filter(t => t.status === 'active');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim() && user) {
      try {
        await addDoc(collection(db, "tasks"), {
          userId: user.uid,
          title: newTaskTitle.trim(),
          status: 'active',
          scheduledDate: format(selectedDate, "yyyy-MM-dd"),
          priority: 'none',
          labels: [],
          attachments: [],
          order: Date.now(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setNewTaskTitle("");
      } catch (error) {
        console.error("Error adding task: ", error);
      }
    }
  };

  const seedOnboardingTasks = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      const defaults = ["Organize the everyday chaos", "Focus on the right things", "Achieve goals and finish projects"];
      
      defaults.forEach((title, index) => {
        const docRef = doc(collection(db, "tasks"));
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
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTask = async (task: Task) => {
    const taskRef = doc(db, "tasks", task.id);
    await updateDoc(taskRef, {
      status: task.status === 'completed' ? 'active' : 'completed',
      completedAt: task.status === 'completed' ? null : serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#2e3544] bg-[#151E2E]/80 backdrop-blur-md">
        <h1 className="text-2xl font-semibold">Today</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#98A6BD] hidden sm:block">{user.email || user.phoneNumber}</span>
          <button onClick={() => signOut(auth)} className="rounded-lg bg-[#1E293B] px-4 py-2 text-sm font-semibold hover:bg-[#2e3544] transition-colors border border-[#2e3544]">
            Log out
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full relative">
        <WeeklyDateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />

        <div className="mt-8">
          <form onSubmit={addTask} className="relative group mb-8 bg-[#151E2E] border border-[#2e3544] rounded-xl focus-within:border-[#494bd6] transition-colors shadow-sm p-3">
            <div className="flex items-center gap-3 w-full">
              <Plus className="w-5 h-5 text-[#98A6BD] group-focus-within:text-[#494bd6] transition-colors flex-shrink-0" />
              <input
                type="text"
                placeholder={isListening ? "Listening..." : "Add a task for this day..."}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-transparent text-white focus:outline-none text-lg"
              />
              <button type="button" onClick={toggleListening} className={`p-2 rounded-full transition-colors flex-shrink-0 ${isListening ? 'bg-red-500/20 text-red-500' : 'text-[#98A6BD] hover:bg-[#1E293B] hover:text-[#dce2f6]'}`}>
                <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
              </button>
            </div>
            {/* Quick Action Pills (Image 2) */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs font-semibold whitespace-nowrap hover:bg-purple-500/20 transition-colors">
                <CalendarIcon className="w-3.5 h-3.5" />
                {format(selectedDate, "EEEE")}
              </button>
              <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2e3544] bg-[#1E293B] text-[#98A6BD] text-xs font-semibold whitespace-nowrap hover:border-[#494bd6]/50 transition-colors">
                <CircleDot className="w-3.5 h-3.5" />
                Deadline
              </button>
              <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold whitespace-nowrap hover:bg-red-500/20 transition-colors">
                <Flag className="w-3.5 h-3.5" />
                P1
              </button>
              <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2e3544] bg-[#1E293B] text-[#98A6BD] text-xs font-semibold whitespace-nowrap hover:border-[#494bd6]/50 transition-colors">
                <Clock className="w-3.5 h-3.5" />
                Reminders
              </button>
            </div>
          </form>

          {/* Voice Overlay (Image 3) */}
          {isListening && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0c1321]/90 backdrop-blur-sm rounded-xl">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">Listening...</h2>
                <p className="text-[#98A6BD] mb-8">Say everything you need to get done.</p>
                <div className="flex items-center gap-6 justify-center">
                  <button onClick={toggleListening} className="w-12 h-12 rounded-full bg-[#1E293B] flex items-center justify-center text-white hover:bg-[#2e3544]">
                    <div className="w-4 h-4 bg-current rounded-sm"></div> {/* Stop square */}
                  </button>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5,6,7,8,9,10].map(i => (
                      <div key={i} className="w-1.5 bg-red-500 rounded-full animate-pulse" style={{ height: `${Math.random() * 24 + 12}px`, animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                  </div>
                  <button onClick={addTask} className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 shadow-lg shadow-red-500/30">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {hasEverHadTasks === false ? (
              /* Welcome Onboarding Checklist (Image 5) */
              <div className="mt-8 border-t-2 border-red-500/80 pt-6 max-w-sm mx-auto">
                <h2 className="text-2xl font-bold mb-4">Welcome to Vastavik ToDo!</h2>
                <div className="bg-[#151E2E] border border-[#2e3544] rounded-xl p-5 shadow-lg">
                  <p className="text-[#98A6BD] text-sm mb-4 font-medium">Vastavik ToDo can help you...</p>
                  <ul className="space-y-4 mb-6">
                    <li className="flex items-center gap-3 text-[#dce2f6]"><Check className="w-5 h-5 text-green-400 bg-green-400/10 rounded-full p-0.5" /> Organize the everyday chaos</li>
                    <li className="flex items-center gap-3 text-[#dce2f6]"><Check className="w-5 h-5 text-green-400 bg-green-400/10 rounded-full p-0.5" /> Focus on the right things</li>
                    <li className="flex items-center gap-3 text-[#dce2f6]"><Check className="w-5 h-5 text-green-400 bg-green-400/10 rounded-full p-0.5" /> Achieve goals and finish projects</li>
                    <li className="flex items-center gap-3 text-[#98A6BD]"><div className="w-5 h-5 rounded-full border-2 border-[#98A6BD]"></div> Now it's your turn! ✨</li>
                  </ul>
                  <button onClick={seedOnboardingTasks} className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-lg shadow-red-600/20">
                    Let's go!
                  </button>
                </div>
              </div>
            ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
              <div className="text-center py-16 text-[#98A6BD]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1E293B] flex items-center justify-center">
                  <Check className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-lg font-medium text-[#dce2f6]">All caught up!</p>
                <p className="text-sm">No tasks scheduled for {format(selectedDate, "MMM d")}.</p>
              </div>
            ) : (
              <>
                {activeTasks.map(task => <TaskCard key={task.id} task={task} onToggle={toggleTask} onClick={() => {}} />)}
                {completedTasks.length > 0 && (
                  <div className="pt-6">
                    <h3 className="text-sm font-semibold text-[#98A6BD] uppercase tracking-wider mb-3">Completed</h3>
                    <div className="space-y-3">
                      {completedTasks.map(task => <TaskCard key={task.id} task={task} onToggle={toggleTask} onClick={() => {}} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
