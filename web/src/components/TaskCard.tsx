"use client";

import { Task } from "@/types";
import { format } from "date-fns";
import { Check, Paperclip, AlertCircle, Clock, Zap, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onToggle: (task: Task) => void;
  onClick: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export function TaskCard({ task, onToggle, onClick, onDelete }: TaskCardProps) {
  const isCompleted = task.status === 'completed';

  const priorityStyles: Record<string, string> = {
    none: "bg-white text-black border-black",
    low: "bg-[#22D3EE] text-black border-black",
    medium: "bg-[#FFE600] text-black border-black",
    high: "bg-[#FF9A00] text-black border-black",
    urgent: "bg-[#FF3B30] text-white border-black",
  };

  return (
    <div
      onClick={() => onClick(task)}
      style={{ transform: `rotate(${isCompleted ? 0 : (task.order % 3 -1)*0.4}deg)` }}
      className={cn(
        "group relative flex items-start gap-4 p-4 border-[4px] border-black shadow-[6px_6px_0px_0px_#000] cursor-pointer animate-pop transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]",
        isCompleted
          ? "bg-white opacity-60 grayscale-[0.3]"
          : "bg-white hover:bg-[#FFE600]/20"
      )}
    >
      {/* halftone top strip */}
      {!isCompleted && (
        <div className="absolute top-0 left-0 right-0 h-[6px] bg-black flex">
          <div className="flex-1 bg-[#FFE600] border-r-[2px] border-black" />
          <div className="flex-1 bg-[#22D3EE] border-r-[2px] border-black" />
          <div className="flex-1 bg-[#A78BFA]" />
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task);
        }}
        className={cn(
          "flex-shrink-0 w-9 h-9 border-[3px] border-black flex items-center justify-center font-black text-lg mt-1 shadow-[3px_3px_0px_0px_#000] transition-all hover:shadow-[4px_4px_0px_0px_#000] active:shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]",
          isCompleted
            ? "bg-[#FFE600] text-black"
            : "bg-white text-black hover:bg-black hover:text-[#FFE600] hover:rotate-[-3deg]"
        )}
      >
        {isCompleted ? <Check className="w-5 h-5 stroke-[4]" /> : <span className="font-mono text-xl leading-none">✓</span>}
      </button>

      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "font-black uppercase tracking-tighter leading-none text-[18px] sm:text-[20px]",
              isCompleted ? "line-through decoration-[4px] decoration-black text-black/60" : "text-black"
            )}
            style={{ fontFamily: 'var(--font-syne), Space Grotesk, sans-serif' }}
          >
            {task.title}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {task.attachments?.length > 0 && (
              <span className="bg-black text-white border-[2px] border-black p-1">
                <Paperclip className="w-3.5 h-3.5" />
              </span>
            )}
            {task.dueAt && (
              <span className={cn(
                "flex items-center gap-1 text-[11px] font-black px-2 py-1 border-[2px] border-black tracking-widest",
                new Date(task.dueAt) < new Date() && !isCompleted ? "bg-[#FF3B30] text-white animate-jitter" : "bg-[#FFE600] text-black"
              )} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                <Clock className="w-3 h-3" />
                {format(new Date(task.dueAt), "h:mm a")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {task.categoryName && (
            <span className="bg-black text-[#FFE600] border-[3px] border-black px-2 py-1 font-black text-[11px] tracking-[0.12em] uppercase flex items-center gap-1">
              <span className="w-2 h-2 bg-[#FFE600] border border-white"></span>
              {task.categoryName}
            </span>
          )}
          
          {task.priority !== 'none' && (
            <span className={cn("flex items-center gap-1 px-2 py-1 border-[3px] font-black text-[11px] tracking-widest uppercase shadow-[2px_2px_0px_0px_#000]", priorityStyles[task.priority])} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {task.priority === 'urgent' && <Zap className="w-3 h-3 fill-current" />}
              {task.priority === 'urgent' && <AlertCircle className="w-3 h-3" />}
              {task.priority}
            </span>
          )}
          
          {task.labels?.map((label, idx) => (
            <span key={idx} className="bg-[#A78BFA] text-black border-[3px] border-black px-2 py-0.5 font-black text-[11px] tracking-widest uppercase">
              #{label}
            </span>
          ))}
          {!isCompleted && <span className="ml-auto font-mono text-[10px] font-black bg-white border-[2px] border-black px-1">#{String(task.order).slice(-4)}</span>}
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center gap-1.5">
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            className="bg-[#FF3B30] text-white border-[3px] border-black p-1.5 shadow-[3px_3px_0px_0px_#000] hover:bg-black hover:text-[#FFE600] hover:rotate-3 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
        <span className="hidden sm:inline-flex bg-white border-[3px] border-black p-1.5 shadow-[3px_3px_0px_0px_#000] opacity-0 group-hover:opacity-100 transition-all">
          <span className="font-mono text-[9px] font-black">#DEL</span>
        </span>
      </div>
    </div>
  );
}
