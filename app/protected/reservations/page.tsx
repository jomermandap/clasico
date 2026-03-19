"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Weekend } from "@/lib/types";
import { formatMonthYear, getCurrentMonthYear } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { MonthSelector } from "@/components/shared/month-selector";
import { MonthSetupForm } from "@/components/reservations/month-setup-form";
import { WeekendCard } from "@/components/reservations/weekend-card";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReservationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMonth = useMemo(() => {
    const fromUrl = searchParams.get("month");
    return fromUrl && /^\d{4}-\d{2}$/.test(fromUrl)
      ? fromUrl
      : getCurrentMonthYear();
  }, [searchParams]);

  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [weekends, setWeekends] = useState<Weekend[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    router.replace(`/protected/reservations?month=${selectedMonth}`);
  }, [router, selectedMonth]);

  const fetchWeekends = async (monthYear: string) => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("weekends")
      .select("*")
      .eq("month_year", monthYear)
      .order("date_start", { ascending: true });

    if (error) {
      setWeekends([]);
      setCounts({});
      setLoading(false);
      return;
    }

    const list = (data as Weekend[]) ?? [];
    setWeekends(list);

    const nextCounts: Record<string, number> = {};

    await Promise.all(
      list.map(async (w) => {
        const { count } = await supabase
          .from("weekend_attendances")
          .select("id", { count: "exact", head: true })
          .eq("weekend_id", w.id);
        nextCounts[w.id] = count ?? 0;
      }),
    );

    setCounts(nextCounts);
    setLoading(false);
  };

  useEffect(() => {
    void fetchWeekends(selectedMonth);
  }, [selectedMonth]);

  return (
    <DashboardLayout title="Reservations">
      <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
        <PageHeader title="Reservations" />

        <div className="sticky top-0 z-10 bg-background pb-2">
          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
        </div>

        {loading && (
          <div className="space-y-3 mt-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[140px] w-full rounded-xl" />
            ))}
          </div>
        )}

        {!loading && weekends.length === 0 && (
          <Card className="max-w-sm mx-auto mt-8 p-6 text-center">
            <CalendarRange className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-3 font-semibold">No weekends set up</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Set up {formatMonthYear(selectedMonth)} to start tracking merchants.
            </div>
            <Separator className="my-4" />
            <MonthSetupForm
              monthYear={selectedMonth}
              onComplete={() => void fetchWeekends(selectedMonth)}
            />
          </Card>
        )}

        {!loading && weekends.length > 0 && (
          <div className="space-y-3 mt-4">
            {weekends.map((weekend) => {
              const capacity = 10 + (weekend.outdoor_booths_available ? 3 : 0);
              const attendanceCount = counts[weekend.id] ?? 0;
              return (
                <WeekendCard
                  key={weekend.id}
                  weekend={weekend}
                  attendanceCount={attendanceCount}
                  capacity={capacity}
                  onClick={() => router.push(`/protected/reservations/${weekend.id}`)}
                />
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
