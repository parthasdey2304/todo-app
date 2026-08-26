"use client";

import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface WeeklyDateSelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function WeeklyDateSelector({ selectedDate, onSelectDate }: WeeklyDateSelectorProps) {
  // Get the start of the week based on the selected date (default to Monday as start)
  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  return (
    <div className="flex items-center space-x-2 overflow-x-auto py-4 scrollbar-hide">
      {weekDays.map((date) => {
        const isSelected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, new Date());

        return (
          <button
            key={date.toISOString()}
            onClick={() => onSelectDate(date)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[60px] h-[72px] rounded-2xl transition-all duration-200 border",
              isSelected
                ? "bg-[#494bd6] border-[#494bd6] text-white shadow-lg shadow-[#494bd6]/20"
                : "bg-[#151E2E]/50 border-[#2e3544] text-[#98A6BD] hover:border-[#494bd6]/50 hover:bg-[#1E293B]"
            )}
          >
            <span className={cn("text-xs font-semibold uppercase tracking-wider mb-1", isSelected ? "text-white/80" : "")}>
              {format(date, "EEE")}
            </span>
            <span className={cn("text-xl font-bold", isSelected ? "text-white" : isToday ? "text-[#c0c1ff]" : "text-[#dce2f6]")}>
              {format(date, "d")}
            </span>
            {isToday && !isSelected && (
              <div className="w-1 h-1 rounded-full bg-[#494bd6] mt-1" />
            )}
          </button>
        );
      })}
    </div>
  );
}
