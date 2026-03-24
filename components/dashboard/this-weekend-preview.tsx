"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Merchant, MonthlyContract, Weekend } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface ThisWeekendPreviewProps {
  monthYear: string;
}

type WeekendAttendancePreview = {
  id: string;
  booth_number?: string | null;
  contract?: Pick<MonthlyContract, "payment_status" | "booth_number"> & {
    merchant?: Pick<Merchant, "id" | "business_name" | "booth_number"> | null;
  };
};

export function ThisWeekendPreview({ monthYear }: ThisWeekendPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [isCurrentWeekend, setIsCurrentWeekend] = useState(false);
  const [targetWeekend, setTargetWeekend] = useState<Weekend | null>(null);
  const [reservations, setReservations] = useState<WeekendAttendancePreview[]>(
    [],
  );

  useEffect(() => {
    let active = true;

    const fetchPreview = async () => {
      setLoading(true);
      const supabase = createClient();

      const { data: weekendsData, error: weekendsError } = await supabase
        .from("weekends")
        .select("*")
        .eq("month_year", monthYear)
        .order("date_start", { ascending: true });

      if (!active) return;

      if (weekendsError) {
        setTargetWeekend(null);
        setReservations([]);
        setIsCurrentWeekend(false);
        setLoading(false);
        return;
      }

      const weekends = (weekendsData as Weekend[]) ?? [];
      const today = new Date();
      const currentWeekend = weekends.find(
        (weekend) =>
          new Date(weekend.date_start) <= today &&
          today <= new Date(weekend.date_end),
      );
      const nextWeekend = weekends.find(
        (weekend) => new Date(weekend.date_start) > today,
      );
      const nextTargetWeekend = currentWeekend || nextWeekend || null;

      setTargetWeekend(nextTargetWeekend);
      setIsCurrentWeekend(
        Boolean(currentWeekend && nextTargetWeekend?.id === currentWeekend.id),
      );

      if (!nextTargetWeekend) {
        setReservations([]);
        setLoading(false);
        return;
      }

      const { data: reservationsData, error: reservationsError } = await supabase
        .from("weekend_attendances")
        .select(
          "id, booth_number, contract:monthly_contracts(payment_status, booth_number, merchant:merchants(id, business_name, booth_number))",
        )
        .eq("weekend_id", nextTargetWeekend.id)
        .order("created_at", { ascending: true });

      if (!active) return;

      if (reservationsError) {
        setReservations([]);
        setLoading(false);
        return;
      }

      setReservations((reservationsData as unknown as WeekendAttendancePreview[]) ?? []);
      setLoading(false);
    };

    void fetchPreview();

    return () => {
      active = false;
    };
  }, [monthYear]);

  if (loading) {
    return <Skeleton className="h-[180px] w-full rounded-xl" />;
  }

  if (!targetWeekend) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          No upcoming weekend scheduled this month.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isCurrentWeekend ? "This Weekend" : "Next Weekend"}
        </CardTitle>
        <CardDescription>
          {formatDateRange(targetWeekend.date_start, targetWeekend.date_end)} ·{" "}
          {targetWeekend.label}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {reservations.length === 0 ? (
          <div className="text-sm text-muted-foreground">No reservations yet</div>
        ) : (
          <div className="space-y-2">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex min-h-[36px] items-center justify-between gap-3"
              >
                <div className="min-w-0 truncate text-sm">
                  <span className="font-mono">
                    {reservation.booth_number ??
                      reservation.contract?.booth_number ??
                      reservation.contract?.merchant?.booth_number ??
                      "N/A"}
                  </span>
                  <span className="mx-1">·</span>
                  <span>
                    {reservation.contract?.merchant?.business_name ?? "Unknown merchant"}
                  </span>
                </div>
                <StatusBadge status={reservation.contract?.payment_status ?? "unpaid"} />
              </div>
            ))}
          </div>
        )}

        <Separator className="my-3" />

        <div className="flex justify-end">
          <Link
            href={`/protected/reservations/${targetWeekend.id}`}
            className="text-sm text-primary"
          >
            View all →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
