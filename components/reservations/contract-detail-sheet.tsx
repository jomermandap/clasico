"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { MonthlyContract, WeekendAttendance, Weekend } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  computeTotalOwed,
  formatDateRange,
  formatMonthYear,
  formatPHP,
} from "@/lib/utils";
import { BoothTypeBadge } from "@/components/shared/booth-type-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { LogPaymentSheet } from "@/components/reservations/log-payment-sheet";

type AttendanceWithWeekend = WeekendAttendance & { weekend: Weekend };

type ContractWithJoins = MonthlyContract & {
  merchant: { name: string; business_name: string };
  payments: {
    id: string;
    payment_type: string;
    amount: number;
    payment_date: string;
    reference_note?: string | null;
    logged_by?: string | null;
    notes?: string | null;
    created_at: string;
  }[];
  attendances: AttendanceWithWeekend[];
};

interface ContractDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string | null;
  onPaymentLogged: () => void;
}

export function ContractDetailSheet({
  open,
  onOpenChange,
  contractId,
  onPaymentLogged,
}: ContractDetailSheetProps) {
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState<ContractWithJoins | null>(null);
  const [logPaymentOpen, setLogPaymentOpen] = useState(false);

  useEffect(() => {
    if (!open || !contractId) return;

    const fetchContract = async () => {
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

      setContract(data as unknown as ContractWithJoins);
      setLoading(false);
    };

    void fetchContract();
  }, [open, contractId]);

  const totalOwed = useMemo(() => {
    if (!contract) return 0;
    return computeTotalOwed(contract);
  }, [contract]);

  const totalCollected = useMemo(() => {
    if (!contract) return 0;
    return (contract.payments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
  }, [contract]);

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

  const paymentsSorted = useMemo(() => {
    if (!contract) return [];
    return [...(contract.payments ?? [])].sort((a, b) => {
      const da = new Date(a.payment_date).getTime();
      const db = new Date(b.payment_date).getTime();
      return db - da;
    });
  }, [contract]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setLogPaymentOpen(false);
      setContract(null);
      setLoading(false);
    }
    onOpenChange(nextOpen);
  };

  const reloadContract = async () => {
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
      toast.error("Failed to refresh contract.");
      setLoading(false);
      return;
    }

    setContract(data as unknown as ContractWithJoins);
    setLoading(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side="bottom"
          className="h-[92vh] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>Contract Details</SheetTitle>
            <SheetDescription>
              {contract?.merchant?.business_name ?? ""}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-6">
            {loading && (
              <div className="text-sm text-muted-foreground">Loading...</div>
            )}

            {!loading && contract && (
              <>
                <div>
                  <div className="text-lg font-semibold">
                    {contract.merchant.business_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {contract.merchant.name}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <BoothTypeBadge type={contract.booth_type} />
                    <span className="text-sm font-mono">{contract.booth_number}</span>
                  </div>
                </div>

                <Card className="bg-muted rounded-lg p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Contract Period</span>
                      <span>{formatMonthYear(contract.month_year)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Weekends Availed</span>
                      <span>{contract.weekends_availed} weekend(s)</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Base Rent</span>
                      <CurrencyDisplay amount={contract.base_rent} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Security Deposit</span>
                      <CurrencyDisplay amount={contract.security_deposit} size="sm" />
                    </div>
                    {totalAddons > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Add-on Fees</span>
                        <CurrencyDisplay amount={totalAddons} size="sm" />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>Total Owed</span>
                      <CurrencyDisplay amount={totalOwed} size="sm" />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Paid</span>
                      <CurrencyDisplay
                        amount={totalCollected}
                        size="sm"
                        className={totalCollected > 0 ? "text-green-700" : ""}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <CurrencyDisplay
                        amount={remaining}
                        size="sm"
                        className={remaining > 0 ? "text-amber-700" : ""}
                      />
                    </div>

                    <div className="flex justify-center pt-1">
                      <StatusBadge status={contract.payment_status} />
                    </div>
                  </div>
                </Card>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setLogPaymentOpen(true)}
                >
                  Log Payment
                </Button>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">
                      Weekends This Month ({contract.attendances.length} / {contract.weekends_availed})
                    </div>
                    {contract.attendances.length < contract.weekends_availed && (
                      <div className="text-xs text-muted-foreground">
                        {contract.weekends_availed - contract.attendances.length} slot(s) remaining
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contract.attendances.map((a) => {
                      if (!a.weekend) return null;
                      return (
                        <Badge key={a.id} variant="outline">
                          {a.weekend.label} — {" "}
                          {formatDateRange(
                            a.weekend.date_start,
                            a.weekend.date_end,
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold">Payment History</div>

                  {paymentsSorted.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No payments logged yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {paymentsSorted.map((p) => (
                        <Card key={p.id} className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{p.payment_type}</div>
                              <div className="text-xs text-muted-foreground">
                                {p.payment_date}
                              </div>
                              {p.reference_note && (
                                <div className="text-xs text-muted-foreground">
                                  {p.reference_note}
                                </div>
                              )}
                              {p.logged_by && (
                                <div className="text-xs text-muted-foreground">
                                  Logged by: {p.logged_by}
                                </div>
                              )}
                            </div>
                            <div className="text-sm font-semibold">
                              {formatPHP(p.amount)}
                            </div>
                          </div>
                        </Card>
                      ))}

                      <div className="border-t pt-2 font-semibold">
                        Total Collected: {formatPHP(totalCollected)}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {contract && (
        <LogPaymentSheet
          open={logPaymentOpen}
          onOpenChange={setLogPaymentOpen}
          contract={contract}
          onSuccess={() => {
            void reloadContract();
            onPaymentLogged();
          }}
        />
      )}
    </>
  );
}
