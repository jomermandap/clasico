"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Merchant, MonthlyContract } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import type { MerchantFormData } from "@/components/merchants/merchant-form";
import { MerchantForm } from "@/components/merchants/merchant-form";
import { BoothTypeBadge } from "@/components/shared/booth-type-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { computeTotalOwed, formatMonthYear, formatPHP } from "@/lib/utils";

type ContractWithJoins = MonthlyContract & {
  payments?: { amount: number }[];
  attendances?: { id: string }[];
};

export default function MerchantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [contracts, setContracts] = useState<ContractWithJoins[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);

  useEffect(() => {
    const fetchMerchant = async () => {
      if (!params?.id) return;
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("merchants")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) {
        toast.error("Failed to load merchant.");
        setMerchant(null);
        setLoading(false);
        return;
      }

      setMerchant(data as Merchant);
      setLoading(false);
    };

    void fetchMerchant();
  }, [params?.id]);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!params?.id) return;
      setContractsLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("monthly_contracts")
        .select("*, payments:contract_payments(amount), attendances:weekend_attendances(id)")
        .eq("merchant_id", params.id)
        .order("month_year", { ascending: false });

      if (error) {
        setContracts([]);
        setContractsLoading(false);
        return;
      }

      setContracts((data as unknown as ContractWithJoins[]) ?? []);
      setContractsLoading(false);
    };

    void fetchContracts();
  }, [params?.id]);

  const contractCards = useMemo(() => {
    return contracts.map((c) => {
      const totalOwed = computeTotalOwed(c);
      const totalCollected =
        c.payments?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;
      const attendanceCount = c.attendances?.length ?? 0;
      return { c, totalOwed, totalCollected, attendanceCount };
    });
  }, [contracts]);

  const handleSubmit = async (data: MerchantFormData) => {
    if (!merchant) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("merchants")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", merchant.id);

    if (error) {
      toast.error("Failed to save changes. Please try again.");
      setSaving(false);
      return;
    }

    toast.success("Changes saved");
    router.push("/protected/merchants");
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!merchant) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("merchants")
      .delete()
      .eq("id", merchant.id);

    if (error) {
      toast.error("Failed to delete merchant.");
      setDeleting(false);
      return;
    }

    toast.success("Merchant deleted");
    setDeleting(false);
    setDeleteOpen(false);
    router.push("/protected/merchants");
  };

  if (!loading && !merchant) {
    return (
      <DashboardLayout title="Merchants">
        <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
          <EmptyState
            icon={AlertCircle}
            title="Merchant not found"
            description="This merchant may have been deleted."
            action={{
              label: "Back to Merchants",
              href: "/protected/merchants",
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Merchants">
      <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
        <PageHeader
          title={merchant?.business_name ?? "Merchant"}
          backHref="/protected/merchants"
        />

        {merchant && (
          <>
            <MerchantForm
              initialData={merchant}
              onSubmit={handleSubmit}
              loading={saving}
            />

            <Separator className="my-6" />

            <h3 className="mb-3 text-base font-semibold">
              Contract History
            </h3>

            {contractsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-[120px] w-full rounded-xl" />
                ))}
              </div>
            ) : contractCards.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No contracts yet. This merchant hasn&apos;t been added to any weekends.
              </div>
            ) : (
              <div className="space-y-3">
                {contractCards.map(({ c, totalCollected, totalOwed, attendanceCount }) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left"
                    onClick={() =>
                      router.push(`/protected/reservations/contracts/${c.id}`)
                    }
                  >
                    <Card className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-semibold">
                          {formatMonthYear(c.month_year)}
                        </div>
                        <StatusBadge status={c.payment_status} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <BoothTypeBadge type={c.booth_type} />
                        <span className="font-mono text-muted-foreground">
                          {c.booth_number}
                        </span>
                        <span className="text-muted-foreground">
                          {c.weekends_availed} weekend(s)
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Paid: {formatPHP(totalCollected)} / {formatPHP(totalOwed)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {attendanceCount} weekend(s) scheduled
                      </div>
                    </Card>
                  </button>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="destructive"
              className="mt-6 h-11 w-full"
              onClick={() => setDeleteOpen(true)}
            >
              Delete Merchant
            </Button>
          </>
        )}

        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            if (!deleting) setDeleteOpen(open);
          }}
          title="Delete Merchant?"
          description="All reservations for this merchant will also be deleted. This cannot be undone."
          onConfirm={handleDelete}
          loading={deleting}
        />
      </div>
    </DashboardLayout>
  );
}

