"use client";

import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface WeeklyDateSelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function WeeklyDateSelector({ selectedDate, onSelectDate }: WeeklyDateSelectorProps) {
  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2 sm:py-3 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory scroll-p-1">
      {weekDays.map((date, idx) => {
        const isSelected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, new Date());
        const colors = ["bg-white","bg-[#FFE600]","bg-[#22D3EE]","bg-[#A78BFA]","bg-[#FF3B30]","bg-white","bg-[#FFE600]"];
        return (
          <button
            key={date.toISOString()}
            onClick={() => onSelectDate(date)}
            style={{ transform: `rotate(${isSelected ? -1.2 : idx%2===0 ? 0.6 : -0.6}deg)` }}
            className={cn(
              "snap-start flex flex-col items-center justify-center border-[3px] sm:border-[4px] border-black shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] transition-all flex-shrink-0 font-black hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000]",
              // responsive sizing: 46px mobile -> 66px desktop, crisp even
              "min-w-[46px] w-[46px] h-[62px] sm:min-w-[66px] sm:w-[66px] sm:h-[78px]",
              isSelected
                ? "bg-black text-[#FFE600] shadow-[4px_4px_0px_0px_#000] sm:shadow-[5px_5px_0px_0px_#000] scale-[1.03]"
                : `${colors[idx % colors.length]} text-black hover:brightness-110`
            )}
          >
            <span className="text-[8px] sm:text-[10px] tracking-[0.12em] sm:tracking-[0.18em] uppercase font-black" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {format(date, "EEE")}
            </span>
            <span className="text-[20px] sm:text-[26px] leading-none tracking-tighter font-black" style={{ fontFamily: 'Syne, Space Grotesk, sans-serif' }}>
              {format(date, "d")}
            </span>
            {isToday && !isSelected && (
              <span className="mt-0.5 sm:mt-1 bg-black text-[#FFE600] text-[6px] sm:text-[8px] px-1 py-0.5 font-black tracking-widest border border-black leading-none">TODAY</span>
            )}
            {isSelected && (
              <span className="mt-0.5 sm:mt-1 w-4 sm:w-5 h-0.5 sm:h-1 bg-[#FFE600] border border-white"></span>
            )}
          </button>
        );
      })}
    </div>
  );
}
