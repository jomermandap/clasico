"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Store, SearchX } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import type { Merchant } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/shared/empty-state";
import { FabButton } from "@/components/shared/fab-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MerchantCard } from "@/components/merchants/merchant-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type TabFilter = "all" | "active" | "inactive";

export default function MerchantsPage() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <DashboardLayout title="Merchants">
      <div className="mx-auto w-full max-w-3xl px-2 pb-24 pt-0 md:px-4 md:pt-1">
        <p className="mb-2 text-sm text-muted-foreground">
          Manage your booth merchants.
        </p>

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

