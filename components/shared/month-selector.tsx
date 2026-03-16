"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthYear } from "@/lib/utils";

interface MonthSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const [year, month] = value.split("-").map((part) => parseInt(part, 10));
  const current = new Date(year, month - 1, 1);

  const changeMonth = (delta: number) => {
    const next = new Date(current);
    next.setMonth(current.getMonth() + delta);
    const nextYear = next.getFullYear();
    const nextMonth = String(next.getMonth() + 1).padStart(2, "0");
    onChange(`${nextYear}-${nextMonth}`);
  };

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-11 w-11"
        onClick={() => changeMonth(-1)}
      >
        <ChevronLeft className="h-5 w-5" />
        <span className="sr-only">Previous month</span>
      </Button>
      <div className="flex-1 text-center text-sm font-medium">
        {formatMonthYear(value)}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-11 w-11"
        onClick={() => changeMonth(1)}
      >
        <ChevronRight className="h-5 w-5" />
        <span className="sr-only">Next month</span>
      </Button>
    </div>
  );
}

