"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { MonthlyContract, Weekend, WeekendAttendance } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AttendanceRow } from "@/components/reservations/attendance-row";
import { BoothTypeBadge } from "@/components/shared/booth-type-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FabButton } from "@/components/shared/fab-button";
import { PageHeader } from "@/components/shared/page-header";

type AttendanceWithJoins = WeekendAttendance & {
  contract: MonthlyContract & {
    merchant: { name: string; business_name: string };
    payments?: { amount: number }[];
  };
};

export default function WeekendDetailPage() {
  const params = useParams<{ weekendId: string }>();
  const router = useRouter();
  const weekendId = params?.weekendId;

  const [weekend, setWeekend] = useState<Weekend | null>(null);
  const [attendances, setAttendances] = useState<AttendanceWithJoins[]>([]);
  const [loading, setLoading] = useState(true);

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removingAttendanceId, setRemovingAttendanceId] = useState<string | null>(
    null,
  );
  const [removing, setRemoving] = useState(false);

  const capacity = useMemo(() => {
    if (!weekend) return 0;
    return 10 + (weekend.outdoor_booths_available ? 3 : 0);
  }, [weekend]);

  const fetchAttendances = useCallback(async (wId: string) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("weekend_attendances")
      .select(
        "*, contract:monthly_contracts(*, merchant:merchants(*), payments:contract_payments(amount))",
      )
      .eq("weekend_id", wId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load attendances.");
      setAttendances([]);
      return;
    }

    setAttendances((data as unknown as AttendanceWithJoins[]) ?? []);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!weekendId) return;

    setLoading(true);
    const supabase = createClient();

    const { data: weekendRow, error: weekendError } = await supabase
      .from("weekends")
      .select("*")
      .eq("id", weekendId)
      .single();

    if (weekendError) {
      toast.error("Failed to load weekend.");
      setWeekend(null);
      setAttendances([]);
      setLoading(false);
      return;
    }

    const w = weekendRow as Weekend;
    setWeekend(w);

    await fetchAttendances(w.id);

    setLoading(false);
  }, [fetchAttendances, weekendId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const handleRemove = async () => {
    if (!removingAttendanceId) return;

    setRemoving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("weekend_attendances")
      .delete()
      .eq("id", removingAttendanceId);

    if (error) {
      toast.error("Failed to remove.");
      setRemoving(false);
      return;
    }

    toast.success("Removed from weekend");
    setRemoving(false);
    setRemoveDialogOpen(false);
    setRemovingAttendanceId(null);
    if (weekendId) {
      await fetchAttendances(weekendId);
    }
  };

  return (
    <DashboardLayout title="Reservations">
      <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
        <PageHeader
          title={weekend?.label ?? "Weekend"}
          description={
            weekend ? formatDateRange(weekend.date_start, weekend.date_end) : ""
          }
          backHref="/protected/reservations"
        />

        {!loading && weekend && (
          <div className="mb-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div>
              {attendances.length} / {capacity} merchants this weekend
            </div>
            {weekend.outdoor_booths_available && (
              <div className="flex items-center gap-2">
                <BoothTypeBadge type="outdoor" />
                <span>Outdoor open</span>
              </div>
            )}
          </div>
        )}

        {!loading && attendances.length === 0 && (
          <EmptyState
            icon={Store}
            title="No merchants yet"
            description="Tap the button below to add the first merchant for this weekend."
          />
        )}

        {!loading && attendances.length > 0 && (
          <div className="space-y-3">
            {attendances.map((attendance) => (
              <AttendanceRow
                key={attendance.id}
                attendance={attendance}
                onViewContract={() => {
                  if (!weekendId) return;
                  router.push(
                    `/protected/reservations/contracts/${attendance.contract_id}?from=${weekendId}`,
                  );
                }}
                onRemove={() => {
                  setRemovingAttendanceId(attendance.id);
                  setRemoveDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}

        <FabButton
          label="Add Merchant"
          onClick={() => {
            if (!weekendId) return;
            router.push(`/protected/reservations/${weekendId}/add-merchants`);
          }}
        />

        <ConfirmDialog
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          title="Remove from this weekend?"
          description="This only removes the merchant from this specific weekend. Their monthly contract and payment records are not affected."
          confirmLabel="Remove"
          variant="destructive"
          loading={removing}
          onConfirm={() => void handleRemove()}
        />
      </div>
    </DashboardLayout>
  );
}
