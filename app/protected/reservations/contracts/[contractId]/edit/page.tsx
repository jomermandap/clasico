"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { MonthlyContract, PaymentOption, WeekendAttendance } from "@/lib/types";
import { BOOTH_NUMBERS } from "@/lib/types";
import {
  computeContractPaymentStatus,
  computeTotalOwed,
  formatMonthYear,
  formatPHP,
} from "@/lib/utils";
import { getRateForBoothType } from "@/lib/rates";
import { createClient } from "@/lib/supabase/client";
import { BoothTypeBadge } from "@/components/shared/booth-type-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ContractWithJoins = MonthlyContract & {
  merchant: { name: string; business_name: string; booth_number: string };
  attendances: WeekendAttendance[];
  payments: { amount: number }[];
};

export default function EditContractPage() {
  const params = useParams<{ contractId: string }>();
  const router = useRouter();
  const contractId = params?.contractId;

  const [contract, setContract] = useState<ContractWithJoins | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [boothNumber, setBoothNumber] = useState<string>("");
  const [weekendsAvailed, setWeekendsAvailed] = useState<number>(1);
  const [paymentOption, setPaymentOption] = useState<PaymentOption | null>(null);

  const [extraBrandFee, setExtraBrandFee] = useState<number>(0);
  const [highWattageFee, setHighWattageFee] = useState<number>(0);
  const [spacePenalty, setSpacePenalty] = useState<number>(0);
  const [ingressPenalty, setIngressPenalty] = useState<number>(0);
  const [otherFees, setOtherFees] = useState<number>(0);
  const [otherFeesNote, setOtherFeesNote] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [addonsOpen, setAddonsOpen] = useState(false);

  const fetchContract = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("monthly_contracts")
      .select("*, merchant:merchants(*), attendances:weekend_attendances(*), payments:contract_payments(amount)")
      .eq("id", contractId)
      .single();

    if (error) {
      toast.error("Failed to load contract.");
      setContract(null);
      setLoading(false);
      return;
    }

    const mapped = data as unknown as ContractWithJoins;
    setContract(mapped);

    setBoothNumber(mapped.booth_number);
    setWeekendsAvailed(mapped.weekends_availed);
    setPaymentOption((mapped.payment_option as PaymentOption | undefined) ?? null);
    setExtraBrandFee(mapped.extra_brand_fee);
    setHighWattageFee(mapped.high_wattage_fee);
    setSpacePenalty(mapped.space_penalty);
    setIngressPenalty(mapped.ingress_egress_penalty);
    setOtherFees(mapped.other_fees);
    setOtherFeesNote(mapped.other_fees_note ?? "");
    setNotes(mapped.notes ?? "");

    setLoading(false);
  }, [contractId]);

  useEffect(() => {
    void fetchContract();
  }, [fetchContract]);

  const attendanceCount = contract?.attendances?.length ?? 0;

  const baseRent = useMemo(() => {
    if (!contract) return 0;
    return getRateForBoothType(contract.booth_type, weekendsAvailed);
  }, [contract, weekendsAvailed]);

  const downpaymentAmount = useMemo(() => {
    if (!paymentOption) return 0;
    return paymentOption === "A" ? baseRent * 0.5 : baseRent;
  }, [paymentOption, baseRent]);

  const balanceAmount = useMemo(() => {
    if (!paymentOption) return 0;
    return paymentOption === "A" ? baseRent * 0.5 : 0;
  }, [paymentOption, baseRent]);

  const weekendsTooLow = weekendsAvailed < attendanceCount;

  const submit = async () => {
    if (!contractId || !contract) return;

    if (!paymentOption) {
      toast.error("Please select a payment option.");
      return;
    }

    if (weekendsTooLow) {
      toast.error("Please adjust weekends availed.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const updatePayload = {
      booth_number: boothNumber,
      weekends_availed: weekendsAvailed,
      base_rent: baseRent,
      payment_option: paymentOption,
      downpayment_amount: downpaymentAmount,
      balance_amount: balanceAmount,
      extra_brand_fee: extraBrandFee,
      high_wattage_fee: highWattageFee,
      space_penalty: spacePenalty,
      ingress_egress_penalty: ingressPenalty,
      other_fees: otherFees,
      other_fees_note: otherFeesNote || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("monthly_contracts")
      .update(updatePayload)
      .eq("id", contractId);

    if (updateError) {
      toast.error("Failed to update contract");
      setSaving(false);
      return;
    }

    const { data: payments, error: paymentsError } = await supabase
      .from("contract_payments")
      .select("amount")
      .eq("contract_id", contractId);

    if (paymentsError) {
      toast.error("Failed to update contract");
      setSaving(false);
      return;
    }

    const totalCollected =
      (payments as { amount: number }[] | null)?.reduce(
        (sum, p) => sum + (p.amount ?? 0),
        0,
      ) ?? 0;

    const totalOwed = computeTotalOwed({
      base_rent: baseRent,
      security_deposit: contract.security_deposit,
      extra_brand_fee: extraBrandFee,
      high_wattage_fee: highWattageFee,
      space_penalty: spacePenalty,
      ingress_egress_penalty: ingressPenalty,
      other_fees: otherFees,
    });

    const newStatus = computeContractPaymentStatus(totalOwed, totalCollected);

    const { error: statusError } = await supabase
      .from("monthly_contracts")
      .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", contractId);

    if (statusError) {
      toast.error("Failed to update contract");
      setSaving(false);
      return;
    }

    toast.success("Contract updated");
    setSaving(false);
    router.push(`/protected/reservations/contracts/${contractId}`);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
        <PageHeader title="Edit Contract" backHref={`/protected/reservations/contracts/${contractId ?? ""}`} />
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </Card>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
        <PageHeader title="Edit Contract" backHref={`/protected/reservations`} />
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Contract not found.</div>
        </Card>
      </div>
    );
  }

  const boothOptions = BOOTH_NUMBERS[contract.booth_type] ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
      <PageHeader
        title="Edit Contract"
        description={`${contract.merchant.business_name} — ${formatMonthYear(contract.month_year)}`}
        backHref={`/protected/reservations/contracts/${contract.id}`}
      />

      <Card className="p-4">
        <div className="space-y-1">
          <div className="text-base font-semibold">{contract.merchant.business_name}</div>
          <div className="text-sm text-muted-foreground">{formatMonthYear(contract.month_year)}</div>
          <div className="mt-2 flex items-center gap-2">
            <BoothTypeBadge type={contract.booth_type} />
            <span className="text-sm font-mono">{contract.booth_number}</span>
          </div>
        </div>
      </Card>

      <div className="mt-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contract Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Booth Number</Label>
              <Select value={boothNumber} onValueChange={setBoothNumber}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select booth" />
                </SelectTrigger>
                <SelectContent>
                  {boothOptions.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Weekends Availed</Label>
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-11"
                  onClick={() => setWeekendsAvailed((v) => Math.max(1, v - 1))}
                  disabled={saving || weekendsAvailed <= 1}
                >
                  -
                </Button>
                <div className="w-12 text-center text-xl font-bold">{weekendsAvailed}</div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-11"
                  onClick={() => setWeekendsAvailed((v) => Math.min(5, v + 1))}
                  disabled={saving || weekendsAvailed >= 5}
                >
                  +
                </Button>
              </div>

              {weekendsTooLow && (
                <p className="text-sm text-destructive">
                  Cannot reduce to {weekendsAvailed} — merchant is already scheduled for {attendanceCount} weekends. Remove weekend attendances first.
                </p>
              )}

              <div>
                {baseRent > 0 ? (
                  <div className="text-lg font-bold text-primary">
                    Base Rent: {formatPHP(baseRent)}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Base Rent: TBD</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment Option</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`rounded-xl border p-3 text-left transition ${
                  paymentOption === "A" ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setPaymentOption("A")}
                disabled={saving}
              >
                <div className="font-semibold">Option A</div>
                <div className="text-xs text-muted-foreground">50% Down</div>
                <div className="mt-2 text-sm font-semibold">{formatPHP(baseRent * 0.5)}</div>
                <div className="text-xs text-muted-foreground">Balance before 1st weekend</div>
              </button>
              <button
                type="button"
                className={`rounded-xl border p-3 text-left transition ${
                  paymentOption === "B" ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setPaymentOption("B")}
                disabled={saving}
              >
                <div className="font-semibold">Option B</div>
                <div className="text-xs text-muted-foreground">Full Payment</div>
                <div className="mt-2 text-sm font-semibold">{formatPHP(baseRent)}</div>
                <div className="text-xs text-muted-foreground">Secures slot faster</div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Collapsible open={addonsOpen} onOpenChange={setAddonsOpen}>
          <Card>
            <CardHeader className="pb-2">
              <CollapsibleTrigger asChild>
                <button type="button" className="w-full text-left">
                  <CardTitle className="text-base">Add-on Fees</CardTitle>
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Extra Brand Fee</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    className="h-11"
                    value={extraBrandFee}
                    onChange={(e) => setExtraBrandFee(Number(e.target.value || 0))}
                  />
                </div>

                <div className="space-y-1">
                  <Label>High Wattage Fee</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    className="h-11"
                    value={highWattageFee}
                    onChange={(e) => setHighWattageFee(Number(e.target.value || 0))}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Space Penalty</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    className="h-11"
                    value={spacePenalty}
                    onChange={(e) => setSpacePenalty(Number(e.target.value || 0))}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Ingress/Egress Penalty</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    className="h-11"
                    value={ingressPenalty}
                    onChange={(e) => setIngressPenalty(Number(e.target.value || 0))}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Other Fees</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    className="h-11"
                    value={otherFees}
                    onChange={(e) => setOtherFees(Number(e.target.value || 0))}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Other Fees Note</Label>
                  <Input
                    className="h-11"
                    value={otherFeesNote}
                    onChange={(e) => setOtherFeesNote(e.target.value)}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <Button
          type="button"
          className="h-12 w-full"
          disabled={saving || !paymentOption || weekendsTooLow}
          onClick={() => void submit()}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
