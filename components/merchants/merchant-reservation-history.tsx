"use client";

import { useEffect, useState } from "react";
import { CalendarX } from "lucide-react";
import type { Merchant, Reservation, Weekend } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { formatDateRange, formatPHP } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface MerchantReservationHistoryProps {
  merchantId: Merchant["id"];
}

type ReservationWithWeekend = Reservation & {
  weekend: Weekend;
};

export function MerchantReservationHistory({
  merchantId,
}: MerchantReservationHistoryProps) {
  const [reservations, setReservations] = useState<ReservationWithWeekend[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("reservations")
        .select("*, weekends(*)")
        .eq("merchant_id", merchantId)
        .order("date_start", { foreignTable: "weekends", ascending: false });

      if (error) {
        setReservations([]);
        setLoading(false);
        return;
      }

      const mapped =
        data?.map((row: any) => ({
          ...(row as Reservation),
          weekend: row.weekends as Weekend,
        })) ?? [];

      setReservations(mapped);
      setLoading(false);
    };

    if (merchantId) {
      void fetchReservations();
    }
  }, [merchantId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            {index < 2 && <Separator className="mt-2" />}
          </div>
        ))}
      </div>
    );
  }

  if (!reservations.length) {
    return (
      <EmptyState
        icon={CalendarX}
        title="No reservations yet"
        description="Reservations will appear here once added."
      />
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((reservation, index) => {
        const { weekend } = reservation;

        const totalPaid =
          (reservation.security_deposit_paid
            ? reservation.security_deposit
            : 0) +
          (reservation.downpayment_paid ? reservation.downpayment_amount : 0) +
          (reservation.balance_paid ? reservation.balance_amount : 0);

        const totalBilled =
          reservation.base_rent +
          reservation.security_deposit +
          reservation.extra_brand_fee +
          reservation.high_wattage_fee +
          reservation.space_penalty +
          reservation.ingress_egress_penalty +
          reservation.other_fees;

        return (
          <div key={reservation.id}>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">
                  {weekend.label}{" "}
                  <span className="text-xs text-muted-foreground">
                    {formatDateRange(weekend.date_start, weekend.date_end)}
                  </span>
                </div>
                <StatusBadge status={reservation.payment_status} />
              </div>
              <div className="text-xs text-muted-foreground">
                Amount paid:{" "}
                <span className="font-medium">
                  {formatPHP(totalPaid)} / {formatPHP(totalBilled)}
                </span>
              </div>
            </div>
            {index < reservations.length - 1 && (
              <Separator className="mt-3" />
            )}
          </div>
        );
      })}
    </div>
  );
}

