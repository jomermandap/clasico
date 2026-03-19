"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { ContractPayment, MonthlyContract, Weekend, WeekendAttendance } from "@/lib/types";
import {
  computeContractPaymentStatus,
  computeTotalOwed,
  formatDateRange,
  formatMonthYear,
  formatPHP,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { BoothTypeBadge } from "@/components/shared/booth-type-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { LogPaymentSheet } from "@/components/reservations/log-payment-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type AttendanceWithWeekend = WeekendAttendance & { weekend: Weekend };

type ContractWithJoins = MonthlyContract & {
  merchant: { name: string; business_name: string };
  payments: ContractPayment[];
  attendances: AttendanceWithWeekend[];
};

export default function ContractDetailPage() {
  const params = useParams<{ contractId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const contractId = params?.contractId;
  const fromWeekendId = searchParams.get("from");

  const [contract, setContract] = useState<ContractWithJoins | null>(null);
  const [loading, setLoading] = useState(true);
  const [logPaymentOpen, setLogPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ContractPayment | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const backHref = fromWeekendId
    ? `/protected/reservations/${fromWeekendId}`
    : "/protected/reservations";

  const fetchContract = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("monthly_contracts")
      .select(
        "*, merchant:merchants(*), payments:contract_payments(*), attendances:weekend_attendances(*, weekend:weekends(*))",
      )
      .eq("id", contractId)
      .single();

    if (error) {
      toast.error("Failed to load contract.");
      setContract(null);
      setLoading(false);
      return;
    }

    const mapped = data as unknown as ContractWithJoins;
    mapped.payments = (mapped.payments ?? []).sort((a, b) => {
      const da = new Date(a.payment_date).getTime();
      const db = new Date(b.payment_date).getTime();
      return db - da;
    });

    setContract(mapped);
    setLoading(false);
  }, [contractId]);

  useEffect(() => {
    void fetchContract();
  }, [fetchContract]);

  const totalOwed = useMemo(() => (contract ? computeTotalOwed(contract) : 0), [contract]);
  const totalCollected = useMemo(() => {
    return contract?.payments?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;
  }, [contract]);

  const computedStatus = useMemo(() => {
    return computeContractPaymentStatus(totalOwed, totalCollected);
  }, [totalOwed, totalCollected]);

  const totalAddons = useMemo(() => {
    if (!contract) return 0;
    return (
      contract.extra_brand_fee +
      contract.high_wattage_fee +
      contract.space_penalty +
      contract.ingress_egress_penalty +
      contract.other_fees
    );
  }, [contract]);

  const remaining = Math.max(0, totalOwed - totalCollected);

  const handleDelete = async () => {
    if (!contractId) return;
    setDeleting(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("monthly_contracts")
      .delete()
      .eq("id", contractId);

    if (error) {
      toast.error("Failed to delete contract.");
      setDeleting(false);
      return;
    }

    toast.success("Contract deleted");
    setDeleting(false);
    setDeleteOpen(false);
    router.push("/protected/reservations");
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
        <PageHeader title="Contract" backHref={backHref} />
        <div className="mt-4 space-y-3">
          <Card className="p-4">
            <div className="h-5 w-40 bg-muted rounded" />
            <div className="mt-3 h-4 w-56 bg-muted rounded" />
          </Card>
          <Card className="p-4">
            <div className="h-5 w-44 bg-muted rounded" />
            <div className="mt-3 h-16 w-full bg-muted rounded" />
          </Card>
          <Card className="p-4">
            <div className="h-5 w-44 bg-muted rounded" />
            <div className="mt-3 h-24 w-full bg-muted rounded" />
          </Card>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
        <PageHeader title="Contract" backHref={backHref} />
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Contract not found.</div>
        </Card>
      </div>
    );
  }

  const slotsUsed = contract.attendances?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
      <PageHeader
        title={contract.merchant.business_name}
        description={formatMonthYear(contract.month_year)}
        backHref={backHref}
      />

      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BoothTypeBadge type={contract.booth_type} />
              <span className="text-sm font-mono">{contract.booth_number}</span>
            </div>
            <StatusBadge status={computedStatus} />
          </div>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contract Period</span>
              <span>{formatMonthYear(contract.month_year)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Weekends Availed</span>
              <span>{contract.weekends_availed} weekend(s)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Base Rent</span>
              <CurrencyDisplay amount={contract.base_rent} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Security Deposit</span>
              <CurrencyDisplay amount={contract.security_deposit} size="sm" />
            </div>
            {totalAddons > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Add-on Fees</span>
                <CurrencyDisplay amount={totalAddons} size="sm" />
              </div>
            )}
            <div className="flex items-center justify-between font-semibold">
              <span>Total Owed</span>
              <CurrencyDisplay amount={totalOwed} size="sm" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-semibold text-green-700">
                {formatPHP(totalCollected)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className={remaining > 0 ? "font-semibold text-amber-700" : "font-semibold"}>
                {formatPHP(remaining)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => router.push(`/protected/reservations/contracts/${contract.id}/edit`)}
            >
              Edit Contract
            </Button>
            <Button
              type="button"
              className="h-11"
              onClick={() => {
                setEditingPayment(null);
                setLogPaymentOpen(true);
              }}
            >
              Log Payment
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold">
              Weekends This Month ({slotsUsed} / {contract.weekends_availed})
            </div>
            {slotsUsed < contract.weekends_availed && (
              <div className="text-xs text-muted-foreground">
                {contract.weekends_availed - slotsUsed} slot(s) remaining
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(contract.attendances ?? []).map((a) => {
              if (!a.weekend) return null;
              return (
                <Badge key={a.id} variant="outline">
                  {a.weekend.label} — {formatDateRange(a.weekend.date_start, a.weekend.date_end)}
                </Badge>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <div className="font-semibold">Payment History</div>

          {(contract.payments ?? []).length === 0 ? (
            <div className="mt-2 text-sm text-muted-foreground">
              No payments logged yet
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {(contract.payments ?? []).map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{p.payment_type}</div>
                    <div className="text-xs text-muted-foreground">{p.payment_date}</div>
                    {p.reference_note && (
                      <div className="text-xs text-muted-foreground">{p.reference_note}</div>
                    )}
                    {p.logged_by && (
                      <div className="text-xs text-muted-foreground">{p.logged_by}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{formatPHP(p.amount)}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingPayment(p);
                        setLogPaymentOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="border-t pt-2 font-semibold">
                Total Collected: {formatPHP(totalCollected)}
              </div>
            </div>
          )}
        </Card>

        <Button
          type="button"
          variant="destructive"
          className="h-11 w-full"
          onClick={() => setDeleteOpen(true)}
        >
          Delete Contract
        </Button>
      </div>

      <LogPaymentSheet
        open={logPaymentOpen}
        onOpenChange={(open) => {
          setLogPaymentOpen(open);
          if (!open) setEditingPayment(null);
        }}
        contract={contract}
        initialData={editingPayment ?? undefined}
        mode={editingPayment ? "edit" : "create"}
        onSuccess={() => {
          void fetchContract();
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) setDeleteOpen(open);
        }}
        title="Delete contract?"
        description="This will remove the contract and all payment records. The merchant will also be removed from all weekends they were attending this month."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
