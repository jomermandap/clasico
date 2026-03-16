"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import type { MerchantFormData } from "@/components/merchants/merchant-form";
import { MerchantForm } from "@/components/merchants/merchant-form";
import { PageHeader } from "@/components/shared/page-header";

export default function NewMerchantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (data: MerchantFormData) => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("merchants").insert({
      ...data,
      is_active: typeof data.is_active === "boolean" ? data.is_active : true,
    });

    if (error) {
      toast.error("Failed to add merchant. Please try again.");
      setLoading(false);
      return;
    }

    // Reset form state before navigating away so the next visit starts clean.
    setFormKey((prev) => prev + 1);
    setLoading(false);
    toast.success("Merchant added!");
    router.push("/protected/merchants");
  };

  return (
    <DashboardLayout title="Merchants">
      <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
        <PageHeader title="Add Merchant" backHref="/protected/merchants" />
        <MerchantForm key={formKey} onSubmit={handleSubmit} loading={loading} />
      </div>
    </DashboardLayout>
  );
}

