"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, Search, Store, SearchX } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import type { Merchant, MonthlyContract } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { BoothTypeBadge } from "@/components/shared/booth-type-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FabButton } from "@/components/shared/fab-button";
import { MonthSelector } from "@/components/shared/month-selector";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MerchantCard } from "@/components/merchants/merchant-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { computeTotalOwed, formatMonthYear, formatPHP, getCurrentMonthYear } from "@/lib/utils";
import { toast } from "sonner";

type TabFilter = "all" | "active" | "inactive";

type MerchantViewTab = "directory" | "by_month";

type ContractWithJoins = MonthlyContract & {
  merchant: Merchant;
  attendances?: { id: string }[];
  payments?: { amount: number }[];
};

export default function MerchantsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMonth = useMemo(() => {
    const fromUrl = searchParams.get("month");
    return fromUrl && /^\d{4}-\d{2}$/.test(fromUrl)
      ? fromUrl
      : getCurrentMonthYear();
  }, [searchParams]);

  const [viewTab, setViewTab] = useState<MerchantViewTab>("directory");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [monthContracts, setMonthContracts] = useState<ContractWithJoins[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);

  useEffect(() => {
    const fetchMerchants = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("merchants")
        .select("*")
        .order("business_name", { ascending: true });

      if (error) {
        toast.error("Failed to load merchants.");
        setMerchants([]);
        setLoading(false);
        return;
      }

      setMerchants((data as Merchant[]) ?? []);
      setLoading(false);
    };

    void fetchMerchants();
  }, []);

  useEffect(() => {
    router.replace(`/protected/merchants?month=${selectedMonth}`);
  }, [router, selectedMonth]);

  useEffect(() => {
    if (viewTab !== "by_month") return;

    const fetchContracts = async () => {
      setMonthLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("monthly_contracts")
        .select(
          "*, merchant:merchants(*), attendances:weekend_attendances(id), payments:contract_payments(amount)",
        )
        .eq("month_year", selectedMonth)
        .order("business_name", { foreignTable: "merchants", ascending: true });

      if (error) {
        toast.error("Failed to load contracts.");
        setMonthContracts([]);
        setMonthLoading(false);
        return;
      }

      setMonthContracts((data as unknown as ContractWithJoins[]) ?? []);
      setMonthLoading(false);
    };

    void fetchContracts();
  }, [selectedMonth, viewTab]);

  const filteredMerchants = useMemo(() => {
    let list = merchants;

    if (tab === "active") {
      list = list.filter((m) => m.is_active);
    } else if (tab === "inactive") {
      list = list.filter((m) => !m.is_active);
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase();
    return list.filter(
      (m) =>
        m.business_name.toLowerCase().includes(query) ||
        m.name.toLowerCase().includes(query),
    );
  }, [merchants, searchQuery, tab]);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("merchants")
      .delete()
      .eq("id", deletingId);

    if (error) {
      toast.error("Failed to delete merchant.");
      setDeleting(false);
      return;
    }

    setMerchants((prev) => prev.filter((m) => m.id !== deletingId));
    setDeleting(false);
    setConfirmOpen(false);
    setDeletingId(null);
    toast.success("Merchant deleted");
  };

  const hasMerchants = merchants.length > 0;
  const hasResults = filteredMerchants.length > 0;

  const monthSummary = useMemo(() => {
    const merchantsCount = monthContracts.length;
    const weekendsTotal = monthContracts.reduce(
      (sum, c) => sum + (c.weekends_availed ?? 0),
      0,
    );
    return { merchantsCount, weekendsTotal };
  }, [monthContracts]);

  return (
    <DashboardLayout title="Merchants">
      <div className="mx-auto w-full max-w-3xl px-2 pb-24 pt-0 md:px-4 md:pt-1">
        <p className="mb-2 text-sm text-muted-foreground">
          Manage your booth merchants.
        </p>

        <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as MerchantViewTab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="directory">Directory</TabsTrigger>
            <TabsTrigger value="by_month">By Month</TabsTrigger>
          </TabsList>

          <TabsContent value="directory">
            <div className="mb-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search merchants..."
                  className="h-10 pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Tabs value={tab} onValueChange={(value) => setTab(value as TabFilter)}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton
                        key={index}
                        className="h-[160px] w-full rounded-xl"
                      />
                    ))}
                  </div>
                ) : !hasMerchants ? (
                  <EmptyState
                    icon={Store}
                    title="No merchants yet"
                    description="Add your first merchant to get started."
                    action={{
                      label: "Add Merchant",
                      href: "/protected/merchants/new",
                    }}
                  />
                ) : !hasResults ? (
                  <EmptyState
                    icon={SearchX}
                    title={`No results for '${searchQuery}'`}
                    description="Try a different name or booth number."
                  />
                ) : (
                  filteredMerchants.map((merchant) => (
                    <MerchantCard
                      key={merchant.id}
                      merchant={merchant}
                      onEdit={() =>
                        router.push(`/protected/merchants/${merchant.id}`)
                      }
                      onDelete={() => handleDelete(merchant.id)}
                    />
                  ))
                )}
              </TabsContent>
              <TabsContent value="active" className="space-y-3">
                {!loading &&
                  filteredMerchants.map((merchant) => (
                    <MerchantCard
                      key={merchant.id}
                      merchant={merchant}
                      onEdit={() =>
                        router.push(`/protected/merchants/${merchant.id}`)
                      }
                      onDelete={() => handleDelete(merchant.id)}
                    />
                  ))}
              </TabsContent>
              <TabsContent value="inactive" className="space-y-3">
                {!loading &&
                  filteredMerchants.map((merchant) => (
                    <MerchantCard
                      key={merchant.id}
                      merchant={merchant}
                      onEdit={() =>
                        router.push(`/protected/merchants/${merchant.id}`)
                      }
                      onDelete={() => handleDelete(merchant.id)}
                    />
                  ))}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="by_month">
            <div className="sticky top-0 z-10 bg-background pb-2">
              <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
            </div>

            {monthLoading ? (
              <div className="space-y-3 mt-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-[160px] w-full rounded-xl" />
                ))}
              </div>
            ) : monthContracts.length === 0 ? (
              <EmptyState
                icon={CalendarRange}
                title={`No merchants for ${formatMonthYear(selectedMonth)}`}
                description="No contracts have been set up for this month yet."
              />
            ) : (
              <>
                <div className="mb-3 mt-3 text-sm text-muted-foreground">
                  {monthSummary.merchantsCount} merchants · {monthSummary.weekendsTotal} weekends availed total
                </div>
                <div className="space-y-3">
                  {monthContracts.map((c) => {
                    const totalOwed = computeTotalOwed(c);
                    const totalCollected =
                      c.payments?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;
                    const progress = totalOwed > 0 ? (totalCollected / totalOwed) * 100 : 0;

                    return (
                      <Card key={c.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-mono">
                            <BoothTypeBadge type={c.booth_type} />
                            <span>{c.booth_number}</span>
                          </div>
                          <StatusBadge status={c.payment_status} />
                        </div>

                        <div className="mt-2 font-semibold">
                          {c.merchant?.business_name ?? ""}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {c.merchant?.name ?? ""}
                        </div>

                        <div className="mt-2 text-sm">
                          {c.weekends_availed} weekend(s) · Base rent: {formatPHP(c.base_rent)}
                        </div>

                        <div className="mt-3">
                          <Progress value={progress} className="h-2" />
                          <div className="mt-1 text-xs text-muted-foreground">
                            Paid: {formatPHP(totalCollected)} / {formatPHP(totalOwed)}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="mt-3 text-primary text-sm"
                          onClick={() =>
                            router.push(`/protected/reservations/contracts/${c.id}`)
                          }
                        >
                          View Contract →
                        </button>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <FabButton label="Add Merchant" href="/protected/merchants/new" />

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={(open) => {
            if (!deleting) setConfirmOpen(open);
          }}
          title="Delete Merchant?"
          description="This will permanently delete the merchant and all their reservations. This cannot be undone."
          onConfirm={confirmDelete}
          loading={deleting}
        />
      </div>
    </DashboardLayout>
  );
}

