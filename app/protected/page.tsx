"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { ThisWeekendPreview } from "@/components/dashboard/this-weekend-preview";
import { MonthSelector } from "@/components/shared/month-selector";
import { formatMonthYear, getCurrentMonthYear } from "@/lib/utils";

export default function ProtectedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMonth = useMemo(() => {
    const fromUrl = searchParams.get("month");
    return fromUrl && /^\d{4}-\d{2}$/.test(fromUrl)
      ? fromUrl
      : getCurrentMonthYear();
  }, [searchParams]);

  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);

  useEffect(() => {
    router.replace(`/protected?month=${selectedMonth}`);
  }, [router, selectedMonth]);

  return (
    <DashboardLayout title="Overview">
      <div className="mx-auto w-full max-w-3xl px-2 pb-24 pt-0 md:px-4">
        <p className="mb-3 text-sm text-muted-foreground">
          {formatMonthYear(selectedMonth)}
        </p>

        <div className="sticky top-0 z-10 mb-4 bg-background pb-2">
          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
        </div>

        <OverviewStats monthYear={selectedMonth} />

        <div className="mt-6">
          <ThisWeekendPreview monthYear={selectedMonth} />
        </div>
      </div>
    </DashboardLayout>
  );
}
