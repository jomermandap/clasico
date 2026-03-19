"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Merchant, MonthlyContract, PaymentOption, Weekend } from "@/lib/types";
import { BOOTH_NUMBERS } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  computeTotalOwed,
  formatMonthYear,
  formatPHP,
} from "@/lib/utils";
import { getRateForBoothType } from "@/lib/rates";
import { BoothTypeBadge } from "@/components/shared/booth-type-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type Step = "select_merchant" | "contract_form" | "confirm_existing";

type ContractWithJoins = MonthlyContract & {
  merchant: Merchant;
  payments?: { amount: number }[];
  attendances?: { id: string }[];
};

interface AddMerchantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekend: Weekend;
  allWeekendsThisMonth: Weekend[];
  onSuccess: () => void;
}

function parseSupabaseErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const anyErr = error as { code?: unknown };
  return typeof anyErr.code === "string" ? anyErr.code : null;
}

export function AddMerchantSheet({
  open,
  onOpenChange,
  weekend,
  allWeekendsThisMonth,
  onSuccess,
}: AddMerchantSheetProps) {
  const [step, setStep] = useState<Step>("select_merchant");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantsLoading, setMerchantsLoading] = useState(false);

  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("");
  const selectedMerchant = useMemo(
    () => merchants.find((m) => m.id === selectedMerchantId) ?? null,
    [merchants, selectedMerchantId],
  );

  const [existingContract, setExistingContract] = useState<ContractWithJoins | null>(
    null,
  );
  const [slotsUsed, setSlotsUsed] = useState(0);
  const [slotError, setSlotError] = useState<string | null>(null);

  const [formLoading, setFormLoading] = useState(false);

  const [weekendsAvailed, setWeekendsAvailed] = useState<number>(1);
  const [paymentOption, setPaymentOption] = useState<PaymentOption | null>(null);
  const [boothNumber, setBoothNumber] = useState<string>("");

  const [extraBrandFee, setExtraBrandFee] = useState<number>(0);
  const [highWattageFee, setHighWattageFee] = useState<number>(0);
  const [spacePenalty, setSpacePenalty] = useState<number>(0);
  const [ingressPenalty, setIngressPenalty] = useState<number>(0);
  const [otherFees, setOtherFees] = useState<number>(0);
  const [otherFeesNote, setOtherFeesNote] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [addonsOpen, setAddonsOpen] = useState(false);

  const baseRent = useMemo(() => {
    if (!selectedMerchant) return 0;
    return getRateForBoothType(selectedMerchant.booth_type, weekendsAvailed);
  }, [selectedMerchant, weekendsAvailed]);

  const weekendsSetUpCount = allWeekendsThisMonth.length;

  const downpaymentAmount = useMemo(() => {
    if (!paymentOption) return 0;
    return paymentOption === "A" ? baseRent * 0.5 : baseRent;
  }, [paymentOption, baseRent]);

  const balanceAmount = useMemo(() => {
    if (!paymentOption) return 0;
    return paymentOption === "A" ? baseRent * 0.5 : 0;
  }, [paymentOption, baseRent]);

  const totalAddons =
    extraBrandFee + highWattageFee + spacePenalty + ingressPenalty + otherFees;

  useEffect(() => {
    if (!open) return;

    const fetchMerchants = async () => {
      setMerchantsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("merchants")
        .select("*")
        .eq("is_active", true)
        .order("business_name", { ascending: true });

      if (error) {
        toast.error("Failed to load merchants.");
        setMerchants([]);
        setMerchantsLoading(false);
        return;
      }

      setMerchants((data as Merchant[]) ?? []);
      setMerchantsLoading(false);
    };

    void fetchMerchants();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setStep("select_merchant");
    setSelectedMerchantId("");
    setExistingContract(null);
    setSlotsUsed(0);
    setSlotError(null);
    setFormLoading(false);
    setWeekendsAvailed(1);
    setPaymentOption(null);
    setBoothNumber("");
    setExtraBrandFee(0);
    setHighWattageFee(0);
    setSpacePenalty(0);
    setIngressPenalty(0);
    setOtherFees(0);
    setOtherFeesNote("");
    setNotes("");
    setAddonsOpen(false);
  }, [open]);

  useEffect(() => {
    if (!selectedMerchant) return;
    setBoothNumber(selectedMerchant.booth_number ?? "");
  }, [selectedMerchant]);

  const fetchExistingContract = async (merchantId: string) => {
    setSlotError(null);
    setExistingContract(null);
    setSlotsUsed(0);

    const supabase = createClient();

    const { data: contractRow, error: contractErr } = await supabase
      .from("monthly_contracts")
      .select(
        "*, merchant:merchants(*), payments:contract_payments(amount), attendances:weekend_attendances(id)",
      )
      .eq("merchant_id", merchantId)
      .eq("month_year", weekend.month_year)
      .maybeSingle();

    if (contractErr) {
      toast.error("Failed to check existing contract.");
      return;
    }

    if (!contractRow) {
      setExistingContract(null);
      setStep("contract_form");
      return;
    }

    const mapped = contractRow as unknown as ContractWithJoins;
    const used = mapped.attendances?.length ?? 0;
    setExistingContract(mapped);
    setSlotsUsed(used);

    if (used >= mapped.weekends_availed) {
      setSlotError(
        `${mapped.merchant.business_name} has already used all ${mapped.weekends_availed} weekend(s) for ${formatMonthYear(mapped.month_year)}. No slots remaining.`,
      );
      setStep("select_merchant");
      return;
    }

    setStep("confirm_existing");
  };

  const handleMerchantSelect = async (merchantId: string) => {
    setSelectedMerchantId(merchantId);
    if (!merchantId) return;
    await fetchExistingContract(merchantId);
  };

  const confirmAddAttendance = async () => {
    if (!existingContract || !selectedMerchant) return;

    setFormLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("weekend_attendances").insert({
      contract_id: existingContract.id,
      weekend_id: weekend.id,
      booth_number: existingContract.booth_number,
    });

    if (error) {
      toast.error("Failed to add merchant to weekend.");
      setFormLoading(false);
      return;
    }

    toast.success(`${selectedMerchant.business_name} added to ${weekend.label}!`);
    setFormLoading(false);
    onSuccess();
    onOpenChange(false);
  };

  const submitNewContractAndAttendance = async () => {
    if (!selectedMerchant || !paymentOption) return;

    setFormLoading(true);
    const supabase = createClient();

    const insertContract = {
      merchant_id: selectedMerchant.id,
      month_year: weekend.month_year,
      booth_type: selectedMerchant.booth_type,
      booth_number: boothNumber,
      weekends_availed: weekendsAvailed,
      base_rent: baseRent,
      payment_option: paymentOption,
      security_deposit: 2000,
      downpayment_amount: downpaymentAmount,
      balance_amount: balanceAmount,
      extra_brand_fee: extraBrandFee,
      high_wattage_fee: highWattageFee,
      space_penalty: spacePenalty,
      ingress_egress_penalty: ingressPenalty,
      other_fees: otherFees,
      other_fees_note: otherFeesNote || null,
      payment_status: "unpaid",
      notes: notes || null,
    };

    const { data: newContract, error: contractError } = await supabase
      .from("monthly_contracts")
      .insert(insertContract)
      .select("*")
      .single();

    if (contractError) {
      const code = parseSupabaseErrorCode(contractError);
      if (code === "23505") {
        toast.error(
          "This merchant already has a contract for this month. Refresh and try again.",
        );
      } else {
        toast.error("Failed to save. Please try again.");
      }
      setFormLoading(false);
      return;
    }

    const { error: attendanceError } = await supabase
      .from("weekend_attendances")
      .insert({
        contract_id: (newContract as MonthlyContract).id,
        weekend_id: weekend.id,
        booth_number: boothNumber,
      });

    if (attendanceError) {
      toast.error("Failed to add to weekend. Please try again.");
      setFormLoading(false);
      return;
    }

    toast.success(
      `Contract created and ${selectedMerchant.business_name} added to ${weekend.label}!`,
    );
    setFormLoading(false);
    onSuccess();
    onOpenChange(false);
  };

  const existingCollected =
    existingContract?.payments?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;
  const existingOwed = existingContract ? computeTotalOwed(existingContract) : 0;

  const remainingAfterThis = existingContract
    ? existingContract.weekends_availed - (slotsUsed + 1)
    : 0;

  const boothOptions = selectedMerchant
    ? BOOTH_NUMBERS[selectedMerchant.booth_type]
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] overflow-y-auto rounded-t-2xl"
      >
        {step === "select_merchant" && (
          <>
            <SheetHeader>
              <SheetTitle>Add Merchant to {weekend.label}</SheetTitle>
            </SheetHeader>

            <div className="space-y-4 px-4 pb-6">
              <div className="space-y-2">
                <Label>Select Merchant</Label>
                <Select
                  value={selectedMerchantId}
                  onValueChange={(v) => void handleMerchantSelect(v)}
                  disabled={merchantsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        merchantsLoading
                          ? "Loading merchants..."
                          : "Choose a merchant"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.business_name} — {m.booth_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {slotError && (
                <Alert variant="destructive">
                  <AlertDescription>{slotError}</AlertDescription>
                </Alert>
              )}

              <Button
                type="button"
                className="w-full"
                disabled
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {step === "confirm_existing" && existingContract && selectedMerchant && (
          <>
            <SheetHeader>
              <SheetTitle>Confirm Attendance</SheetTitle>
            </SheetHeader>

            <div className="space-y-4 px-4 pb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {selectedMerchant.business_name}
                  </CardTitle>
                  <CardDescription>{selectedMerchant.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <BoothTypeBadge type={existingContract.booth_type} />
                      <span className="text-sm font-mono">
                        {existingContract.booth_number}
                      </span>
                    </div>
                    <StatusBadge status={existingContract.payment_status} />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Contract: {existingContract.weekends_availed} weekends in {" "}
                    {formatMonthYear(existingContract.month_year)}
                  </div>

                  <div className="text-sm">
                    Paid: {formatPHP(existingCollected)} / {formatPHP(existingOwed)}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Weekends scheduled: {slotsUsed} of {existingContract.weekends_availed} — {" "}
                    {remainingAfterThis} remaining after this
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground">
                Adding {selectedMerchant.business_name} to {weekend.label}. Payment
                is already tracked on their existing contract.
              </p>

              <Button
                type="button"
                className="w-full h-12"
                disabled={formLoading}
                onClick={() => void confirmAddAttendance()}
              >
                {formLoading ? "Saving..." : "Confirm & Add"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={formLoading}
                onClick={() => setStep("select_merchant")}
              >
                Back
              </Button>
            </div>
          </>
        )}

        {step === "contract_form" && selectedMerchant && (
          <>
            <SheetHeader>
              <SheetTitle>New Contract + Add to {weekend.label}</SheetTitle>
              <SheetDescription>
                This merchant doesn&apos;t have a contract for {" "}
                {formatMonthYear(weekend.month_year)} yet. Set it up now.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 px-4 pb-6">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start px-0"
                onClick={() => setStep("select_merchant")}
                disabled={formLoading}
              >
                Back
              </Button>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Contract Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Booth Number</Label>
                    <Select value={boothNumber} onValueChange={setBoothNumber}>
                      <SelectTrigger>
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
                    <Label>Weekends Availing This Month</Label>
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setWeekendsAvailed((v) => Math.max(1, v - 1))
                        }
                        disabled={weekendsAvailed <= 1 || formLoading}
                      >
                        -
                      </Button>
                      <div className="w-12 text-center text-xl font-bold">
                        {weekendsAvailed}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setWeekendsAvailed((v) => Math.min(5, v + 1))
                        }
                        disabled={weekendsAvailed >= 5 || formLoading}
                      >
                        +
                      </Button>
                    </div>

                    <div>
                      {baseRent > 0 ? (
                        <div className="text-lg font-bold text-primary">
                          Base Rent: {formatPHP(baseRent)}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Base Rent: TBD
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Weekend 1 of {weekendsAvailed} will be {weekend.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {weekendsSetUpCount} weekend(s) set up for this month
                      </div>
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
                      disabled={formLoading}
                    >
                      <div className="font-semibold">Option A</div>
                      <div className="text-xs text-muted-foreground">50% Down</div>
                      <div className="mt-2 text-sm font-semibold">
                        {formatPHP(baseRent * 0.5)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Balance before 1st weekend
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`rounded-xl border p-3 text-left transition ${
                        paymentOption === "B" ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setPaymentOption("B")}
                      disabled={formLoading}
                    >
                      <div className="font-semibold">Option B</div>
                      <div className="text-xs text-muted-foreground">Full Payment</div>
                      <div className="mt-2 text-sm font-semibold">
                        {formatPHP(baseRent)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Secures slot faster
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Collapsible open={addonsOpen} onOpenChange={setAddonsOpen}>
                <Card>
                  <CardHeader className="pb-2">
                    <CollapsibleTrigger asChild>
                      <button type="button" className="w-full text-left">
                        <CardTitle className="text-base">
                          Add-on Fees
                          {totalAddons > 0 ? ` (${formatPHP(totalAddons)})` : ""}
                        </CardTitle>
                        <CardDescription>
                          Optional fees and penalties.
                        </CardDescription>
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
                          value={extraBrandFee}
                          onChange={(e) =>
                            setExtraBrandFee(Number(e.target.value || 0))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          500 per brand
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label>High Wattage</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={highWattageFee}
                          onChange={(e) =>
                            setHighWattageFee(Number(e.target.value || 0))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          500 per unit
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label>Space Penalty</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={spacePenalty}
                          onChange={(e) =>
                            setSpacePenalty(Number(e.target.value || 0))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          100 per inch
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label>Ingress/Egress Penalty</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={ingressPenalty}
                          onChange={(e) =>
                            setIngressPenalty(Number(e.target.value || 0))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          250 per 30min
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label>Other Fees</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={otherFees}
                          onChange={(e) =>
                            setOtherFees(Number(e.target.value || 0))
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Other Fees Note</Label>
                        <Input
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
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                type="button"
                className="w-full h-12"
                disabled={!paymentOption || formLoading}
                onClick={() => void submitNewContractAndAttendance()}
              >
                {formLoading ? "Saving..." : "Create Contract & Add to Weekend"}
              </Button>
            </div>
          </>
        )}

        <div className="px-4 pb-6" />
      </SheetContent>
    </Sheet>
  );
}
