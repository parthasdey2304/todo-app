"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Project, Task } from "@/types";
import { TaskCard } from "@/components/TaskCard";
import { Folder, Zap, Box, Plus, X, Trash2, Check, Clock, Flag, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";

const COLOR_OPTIONS = [
  { label: "YELLOW", value: "bg-[#FFE600]", hex: "#FFE600" },
  { label: "CYAN", value: "bg-[#22D3EE]", hex: "#22D3EE" },
  { label: "PURPLE", value: "bg-[#A78BFA]", hex: "#A78BFA" },
  { label: "RED", value: "bg-[#FF3B30] text-white", hex: "#FF3B30" },
  { label: "GREEN", value: "bg-[#22C55E]", hex: "#22C55E" },
  { label: "ORANGE", value: "bg-[#FF9A00]", hex: "#FF9A00" },
  { label: "PINK", value: "bg-[#FF6B9D]", hex: "#FF6B9D" },
  { label: "BLACK", value: "bg-black text-[#FFE600]", hex: "#000000" },
];

const ICON_OPTIONS = ["◆", "▓", "★", "●", "▲", "■", "⬢", "✦", "☻", "⚡"];

function projectTasksCount(tasks: Task[], project: Project) {
  return tasks.filter(t => (t.projectId && t.projectId === project.id) || (t.categoryId && t.categoryId === project.id) || (t.projectName && t.projectName === project.name) || (t.categoryName && t.categoryName === project.name)).length;
}
function filterTasksForProject(tasks: Task[], project: Project) {
  return tasks.filter(t => (t.projectId && t.projectId === project.id) || (t.categoryId && t.categoryId === project.id) || (t.projectName && t.projectName === project.name) || (t.categoryName && t.categoryName === project.name));
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const { brutalMode, accent } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].value);
  const [newIcon, setNewIcon] = useState(ICON_OPTIONS[0]);
  const [createError, setCreateError] = useState("");
  const [pendingDeleteProject, setPendingDeleteProject] = useState<Project | null>(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState("");
  const [panelPendingDelete, setPanelPendingDelete] = useState<Task | null>(null);

  // Subscribe projects
  useEffect(() => {
    if (!user || !db) { setLoading(false); return; }
    const q = query(collection(db!, "projects"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Project[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as Project));
      arr.sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.createdAt).localeCompare(String(b.createdAt)));
      // order by createdAt desc fallback if order equal
      if (arr.length === 0) {
        // keep sorted empty
      }
      setProjects(arr);
      setLoading(false);
    }, (err) => {
      console.error("[projects] firestore", err);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Subscribe tasks for counts
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db!, "tasks"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Task[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as Task));
      setTasks(arr);
    });
    return () => unsub();
  }, [user]);

  // keep selectedProject in sync if projects change (e.g. delete)
  useEffect(() => {
    if (selectedProject) {
      const fresh = projects.find(p => p.id === selectedProject.id);
      if (!fresh) setSelectedProject(null);
      else if (fresh.name !== selectedProject.name || fresh.color !== selectedProject.color) setSelectedProject(fresh);
    }
  }, [projects]);

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newName.trim();
    if (!name) { setCreateError("NAME REQUIRED — TYPE SOMETHING BRUTAL"); setTimeout(()=> setCreateError(""), 3000); return; }
    if (!user || !db) { setCreateError("Not logged in"); return; }
    if (projects.some(p => p.name.toLowerCase() === name.toLowerCase())) { setCreateError("SLAB ALREADY EXISTS"); setTimeout(()=> setCreateError(""), 3000); return; }
    try {
      await addDoc(collection(db!, "projects"), {
        userId: user.uid,
        name: name.toUpperCase(),
        color: newColor,
        icon: newIcon,
        order: Date.now(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewName("");
      setShowCreate(false);
      setCreateError("");
    } catch (err: any) { setCreateError(err.message); }
  };

  const handleDeleteProject = async (p: Project) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db!, "projects", p.id));
      // optionally keep tasks but clear project association? we leave tasks as-is (orphaned) — user can reassign later
      setPendingDeleteProject(null);
      if (selectedProject?.id === p.id) setSelectedProject(null);
    } catch (e: any) { setCreateError(e.message); }
  };

  const toggleTask = async (task: Task) => {
    if (!db) return;
    await updateDoc(doc(db!, "tasks", task.id), {
      status: task.status === 'completed' ? 'active' : 'completed',
      completedAt: task.status === 'completed' ? null : serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };
  const deleteTask = async (task: Task) => {
    if (!db) return;
    await deleteDoc(doc(db!, "tasks", task.id));
    setPanelPendingDelete(null);
  };
  const addTaskToProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = inlineTaskTitle.trim();
    if (!title || !user || !db || !selectedProject) return;
    await addDoc(collection(db!, "tasks"), {
      userId: user.uid,
      title,
      status: 'active',
      scheduledDate: format(new Date(), "yyyy-MM-dd"),
      priority: 'none',
      labels: [],
      attachments: [],
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      categoryId: selectedProject.id,
      categoryName: selectedProject.name,
      order: Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setInlineTaskTitle("");
  };

  const selectedTasks = selectedProject ? filterTasksForProject(tasks, selectedProject) : [];
  const selectedActive = selectedTasks.filter(t => t.status === 'active');
  const selectedDone = selectedTasks.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen relative w-full overflow-x-hidden" style={{ background: brutalMode ? "#0a0a0a" : accent }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 12px)` }} />

      {/* HEADER */}
      <div className="bg-white border-b-[4px] border-black pl-[72px] md:pl-6 pr-3 sm:px-6 py-4 sm:py-6 shadow-[0px_4px_0px_0px_#000]">
        <h1 className="font-black text-[24px] sm:text-[32px] tracking-tighter uppercase flex flex-wrap items-center gap-2 sm:gap-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          <span className="h-10 w-10 sm:h-12 sm:w-12 bg-[#FF3B30] border-[4px] border-black grid place-items-center text-white shadow-[4px_4px_0px_0px_#000] rotate-[-1deg] shrink-0"><Folder className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" /></span>
          PROJECTS
          <span className="bg-black text-white text-[11px] sm:text-xs px-2 sm:px-3 py-1 font-mono tracking-widest border-[3px] border-black">{projects.length} BOARDS</span>
          <button onClick={()=> setShowCreate(true)} className="ml-auto bg-black text-[#FFE600] border-[4px] border-black px-4 py-2 font-black text-xs sm:text-sm tracking-widest uppercase shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFE600] hover:text-black flex items-center gap-2 active:translate-x-[1px] active:translate-y-[1px]">
            <Plus className="w-4 h-4 stroke-[3]" /> NEW SLAB
          </button>
        </h1>
        <p className="mt-2 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest bg-[#FF3B30] text-white border-[3px] border-black inline-block px-2 py-1 shadow-[2px_2px_0px_0px_#000] max-w-full">CONCRETE BOARDS — EACH PROJECT IS A SLAB — CLICK TO OPEN</p>
      </div>

      <div className="bg-black text-[#FFE600] border-y-[4px] border-black overflow-hidden py-1.5">
        <div className="flex animate-brutal-marquee whitespace-nowrap font-black tracking-[0.18em] text-xs uppercase gap-8" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <span>◆ PROJECTS — BUILD IN PUBLIC — STACK YOUR SLABS — BRUTAL BOARDS —</span>
          <span>◆ PROJECTS — BUILD IN PUBLIC — STACK YOUR SLABS — BRUTAL BOARDS —</span>
          <span>◆ PROJECTS — BUILD IN PUBLIC — STACK YOUR SLABS — BRUTAL BOARDS —</span>
        </div>
      </div>

      <div className="w-full max-w-[880px] mx-auto px-3 sm:px-4 md:px-6 py-4">
        {loading ? (
          <div className="bg-white border-[4px] border-black p-8 text-center shadow-[6px_6px_0px_0px_#000] font-mono font-black text-xs tracking-widest">LOADING SLABS...</div>
        ) : projects.length === 0 ? (
          <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6 text-center animate-pop">
            <div className="w-16 h-16 mx-auto bg-[#FF3B30] border-[4px] border-black grid place-items-center shadow-[4px_4px_0px_0px_#000] rotate-2 text-white text-2xl">◆</div>
            <p className="mt-3 font-black uppercase tracking-tighter text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>NO PROJECTS YET</p>
            <p className="font-mono text-xs font-black uppercase opacity-60">CREATE YOUR FIRST CONCRETE SLAB</p>
            <button onClick={()=> setShowCreate(true)} className="mt-4 w-full bg-black text-[#FFE600] border-[4px] border-black py-3 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000]">CREATE FIRST SLAB — SLAM IT!</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p, i) => {
              const count = projectTasksCount(tasks, p);
              const done = filterTasksForProject(tasks, p).filter(t=> t.status==='completed').length;
              const pct = count ? Math.round((done / count) * 100) : 0;
              return (
                <button key={p.id} onClick={()=> setSelectedProject(p)} className={`text-left border-[4px] border-black p-6 shadow-[6px_6px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all ${p.color} ${i%2===0 ? 'rotate-[-0.4deg]' : 'rotate-[0.4deg]'} relative group`}>
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 bg-black text-white border-[3px] border-black grid place-items-center font-black text-xl shadow-[3px_3px_0px_0px_#000]">{p.icon}</div>
                    <span className="bg-white text-black border-[3px] border-black px-2 py-1 font-mono text-xs font-black">#{String(i+1).padStart(2,'0')}</span>
                  </div>
                  <h2 className="mt-4 font-black text-[22px] tracking-tighter uppercase truncate" style={{ fontFamily: 'Syne, sans-serif' }}>{p.name}</h2>
                  <p className="mt-1 font-mono text-xs font-black tracking-widest uppercase bg-black text-white inline-block px-2 py-1">{count} TASKS {count===0 ? '— EMPTY SLAB' : `— ${done} DONE`}</p>
                  <div className="mt-4 h-2 border-[3px] border-black bg-white flex overflow-hidden">
                    <div className="bg-black transition-all" style={{ width: `${pct}%` }} />
                    <div className="flex-1 bg-white" />
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-[10px] font-black">
                    <span>{pct}% BRUTAL</span>
                    <span className="bg-white border-[2px] border-black px-1 group-hover:bg-black group-hover:text-[#FFE600]">OPEN →</span>
                  </div>
                  {/* delete btn */}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e)=> { e.stopPropagation(); setPendingDeleteProject(p); }}
                    onKeyDown={(e)=> { if(e.key==='Enter' || e.key===' ') { e.stopPropagation(); setPendingDeleteProject(p); }}}
                    className="absolute top-2 right-12 bg-[#FF3B30] text-white border-[2px] border-black p-1 opacity-0 group-hover:opacity-100 hover:bg-black transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </span>
                </button>
              );
            })}
            {/* add card */}
            <button onClick={()=> setShowCreate(true)} className="border-[4px] border-black border-dashed bg-white p-6 shadow-[6px_6px_0px_0px_#000] hover:bg-[#FFE600] flex flex-col items-center justify-center min-h-[160px] rotate-[0.4deg] hover:rotate-0 transition-all">
              <div className="h-12 w-12 bg-black text-[#FFE600] border-[4px] border-black grid place-items-center shadow-[3px_3px_0px_0px_#000]"><Plus className="w-6 h-6 stroke-[3]" /></div>
              <span className="mt-3 font-black uppercase tracking-tighter" style={{ fontFamily: 'Syne, sans-serif' }}>NEW PROJECT</span>
              <span className="font-mono text-xs font-black uppercase bg-black text-white px-2 py-1 mt-1">SLAM ANOTHER SLAB</span>
            </button>
          </div>
        )}

        <div className="mt-6 bg-black text-[#FFE600] border-[4px] border-black p-4 flex items-center gap-3 shadow-[6px_6px_0px_0px_#000]">
          <Zap className="w-6 h-6 fill-[#FFE600]" />
          <span className="font-mono text-xs font-black tracking-[0.16em] uppercase">MORE PROJECTS COMING — STAY BRUTAL — KEEP STACKING</span>
          <Box className="w-5 h-5 ml-auto" />
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={()=> setShowCreate(false)} />
          <form onSubmit={handleCreate} className="relative w-full max-w-[480px] bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-5 animate-pop">
            <div className="absolute top-0 left-0 right-0 h-2 flex">
              <div className="flex-1 bg-[#FFE600] border-r-[2px] border-black" />
              <div className="flex-1 bg-[#22D3EE] border-r-[2px] border-black" />
              <div className="flex-1 bg-[#A78BFA] border-r-[2px] border-black" />
              <div className="flex-1 bg-[#FF3B30]" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="bg-black text-[#FFE600] inline-block px-2 py-1 font-mono text-[10px] font-black tracking-[0.18em] border-[2px] border-black">◆ NEW SLAB // CREATE PROJECT</div>
              <button type="button" onClick={()=> setShowCreate(false)} className="bg-white border-[3px] border-black p-1"><X className="w-4 h-4 stroke-[3]" /></button>
            </div>
            <h3 className="mt-3 font-black text-xl tracking-tighter uppercase" style={{ fontFamily: 'Syne, sans-serif' }}>NAME YOUR SLAB</h3>
            {createError && <div className="mt-2 bg-[#FF3B30] text-white border-[3px] border-black p-2 font-mono text-xs font-black uppercase">{createError}</div>}
            <input autoFocus value={newName} onChange={e=> setNewName(e.target.value)} placeholder="E.G. PERSONAL, WORK..." className="mt-3 w-full bg-[#FFFDE0] border-[4px] border-black px-3 py-3 font-black uppercase tracking-tight placeholder:text-black/40 focus:bg-[#FFE600] focus:outline-none shadow-[3px_3px_0px_0px_#000]" />
            <div className="mt-4">
              <p className="font-mono text-[10px] font-black tracking-widest uppercase">PICK COLOR</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button key={c.value} type="button" onClick={()=> setNewColor(c.value)} className={`h-10 border-[3px] border-black font-black text-[10px] tracking-widest uppercase shadow-[2px_2px_0px_0px_#000] ${c.value} ${newColor===c.value ? 'ring-4 ring-black ring-offset-2' : ''}`}>{c.label}</button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <p className="font-mono text-[10px] font-black tracking-widest uppercase">PICK ICON</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ICON_OPTIONS.map(ic => (
                  <button key={ic} type="button" onClick={()=> setNewIcon(ic)} className={`h-10 w-10 border-[3px] border-black font-black text-lg grid place-items-center shadow-[2px_2px_0px_0px_#000] ${newIcon===ic ? 'bg-black text-[#FFE600]' : 'bg-white text-black hover:bg-[#FFE600]'}`}>{ic}</button>
                ))}
              </div>
            </div>
            {/* preview */}
            <div className={`mt-4 border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_#000] flex items-center gap-3 ${newColor}`}>
              <div className="h-10 w-10 bg-black text-white border-[3px] border-black grid place-items-center font-black text-xl">{newIcon}</div>
              <span className="font-black text-lg tracking-tighter uppercase truncate" style={{ fontFamily: 'Syne, sans-serif' }}>{newName.trim() || "PREVIEW SLAB"}</span>
              <span className="ml-auto bg-white text-black border-[3px] border-black px-2 py-1 font-mono text-xs font-black">PREVIEW</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={()=> setShowCreate(false)} className="bg-white border-[4px] border-black py-3 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000]">CANCEL</button>
              <button type="submit" className="bg-black text-[#FFE600] border-[4px] border-black py-3 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFE600] hover:text-black">CREATE ✦ SLAM!</button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE PROJECT CONFIRM */}
      {pendingDeleteProject && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={()=> setPendingDeleteProject(null)} />
          <div className="relative w-full max-w-[420px] bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-5 animate-pop">
            <div className="bg-black text-[#FFE600] inline-block px-2 py-1 font-mono text-[10px] font-black tracking-[0.18em] border-[2px] border-black">⚠ DELETE SLAB</div>
            <h3 className="mt-3 font-black text-xl tracking-tighter uppercase" style={{ fontFamily: 'Syne, sans-serif' }}>NUKE “{pendingDeleteProject.name}”?</h3>
            <div className="mt-2 bg-[#FFE600] border-[3px] border-black p-3 shadow-[3px_3px_0px_0px_#000]">
              <p className="font-mono text-xs font-black uppercase">THIS WILL DELETE THE PROJECT. TASKS STAY BUT BECOME ORPHANED.</p>
              <p className="font-mono text-[11px] font-black mt-1 opacity-70">{projectTasksCount(tasks, pendingDeleteProject)} TASKS INSIDE</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={()=> setPendingDeleteProject(null)} className="bg-white border-[4px] border-black py-3 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000]">CANCEL</button>
              <button onClick={()=> handleDeleteProject(pendingDeleteProject)} className="bg-[#FF3B30] text-white border-[4px] border-black py-3 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000] hover:bg-black hover:text-[#FFE600]">DELETE ✕</button>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT DETAIL PANEL — SLIDE IN */}
      {selectedProject && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={()=> setSelectedProject(null)} />
          <div className="relative w-full max-w-[560px] h-full bg-[#FFE600] border-l-[4px] border-black shadow-[-8px_0px_0px_0px_#000] flex flex-col animate-pop overflow-hidden">
            {/* header */}
            <div className={`border-b-[4px] border-black p-4 sm:p-5 ${selectedProject.color} relative`}>
              <div className="absolute top-0 left-0 right-0 h-2 flex">
                <div className="flex-1 bg-black" />
                <div className="flex-1 bg-[#FFE600] border-x-[2px] border-black" />
                <div className="flex-1 bg-white" />
              </div>
              <div className="flex items-start justify-between gap-3 mt-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 bg-black text-white border-[4px] border-black grid place-items-center font-black text-2xl shadow-[3px_3px_0px_0px_#000] shrink-0">{selectedProject.icon}</div>
                  <div className="min-w-0">
                    <h2 className="font-black text-[24px] sm:text-[28px] tracking-tighter uppercase leading-none truncate" style={{ fontFamily: 'Syne, sans-serif' }}>{selectedProject.name}</h2>
                    <p className="font-mono text-[11px] font-black tracking-widest uppercase bg-black text-white inline-block px-2 py-0.5 mt-1">{selectedTasks.length} TASKS — {selectedActive.length} ACTIVE / {selectedDone.length} DONE</p>
                  </div>
                </div>
                <button onClick={()=> setSelectedProject(null)} className="bg-black text-[#FFE600] border-[3px] border-black p-2 shadow-[3px_3px_0px_0px_#000] hover:bg-white hover:text-black shrink-0">
                  <X className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
              {/* stats bar */}
              <div className="mt-4 flex items-center gap-2 font-mono text-[10px] font-black">
                <span className="bg-white border-[3px] border-black px-2 py-1">{selectedDone.length}/{selectedTasks.length} COMPLETED</span>
                <div className="flex-1 h-3 border-[3px] border-black bg-white flex overflow-hidden">
                  <div className="bg-black transition-all" style={{ width: `${selectedTasks.length ? (selectedDone.length/selectedTasks.length)*100 : 0}%` }} />
                </div>
                <span className="bg-black text-[#FFE600] border-[2px] border-black px-2 py-1">{selectedTasks.length ? Math.round(selectedDone.length/selectedTasks.length*100) : 0}%</span>
              </div>
              {/* quick add */}
              <form onSubmit={addTaskToProject} className="mt-4 flex gap-2">
                <input value={inlineTaskTitle} onChange={e=> setInlineTaskTitle(e.target.value)} placeholder="ADD TASK TO THIS SLAB..." className="flex-1 bg-white border-[3px] border-black px-3 py-2 font-black uppercase text-sm placeholder:text-black/40 focus:bg-[#FFFDE0] focus:outline-none shadow-[3px_3px_0px_0px_#000]" />
                <button type="submit" disabled={!inlineTaskTitle.trim()} className="bg-black text-[#FFE600] border-[3px] border-black px-4 font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000] disabled:opacity-50">ADD +</button>
              </form>
            </div>

            {/* tasks list */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#FFE600] relative">
              <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 12px)` }} />
              <div className="relative space-y-3">
                {selectedTasks.length === 0 ? (
                  <div className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-8 text-center">
                    <div className="w-14 h-14 mx-auto bg-[#FFE600] border-[4px] border-black grid place-items-center shadow-[3px_3px_0px_0px_#000] rotate-2"><Folder className="w-7 h-7" /></div>
                    <p className="mt-3 font-black uppercase tracking-tighter text-lg">EMPTY SLAB</p>
                    <p className="font-mono text-xs font-black uppercase opacity-60">NO TASKS IN THIS PROJECT — ADD ONE ABOVE</p>
                  </div>
                ) : (
                  <>
                    {selectedActive.length > 0 && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="bg-black text-[#FFE600] px-2 py-1 font-mono text-xs font-black tracking-widest border-[2px] border-black">ACTIVE — {selectedActive.length}</span>
                          <div className="h-[3px] flex-1 bg-black" />
                        </div>
                        {selectedActive.map(t => (
                          <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={() => {}} onDelete={(task)=> setPanelPendingDelete(task)} />
                        ))}
                      </>
                    )}
                    {selectedDone.length > 0 && (
                      <div className="pt-2">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="bg-[#22C55E] border-[3px] border-black px-2 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000]">COMPLETED — {selectedDone.length}</span>
                          <div className="h-[3px] flex-1 bg-black opacity-40" />
                        </div>
                        <div className="space-y-3 opacity-80">
                          {selectedDone.map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={() => {}} onDelete={(task)=> setPanelPendingDelete(task)} />)}
                        </div>
                      </div>
                    )}
                    {/* detailed data dump for brutal honesty — show full JSON style */}
                    <div className="bg-black text-[#FFE600] border-[3px] border-black p-3 font-mono text-[10px] leading-relaxed">
                      <p className="font-black tracking-widest">● PROJECT DATA DUMP // ALL FIELDS</p>
                      <p className="opacity-70">ID: {selectedProject.id}</p>
                      <p className="opacity-70">NAME: {selectedProject.name} • ICON: {selectedProject.icon} • COLOR: {selectedProject.color}</p>
                      <p className="opacity-70">TASKS: {selectedTasks.length} total — tap any card to toggle, trash to delete. Full task data (priority, dueAt, reminderAt, labels, attachments, scheduledDate, status) is visible on each card.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* footer */}
            <div className="border-t-[4px] border-black bg-white p-3 flex items-center gap-2">
              <button onClick={()=> setPendingDeleteProject(selectedProject)} className="bg-[#FF3B30] text-white border-[3px] border-black px-3 py-2 font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000] flex items-center gap-1"><Trash2 className="w-4 h-4" /> DELETE PROJECT</button>
              <button onClick={()=> setSelectedProject(null)} className="ml-auto bg-black text-[#FFE600] border-[3px] border-black px-4 py-2 font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000]">CLOSE ✕</button>
            </div>
          </div>
        </div>
      )}

      {/* PANEL DELETE TASK CONFIRM */}
      {panelPendingDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={()=> setPanelPendingDelete(null)} />
          <div className="relative w-full max-w-[420px] bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-5 animate-pop">
            <div className="bg-black text-[#FFE600] inline-block px-2 py-1 font-mono text-[10px] font-black tracking-[0.18em] border-[2px] border-black">⚠ CONFIRM DESTRUCTION</div>
            <h3 className="mt-3 font-black text-xl tracking-tighter uppercase" style={{ fontFamily: 'Syne, sans-serif'}}>DELETE THIS SLAB?</h3>
            <div className="mt-2 bg-[#FFE600] border-[3px] border-black p-3"><p className="font-mono text-xs font-black uppercase break-words">“{panelPendingDelete.title}”</p>
              <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px] font-black">
                {panelPendingDelete.priority !== 'none' && <span className="bg-black text-white px-1 border border-black">PRIO: {panelPendingDelete.priority}</span>}
                {panelPendingDelete.dueAt && <span className="bg-[#FF3B30] text-white px-1 border border-black">DUE: {format(new Date(panelPendingDelete.dueAt), "MMM d, h:mm a")}</span>}
                {panelPendingDelete.reminderAt && <span className="bg-[#22D3EE] px-1 border-[2px] border-black">REMINDER: {format(new Date(panelPendingDelete.reminderAt), "MMM d, h:mm a")}</span>}
                {panelPendingDelete.scheduledDate && <span className="bg-white border border-black px-1">DATE: {panelPendingDelete.scheduledDate}</span>}
                {panelPendingDelete.projectName && <span className="bg-[#A78BFA] border border-black px-1">PROJECT: {panelPendingDelete.projectName}</span>}
                <span className={`px-1 border border-black ${panelPendingDelete.status==='completed' ? 'bg-[#22C55E]' : 'bg-white'}`}>STATUS: {panelPendingDelete.status.toUpperCase()}</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={()=> setPanelPendingDelete(null)} className="bg-white border-[4px] border-black py-3 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000]">CANCEL</button>
              <button onClick={()=> deleteTask(panelPendingDelete)} className="bg-[#FF3B30] text-white border-[4px] border-black py-3 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000]">DELETE ✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
