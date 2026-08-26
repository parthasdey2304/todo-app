"use client";

import { Task } from "@/types";
import { format } from "date-fns";
import { Check, Paperclip, MoreVertical, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onToggle: (task: Task) => void;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onToggle, onClick }: TaskCardProps) {
  const isCompleted = task.status === 'completed';

  const priorityColors = {
    none: "transparent",
    low: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    high: "text-orange-400 border-orange-400/30 bg-orange-400/10",
    urgent: "text-red-400 border-red-400/30 bg-red-400/10",
  };

  return (
    <div
      onClick={() => onClick(task)}
      className={cn(
        "group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer",
        isCompleted
          ? "bg-[#151E2E]/40 border-[#2e3544]/50 opacity-60"
          : "bg-[#151E2E] border-[#2e3544] hover:border-[#494bd6]/50 shadow-sm"
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task);
        }}
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-colors mt-0.5",
          isCompleted
            ? "bg-[#44e2cd] border-[#44e2cd]"
            : "border-[#98A6BD] hover:border-[#494bd6] group-hover:border-[#494bd6]/70"
        )}
      >
        {isCompleted && <Check className="w-4 h-4 text-[#003731] stroke-[3]" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3
            className={cn(
              "text-[16px] font-medium leading-tight truncate",
              isCompleted ? "line-through text-[#98A6BD]" : "text-[#dce2f6]"
            )}
          >
            {task.title}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {task.attachments?.length > 0 && (
              <Paperclip className="w-3.5 h-3.5 text-[#98A6BD]" />
            )}
            {task.dueAt && (
              <span className={cn(
                "flex items-center gap-1 text-xs font-medium",
                new Date(task.dueAt) < new Date() && !isCompleted ? "text-red-400" : "text-[#98A6BD]"
              )}>
                <Clock className="w-3 h-3" />
                {format(new Date(task.dueAt), "h:mm a")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {task.categoryName && (
            <span className="text-[#c0c1ff] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#494bd6]"></span>
              {task.categoryName}
            </span>
          )}
          
          {task.priority !== 'none' && (
            <span className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded border font-medium", priorityColors[task.priority])}>
              {task.priority === 'urgent' && <AlertCircle className="w-3 h-3" />}
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          )}
          
          {task.labels?.map((label, idx) => (
            <span key={idx} className="text-[#98A6BD] bg-[#1E293B] px-1.5 py-0.5 rounded">
              #{label}
            </span>
          ))}
        </div>
      </div>

      <button className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#98A6BD] hover:text-[#dce2f6] rounded-md hover:bg-[#2e3544]">
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
}
