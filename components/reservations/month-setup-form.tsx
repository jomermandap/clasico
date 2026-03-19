"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatMonthYear } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface WeekendEntry {
  label: string;
  date_start: string;
  outdoor_booths_available: boolean;
}

interface MonthSetupFormProps {
  monthYear: string;
  onComplete: () => void;
}

function addDaysIso(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isThursday(dateIso: string): boolean {
  const d = new Date(`${dateIso}T00:00:00`);
  return d.getDay() === 4;
}

export function MonthSetupForm({ monthYear, onComplete }: MonthSetupFormProps) {
  const [entries, setEntries] = useState<WeekendEntry[]>([
    { label: "Weekend 1", date_start: "", outdoor_booths_available: false },
    { label: "Weekend 2", date_start: "", outdoor_booths_available: false },
    { label: "Weekend 3", date_start: "", outdoor_booths_available: false },
    { label: "Weekend 4", date_start: "", outdoor_booths_available: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const hasFifth = entries.length === 5;

  const endDates = useMemo(() => {
    return entries.map((e) => (e.date_start ? addDaysIso(e.date_start, 3) : ""));
  }, [entries]);

  const setEntry = (index: number, patch: Partial<WeekendEntry>) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<number, string> = {};

    const dates = entries.map((e) => e.date_start).filter(Boolean);
    const duplicates = new Set<string>();
    const seen = new Set<string>();
    for (const d of dates) {
      if (seen.has(d)) duplicates.add(d);
      seen.add(d);
    }

    entries.forEach((e, idx) => {
      if (!e.date_start) {
        nextErrors[idx] = "Start date is required";
        return;
      }
      if (!isThursday(e.date_start)) {
        nextErrors[idx] = "Must be a Thursday";
        return;
      }
      if (duplicates.has(e.date_start)) {
        nextErrors[idx] = "Duplicate date";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    const supabase = createClient();

    const payload = entries.map((e) => ({
      month_year: monthYear,
      label: e.label.trim() || "Weekend",
      date_start: e.date_start,
      date_end: addDaysIso(e.date_start, 3),
      outdoor_booths_available: e.outdoor_booths_available,
      is_active: true,
    }));

    const { error } = await supabase.from("weekends").insert(payload);

    if (error) {
      toast.error("Failed to create weekends.");
      setLoading(false);
      return;
    }

    toast.success("Weekends created!");
    setLoading(false);
    onComplete();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">
          Set up {formatMonthYear(monthYear)}
        </h2>
        <p className="text-sm text-muted-foreground">
          Define the weekends for this month. Each weekend runs Thursday to
          Sunday.
        </p>
      </div>

      <div className="space-y-3">
        {entries.map((entry, idx) => {
          const endDate = endDates[idx];
          return (
            <Card key={idx} className="p-3">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Label</Label>
                  <Input
                    value={entry.label}
                    onChange={(e) =>
                      setEntry(idx, { label: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label>Start Date (Thursday)</Label>
                  <Input
                    type="date"
                    value={entry.date_start}
                    onChange={(e) =>
                      setEntry(idx, { date_start: e.target.value })
                    }
                  />
                  {entry.date_start && endDate && (
                    <p className="text-xs text-muted-foreground">
                      Thu {entry.date_start} - Sun {endDate}
                    </p>
                  )}
                  {errors[idx] && (
                    <p className="text-xs text-destructive">{errors[idx]}</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label>Outdoor Booths Available this weekend</Label>
                  </div>
                  <Switch
                    checked={entry.outdoor_booths_available}
                    onCheckedChange={(checked) =>
                      setEntry(idx, { outdoor_booths_available: checked })
                    }
                  />
                </div>
              </div>
            </Card>
          );
        })}

        {!hasFifth && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() =>
              setEntries((prev) => [
                ...prev,
                {
                  label: "Weekend 5",
                  date_start: "",
                  outdoor_booths_available: false,
                },
              ])
            }
          >
            + Add 5th Weekend
          </Button>
        )}
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={loading}
        onClick={() => void handleSubmit()}
      >
        {loading ? "Creating..." : "Create Weekends"}
      </Button>
    </div>
  );
}
