"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { ContractPayment, MonthlyContract } from "@/lib/types";
import { PAYMENT_TYPES } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  computeContractPaymentStatus,
  computeTotalOwed,
  formatMonthYear,
  formatPHP,
} from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

interface LogPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: MonthlyContract;
  initialData?: ContractPayment;
  mode?: "create" | "edit";
  onSuccess: () => void;
}

function getTodayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function LogPaymentSheet({
  open,
  onOpenChange,
  contract,
  initialData,
  mode = "create",
  onSuccess,
}: LogPaymentSheetProps) {
  type PaymentType = ContractPayment["payment_type"];

  const [paymentType, setPaymentType] = useState<ContractPayment["payment_type"]>(
    "partial",
  );
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(getTodayIso());
  const [referenceNote, setReferenceNote] = useState<string>("");
  const [loggedBy, setLoggedBy] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialData && mode === "edit") {
      setPaymentType(initialData.payment_type);
      setAmount(String(initialData.amount));
      setPaymentDate(initialData.payment_date);
      setReferenceNote(initialData.reference_note ?? "");
      setLoggedBy(initialData.logged_by ?? "");
      setNotes(initialData.notes ?? "");
    } else {
      setPaymentType("partial");
      setAmount("");
      setPaymentDate(getTodayIso());
      setReferenceNote("");
      setLoggedBy("");
      setNotes("");
    }
    setLoading(false);
  }, [open, initialData, mode]);

  const totalOwed = useMemo(() => computeTotalOwed(contract), [contract]);
  const totalCollected =
    contract.payments?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;

  const progress = totalOwed > 0 ? (totalCollected / totalOwed) * 100 : 0;

  const hintText = useMemo(() => {
    if (paymentType === "security_deposit") return "₱2,000 security deposit";
    if (paymentType === "downpayment") {
      return `₱${formatPHP(contract.downpayment_amount).replace("₱", "")} (${contract.payment_option === "A" ? "50% of base rent" : "full payment"})`;
    }
    if (paymentType === "balance") {
      return `₱${formatPHP(contract.balance_amount).replace("₱", "")} remaining balance`;
    }
    if (paymentType === "partial") return "Any amount — use for irregular / installment payments";
    return "Any other payment";
  }, [paymentType, contract.downpayment_amount, contract.balance_amount, contract.payment_option]);

  const quickFill = (value: number) => {
    setAmount(String(value));
  };

  const submit = async () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    let paymentError: { message?: string } | null;
    if (mode === "edit" && initialData) {
      // UPDATE existing payment
      const { error } = await supabase
        .from("contract_payments")
        .update({
          payment_type: paymentType,
          amount: parsed,
          payment_date: paymentDate,
          reference_note: referenceNote || null,
          logged_by: loggedBy || null,
          notes: notes || null,
        })
        .eq("id", initialData.id);
      paymentError = error;
    } else {
      // CREATE new payment
      const { error } = await supabase.from("contract_payments").insert({
        contract_id: contract.id,
        payment_type: paymentType,
        amount: parsed,
        payment_date: paymentDate,
        reference_note: referenceNote || null,
        logged_by: loggedBy || null,
        notes: notes || null,
      });
      paymentError = error;
    }

    if (paymentError) {
      toast.error(`Failed to ${mode === "edit" ? "update" : "log"} payment.`);
      setLoading(false);
      return;
    }

    // Re-fetch all payments to recompute total
    const { data: payments, error: paymentsError } = await supabase
      .from("contract_payments")
      .select("amount")
      .eq("contract_id", contract.id);

    if (paymentsError) {
      toast.error("Failed to refresh payment totals.");
      setLoading(false);
      return;
    }

    const newTotal =
      (payments as { amount: number }[] | null)?.reduce(
        (sum, p) => sum + (p.amount ?? 0),
        0,
      ) ?? 0;

    const newStatus = computeContractPaymentStatus(totalOwed, newTotal);

    const { error: updateError } = await supabase
      .from("monthly_contracts")
      .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", contract.id);

    if (updateError) {
      toast.error("Failed to update contract status.");
      setLoading(false);
      return;
    }

    toast.success(
      mode === "edit"
        ? `Payment of ${formatPHP(parsed)} updated!`
        : `Payment of ${formatPHP(parsed)} logged!`,
    );
    setLoading(false);
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader>
          <SheetTitle>{mode === "edit" ? "Edit Payment" : "Log Payment"}</SheetTitle>
          <SheetDescription>
            {contract.merchant?.business_name ?? ""} — {" "}
            {formatMonthYear(contract.month_year)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          <Card className="bg-muted p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm">Total Owed: {formatPHP(totalOwed)}</div>
                <StatusBadge status={contract.payment_status} />
              </div>
              <div className="text-sm text-muted-foreground">
                Paid so far: {formatPHP(totalCollected)}
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Type</Label>
              <Select
                value={paymentType}
                onValueChange={(v) => setPaymentType(v as PaymentType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{hintText}</p>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₱
                </span>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="pl-7"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {paymentType === "security_deposit" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => quickFill(2000)}
                  >
                    Fill ₱2,000
                  </Button>
                )}
                {paymentType === "downpayment" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => quickFill(contract.downpayment_amount)}
                  >
                    Fill {formatPHP(contract.downpayment_amount)}
                  </Button>
                )}
                {paymentType === "balance" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => quickFill(contract.balance_amount)}
                  >
                    Fill {formatPHP(contract.balance_amount)}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Reference / GCash Ref</Label>
              <Input
                placeholder="GCash ref, receipt number, etc."
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Logged By</Label>
              <Input
                placeholder="Your name"
                value={loggedBy}
                onChange={(e) => setLoggedBy(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              type="button"
              className="w-full h-12"
              disabled={loading}
              onClick={() => void submit()}
            >
              {loading ? "Saving..." : (mode === "edit" ? "Save Changes" : "Log Payment")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
