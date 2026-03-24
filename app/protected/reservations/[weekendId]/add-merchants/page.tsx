"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Search, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import type {
  Merchant,
  MonthlyContract,
  PaymentOption,
  Weekend,
  WeekendAttendance,
} from "@/lib/types";
import { BOOTH_NUMBERS } from "@/lib/types";
import {
  formatDateRange,
  formatMonthYear,
  formatPHP,
} from "@/lib/utils";
import { getRateForBoothType } from "@/lib/rates";
import { createClient } from "@/lib/supabase/client";
import { BoothTypeBadge } from "@/components/shared/booth-type-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type ContractWithMeta = MonthlyContract & {
  attendances?: { id: string }[];
};

type ExistingAttendance = Pick<WeekendAttendance, "id" | "contract_id">;

type Draft = {
  weekendsAvailed: number;
  paymentOption: PaymentOption | null;
  boothNumber: string;
  extraBrandFee: number;
  highWattageFee: number;
  spacePenalty: number;
  ingressPenalty: number;
  otherFees: number;
  otherFeesNote: string;
  notes: string;
  addonsOpen: boolean;
};

function parseSupabaseErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const anyErr = error as { code?: unknown };
  return typeof anyErr.code === "string" ? anyErr.code : null;
}

export default function AddMerchantsPage() {
  const params = useParams<{ weekendId: string }>();
  const router = useRouter();
  const weekendId = params?.weekendId;

  const [weekend, setWeekend] = useState<Weekend | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [contracts, setContracts] = useState<ContractWithMeta[]>([]);
  const [existingAttendances, setExistingAttendances] = useState<ExistingAttendance[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [setupOpen, setSetupOpen] = useState(false);
  const [setupIndex, setSetupIndex] = useState(0);
  const [setupMerchantIds, setSetupMerchantIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);

  const merchantById = useMemo(() => {
    const map = new Map<string, Merchant>();
    merchants.forEach((m) => map.set(m.id, m));
    return map;
  }, [merchants]);

  const contractByMerchantId = useMemo(() => {
    const map = new Map<string, ContractWithMeta>();
    contracts.forEach((c) => map.set(c.merchant_id, c));
    return map;
  }, [contracts]);

  const attendingMerchantIds = useMemo(() => {
    const merchantIdByContractId = new Map<string, string>();
    contracts.forEach((contract) => {
      merchantIdByContractId.set(contract.id, contract.merchant_id);
    });

    const s = new Set<string>();
    existingAttendances.forEach((a) => {
      const id = merchantIdByContractId.get(a.contract_id);
      if (id) s.add(id);
    });
    return s;
  }, [contracts, existingAttendances]);

  const filteredMerchants = useMemo(() => {
    if (!searchQuery.trim()) return merchants;
    const q = searchQuery.toLowerCase();
    return merchants.filter(
      (m) =>
        m.business_name.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
    );
  }, [merchants, searchQuery]);

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
      setLoading(false);
      return;
    }

    const w = weekendRow as Weekend;
    setWeekend(w);

    const [
      { data: merchantsRow, error: merchantsError },
      { data: contractsRow, error: contractsError },
      { data: attendancesRow, error: attendancesError },
    ] = await Promise.all([
      supabase
        .from("merchants")
        .select("id, name, business_name, booth_type, booth_number, is_active")
        .eq("is_active", true)
        .order("business_name", { ascending: true }),
      supabase
        .from("monthly_contracts")
        .select(
          "id, merchant_id, booth_type, booth_number, weekends_availed, base_rent, payment_option, payment_status, attendances:weekend_attendances(id)",
        )
        .eq("month_year", w.month_year),
      supabase
        .from("weekend_attendances")
        .select("id, contract_id")
        .eq("weekend_id", weekendId),
    ]);

    if (merchantsError) {
      toast.error("Failed to load merchants.");
      setMerchants([]);
      setLoading(false);
      return;
    }

    if (contractsError) {
      toast.error("Failed to load contracts.");
      setContracts([]);
      setLoading(false);
      return;
    }

    if (attendancesError) {
      toast.error("Failed to load existing attendances.");
      setExistingAttendances([]);
      setLoading(false);
      return;
    }

    setMerchants((merchantsRow as Merchant[]) ?? []);
    setContracts((contractsRow as unknown as ContractWithMeta[]) ?? []);

    setExistingAttendances((attendancesRow as ExistingAttendance[]) ?? []);

    setLoading(false);
  }, [weekendId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const toggleSelected = (merchantId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(merchantId)) next.delete(merchantId);
      else next.add(merchantId);
      return next;
    });
  };

  const merchantCardState = (merchant: Merchant) => {
    if (attendingMerchantIds.has(merchant.id)) return "already" as const;
    const contract = contractByMerchantId.get(merchant.id);
    if (!contract) return "no_contract" as const;
    const used = contract.attendances?.length ?? 0;
    if (used >= contract.weekends_availed) return "slots_full" as const;
    return "has_contract" as const;
  };

  const handleAddSelected = async () => {
    if (!weekend) return;

    const selected = Array.from(selectedIds);
    if (selected.length === 0) return;

    const groupA: { merchant: Merchant; contract: ContractWithMeta }[] = [];
    const groupB: Merchant[] = [];

    for (const id of selected) {
      const m = merchantById.get(id);
      if (!m) continue;

      const state = merchantCardState(m);
      if (state === "already" || state === "slots_full") continue;

      const c = contractByMerchantId.get(m.id);
      if (c) {
        groupA.push({ merchant: m, contract: c });
      } else {
        groupB.push(m);
      }
    }

    if (groupB.length === 0) {
      await processAttendances(groupA, []);
      return;
    }

    const ids = groupB.map((m) => m.id);
    setSetupMerchantIds(ids);
    setSetupIndex(0);

    setDrafts((prev) => {
      const next = { ...prev };
      for (const m of groupB) {
        if (!next[m.id]) {
          next[m.id] = {
            weekendsAvailed: 1,
            paymentOption: null,
            boothNumber: m.booth_number,
            extraBrandFee: 0,
            highWattageFee: 0,
            spacePenalty: 0,
            ingressPenalty: 0,
            otherFees: 0,
            otherFeesNote: "",
            notes: "",
            addonsOpen: false,
          };
        }
      }
      return next;
    });

    setSetupOpen(true);
  };

  const processAttendances = async (
    groupA: { merchant: Merchant; contract: ContractWithMeta }[],
    groupBContracts: { merchant: Merchant; contract: MonthlyContract }[],
  ) => {
    if (!weekendId || !weekend) return;

    setSaving(true);
    const supabase = createClient();

    const attendancePayload = [
      ...groupA.map((x) => ({
        contract_id: x.contract.id,
        weekend_id: weekendId,
        booth_number: x.contract.booth_number,
      })),
      ...groupBContracts.map((x) => ({
        contract_id: x.contract.id,
        weekend_id: weekendId,
        booth_number: x.contract.booth_number,
      })),
    ];

    if (attendancePayload.length > 0) {
      const { error: insertError } = await supabase
        .from("weekend_attendances")
        .insert(attendancePayload);

      if (insertError) {
        toast.error("Failed to add some merchants. Please try again.");
        setSaving(false);
        return;
      }
    }

    toast.success(`${attendancePayload.length} merchant(s) added to ${weekend.label}`);
    setSaving(false);
    router.push(`/protected/reservations/${weekendId}`);
  };

  const handleSetupNextOrDone = async () => {
    if (!weekend) return;

    const currentMerchantId = setupMerchantIds[setupIndex];
    const currentMerchant = currentMerchantId
      ? merchantById.get(currentMerchantId)
      : null;
    const draft = currentMerchantId ? drafts[currentMerchantId] : null;

    if (!currentMerchant || !draft) return;

    if (!draft.paymentOption) {
      toast.error("Please select a payment option.");
      return;
    }

    if (setupIndex < setupMerchantIds.length - 1) {
      setSetupIndex((i) => i + 1);
      return;
    }

    const selected = Array.from(selectedIds);
    const groupA: { merchant: Merchant; contract: ContractWithMeta }[] = [];
    const groupB: Merchant[] = [];

    for (const id of selected) {
      const m = merchantById.get(id);
      if (!m) continue;

      const state = merchantCardState(m);
      if (state === "already" || state === "slots_full") continue;

      const c = contractByMerchantId.get(m.id);
      if (c) groupA.push({ merchant: m, contract: c });
      else groupB.push(m);
    }

    setSaving(true);
    const supabase = createClient();

    const createdContracts: { merchant: Merchant; contract: MonthlyContract }[] = [];

    for (const m of groupB) {
      const d = drafts[m.id];
      if (!d?.paymentOption) {
        toast.error("Please complete contract setup.");
        setSaving(false);
        return;
      }

      const baseRent = getRateForBoothType(m.booth_type, d.weekendsAvailed);
      const downpaymentAmount = d.paymentOption === "A" ? baseRent * 0.5 : baseRent;
      const balanceAmount = d.paymentOption === "A" ? baseRent * 0.5 : 0;

      const { data: newContract, error: contractError } = await supabase
        .from("monthly_contracts")
        .insert({
          merchant_id: m.id,
          month_year: weekend.month_year,
          booth_type: m.booth_type,
          booth_number: d.boothNumber,
          weekends_availed: d.weekendsAvailed,
          base_rent: baseRent,
          payment_option: d.paymentOption,
          security_deposit: 2000,
          downpayment_amount: downpaymentAmount,
          balance_amount: balanceAmount,
          extra_brand_fee: d.extraBrandFee,
          high_wattage_fee: d.highWattageFee,
          space_penalty: d.spacePenalty,
          ingress_egress_penalty: d.ingressPenalty,
          other_fees: d.otherFees,
          other_fees_note: d.otherFeesNote || null,
          payment_status: "unpaid",
          notes: d.notes || null,
        })
        .select("*")
        .single();

      if (contractError) {
        const code = parseSupabaseErrorCode(contractError);
        if (code === "23505") {
          toast.error(
            `Contract already exists for ${m.business_name}. Refresh and try again.`,
          );
        } else {
          toast.error("Failed to create contracts. Please try again.");
        }
        setSaving(false);
        return;
      }

      createdContracts.push({ merchant: m, contract: newContract as MonthlyContract });
    }

    setSetupOpen(false);
    setSetupMerchantIds([]);
    setSetupIndex(0);

    await processAttendances(groupA, createdContracts);
  };

  const currentSetupMerchantId = setupMerchantIds[setupIndex];
  const currentSetupMerchant = currentSetupMerchantId
    ? merchantById.get(currentSetupMerchantId)
    : null;
  const currentDraft = currentSetupMerchantId ? drafts[currentSetupMerchantId] : null;

  const currentBaseRent = useMemo(() => {
    if (!currentSetupMerchant || !currentDraft) return 0;
    return getRateForBoothType(currentSetupMerchant.booth_type, currentDraft.weekendsAvailed);
  }, [currentSetupMerchant, currentDraft]);

  if (!loading && !weekend) {
    return (
      <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
        <PageHeader title="Add Merchants" backHref={"/protected/reservations"} />
        <EmptyState
          icon={CalendarRange}
          title="Weekend not found"
          description="This weekend may have been deleted."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
      <PageHeader
        title="Add Merchants"
        description={
          weekend
            ? `${weekend.label} · ${formatDateRange(weekend.date_start, weekend.date_end)}`
            : ""
        }
        backHref={weekendId ? `/protected/reservations/${weekendId}` : "/protected/reservations"}
      />

      <div className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search merchants..."
            className="h-11 pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          filteredMerchants.map((m) => {
            const state = merchantCardState(m);
            const selected = selectedIds.has(m.id);
            const contract = contractByMerchantId.get(m.id);

            const used = contract?.attendances?.length ?? 0;
            const remainingSlots = contract ? contract.weekends_availed - used : 0;

            const cardBase =
              "w-full rounded-xl border p-4 text-left transition min-h-[88px]";

            if (state === "already") {
              return (
                <Card key={m.id} className="bg-muted p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{m.business_name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Already added
                      </div>
                    </div>
                    <Check className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              );
            }

            if (state === "slots_full" && contract) {
              return (
                <Card key={m.id} className="bg-muted p-4 opacity-60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{m.business_name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusBadge status={contract.payment_status} />
                        <span className="text-xs text-destructive">
                          All {contract.weekends_availed} weekends used
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            }

            const isTappable = state === "has_contract" || state === "no_contract";

            return (
              <button
                key={m.id}
                type="button"
                disabled={!isTappable || saving}
                className={`${cardBase} ${
                  selected ? "border-primary bg-primary/5" : "border-transparent"
                } ${saving ? "opacity-70" : ""}`}
                onClick={() => {
                  if (!isTappable) return;
                  toggleSelected(m.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{m.business_name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <BoothTypeBadge type={m.booth_type} />
                      <span className="text-sm font-mono text-muted-foreground">
                        {m.booth_number}
                      </span>
                      {state === "no_contract" && (
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                          No contract yet
                        </Badge>
                      )}
                      {state === "has_contract" && contract && (
                        <StatusBadge status={contract.payment_status} />
                      )}
                    </div>

                    {state === "has_contract" && contract && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Contract: {contract.weekends_availed} weekends availed · {remainingSlots} slots remaining
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-30 border-t bg-background px-4 py-3">
          <div className="mx-auto w-full max-w-3xl">
            <Button
              type="button"
              className="w-full h-12"
              disabled={saving || loading}
              onClick={() => void handleAddSelected()}
            >
              {saving ? "Saving..." : `Add Selected (${selectedIds.size})`}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={setupOpen} onOpenChange={saving ? () => {} : setSetupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Set up contract — {currentSetupMerchant?.business_name ?? ""} ({setupIndex + 1} of {setupMerchantIds.length})
            </DialogTitle>
            <DialogDescription>
              {currentSetupMerchant
                ? `${formatMonthYear(weekend?.month_year ?? "")}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {currentSetupMerchant && currentDraft && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BoothTypeBadge type={currentSetupMerchant.booth_type} />
                <span className="text-sm font-mono text-muted-foreground">
                  {currentSetupMerchant.booth_number}
                </span>
              </div>

              <Card className="p-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Weekends Availing</Label>
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-11"
                        onClick={() =>
                          setDrafts((prev) => ({
                            ...prev,
                            [currentSetupMerchant.id]: {
                              ...prev[currentSetupMerchant.id],
                              weekendsAvailed: Math.max(1, currentDraft.weekendsAvailed - 1),
                            },
                          }))
                        }
                        disabled={saving || currentDraft.weekendsAvailed <= 1}
                      >
                        -
                      </Button>
                      <div className="w-12 text-center text-xl font-bold">
                        {currentDraft.weekendsAvailed}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-11"
                        onClick={() =>
                          setDrafts((prev) => ({
                            ...prev,
                            [currentSetupMerchant.id]: {
                              ...prev[currentSetupMerchant.id],
                              weekendsAvailed: Math.min(5, currentDraft.weekendsAvailed + 1),
                            },
                          }))
                        }
                        disabled={saving || currentDraft.weekendsAvailed >= 5}
                      >
                        +
                      </Button>
                    </div>

                    <div>
                      {currentBaseRent > 0 ? (
                        <div className="text-lg font-bold text-primary">
                          Base Rent: {formatPHP(currentBaseRent)}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Base Rent: TBD</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Booth Number</Label>
                    <Select
                      value={currentDraft.boothNumber}
                      onValueChange={(v) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [currentSetupMerchant.id]: {
                            ...prev[currentSetupMerchant.id],
                            boothNumber: v,
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select booth" />
                      </SelectTrigger>
                      <SelectContent>
                        {(BOOTH_NUMBERS[currentSetupMerchant.booth_type] ?? []).map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Option</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className={`rounded-xl border p-3 text-left transition ${
                          currentDraft.paymentOption === "A" ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() =>
                          setDrafts((prev) => ({
                            ...prev,
                            [currentSetupMerchant.id]: {
                              ...prev[currentSetupMerchant.id],
                              paymentOption: "A",
                            },
                          }))
                        }
                        disabled={saving}
                      >
                        <div className="font-semibold">Option A</div>
                        <div className="text-xs text-muted-foreground">50% Down</div>
                        <div className="mt-2 text-sm font-semibold">
                          {formatPHP(currentBaseRent * 0.5)}
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`rounded-xl border p-3 text-left transition ${
                          currentDraft.paymentOption === "B" ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() =>
                          setDrafts((prev) => ({
                            ...prev,
                            [currentSetupMerchant.id]: {
                              ...prev[currentSetupMerchant.id],
                              paymentOption: "B",
                            },
                          }))
                        }
                        disabled={saving}
                      >
                        <div className="font-semibold">Option B</div>
                        <div className="text-xs text-muted-foreground">Full Payment</div>
                        <div className="mt-2 text-sm font-semibold">
                          {formatPHP(currentBaseRent)}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              <Collapsible
                open={currentDraft.addonsOpen}
                onOpenChange={(open) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [currentSetupMerchant.id]: {
                      ...prev[currentSetupMerchant.id],
                      addonsOpen: open,
                    },
                  }))
                }
              >
                <Card className="p-4">
                  <CollapsibleTrigger asChild>
                    <button type="button" className="w-full text-left">
                      <div className="font-semibold">Add-on Fees</div>
                      <div className="text-sm text-muted-foreground">
                        Optional fees and penalties.
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-3 space-y-3">
                      <div className="space-y-1">
                        <Label>Extra Brand Fee</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className="h-11"
                          value={currentDraft.extraBrandFee}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [currentSetupMerchant.id]: {
                                ...prev[currentSetupMerchant.id],
                                extraBrandFee: Number(e.target.value || 0),
                              },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>High Wattage Fee</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className="h-11"
                          value={currentDraft.highWattageFee}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [currentSetupMerchant.id]: {
                                ...prev[currentSetupMerchant.id],
                                highWattageFee: Number(e.target.value || 0),
                              },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Space Penalty</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className="h-11"
                          value={currentDraft.spacePenalty}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [currentSetupMerchant.id]: {
                                ...prev[currentSetupMerchant.id],
                                spacePenalty: Number(e.target.value || 0),
                              },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Ingress/Egress Penalty</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className="h-11"
                          value={currentDraft.ingressPenalty}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [currentSetupMerchant.id]: {
                                ...prev[currentSetupMerchant.id],
                                ingressPenalty: Number(e.target.value || 0),
                              },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Other Fees</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className="h-11"
                          value={currentDraft.otherFees}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [currentSetupMerchant.id]: {
                                ...prev[currentSetupMerchant.id],
                                otherFees: Number(e.target.value || 0),
                              },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Other Fees Note</Label>
                        <Input
                          className="h-11"
                          value={currentDraft.otherFeesNote}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [currentSetupMerchant.id]: {
                                ...prev[currentSetupMerchant.id],
                                otherFeesNote: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={currentDraft.notes}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [currentSetupMerchant.id]: {
                        ...prev[currentSetupMerchant.id],
                        notes: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              className="h-11 w-full"
              disabled={saving}
              onClick={() => void handleSetupNextOrDone()}
            >
              {saving
                ? "Saving..."
                : setupIndex < setupMerchantIds.length - 1
                ? "Next"
                : "Done & Add All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
