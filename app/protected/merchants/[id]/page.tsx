"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Merchant } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import type { MerchantFormData } from "@/components/merchants/merchant-form";
import { MerchantForm } from "@/components/merchants/merchant-form";
import { MerchantReservationHistory } from "@/components/merchants/merchant-reservation-history";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function MerchantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
              Reservation History
            </h3>
            <MerchantReservationHistory merchantId={merchant.id} />

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

