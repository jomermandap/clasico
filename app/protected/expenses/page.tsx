"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ExpenseCategoryGroup } from "@/components/expenses/expense-category-group";
import { ExpenseForm } from "@/components/expenses/expense-form";
import type { ExpenseFormData } from "@/components/expenses/expense-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { FabButton } from "@/components/shared/fab-button";
import { MonthSelector } from "@/components/shared/month-selector";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES, type Expense, type Weekend } from "@/lib/types";
import { formatMonthYear, getCurrentMonthYear } from "@/lib/utils";

type ExpenseWithWeekend = Expense & {
  weekend?: Weekend | null;
};

export default function ExpensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMonth = useMemo(() => {
    const fromUrl = searchParams.get("month");
    return fromUrl && /^\d{4}-\d{2}$/.test(fromUrl)
      ? fromUrl
      : getCurrentMonthYear();
  }, [searchParams]);

  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [expenses, setExpenses] = useState<ExpenseWithWeekend[]>([]);
  const [weekends, setWeekends] = useState<Weekend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    router.replace(`/protected/expenses?month=${selectedMonth}`);
  }, [router, selectedMonth]);

  const fetchData = useCallback(async (monthYear: string) => {
    setLoading(true);
    const supabase = createClient();

    const [expensesRes, weekendsRes] = await Promise.all([
      supabase
        .from("expenses")
        .select("*, weekend:weekends(*)")
        .eq("month_year", monthYear)
        .order("expense_date", { ascending: false }),
      supabase
        .from("weekends")
        .select("id, label, date_start, date_end, month_year")
        .eq("month_year", monthYear)
        .order("date_start", { ascending: true }),
    ]);

    if (expensesRes.error || weekendsRes.error) {
      setExpenses([]);
      setWeekends([]);
      setLoading(false);
      toast.error("Failed to load expenses.");
      return;
    }

    setExpenses((expensesRes.data as ExpenseWithWeekend[]) ?? []);
    setWeekends((weekendsRes.data as Weekend[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData(selectedMonth);
  }, [fetchData, selectedMonth]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0),
    [expenses],
  );

  const groupedExpenses = useMemo(() => {
    const sumCategory = (items: Expense[]) =>
      items.reduce((sum, item) => sum + (item.amount ?? 0), 0);

    return EXPENSE_CATEGORIES
      .map((category) => ({
        category,
        expenses: expenses.filter((expense) => expense.category === category),
      }))
      .filter((group) => group.expenses.length > 0)
      .sort((a, b) => sumCategory(b.expenses) - sumCategory(a.expenses));
  }, [expenses]);

  const openCreateSheet = () => {
    setEditingExpense(null);
    setSheetOpen(true);
  };

  const openEditSheet = (expense: Expense) => {
    setEditingExpense(expense);
    setSheetOpen(true);
  };

  const handleSubmit = async (data: ExpenseFormData) => {
    setFormLoading(true);
    const supabase = createClient();

    const payload = {
      expense_date: data.expense_date,
      category: data.category,
      description: data.description,
      amount: data.amount,
      weekend_id: data.weekend_id ?? null,
      receipt_note: data.receipt_note ?? null,
      logged_by: data.logged_by ?? null,
    };

    if (editingExpense) {
      const { error } = await supabase
        .from("expenses")
        .update(payload)
        .eq("id", editingExpense.id);

      if (error) {
        toast.error("Failed to update expense.");
        setFormLoading(false);
        return;
      }

      toast.success("Expense updated.");
    } else {
      const { error } = await supabase
        .from("expenses")
        .insert({ ...payload, month_year: selectedMonth });

      if (error) {
        toast.error("Failed to log expense.");
        setFormLoading(false);
        return;
      }

      toast.success("Expense logged.");
    }

    await fetchData(selectedMonth);
    setFormLoading(false);
    setSheetOpen(false);
    setEditingExpense(null);
  };

  const requestDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    setDeleting(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", deletingId);

    if (error) {
      toast.error("Failed to delete expense.");
      setDeleting(false);
      return;
    }

    toast.success("Expense deleted.");
    setDeleting(false);
    setDeleteDialogOpen(false);
    setDeletingId(null);
    await fetchData(selectedMonth);
  };

  return (
    <DashboardLayout title="Expenses">
      <div className="mx-auto w-full max-w-3xl px-2 pb-24 pt-0 md:px-4">
        <div className="sticky top-0 z-10 bg-background pb-2">
          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
        </div>

        <div className="mb-4 mt-2">
          <p className="text-sm text-muted-foreground">Total this month</p>
          <CurrencyDisplay amount={totalExpenses} size="lg" />
        </div>

        {loading && (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <section key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-[124px] w-full rounded-xl" />
                <Skeleton className="h-[124px] w-full rounded-xl" />
              </section>
            ))}
          </div>
        )}

        {!loading && expenses.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="No expenses logged"
            description={`Tap the button below to log the first expense for ${formatMonthYear(selectedMonth)}.`}
          />
        )}

        {!loading && expenses.length > 0 && (
          <div className="space-y-6">
            {groupedExpenses.map((group) => (
              <ExpenseCategoryGroup
                key={group.category}
                category={group.category}
                expenses={group.expenses}
                categoryTotal={group.expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0)}
                onEdit={openEditSheet}
                onDelete={requestDelete}
              />
            ))}
          </div>
        )}

        <FabButton label="Log Expense" onClick={openCreateSheet} />

        <Sheet
          open={sheetOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditingExpense(null);
              setFormLoading(false);
            }
            setSheetOpen(open);
          }}
        >
          <SheetContent
            side="bottom"
            className="h-[90vh] overflow-y-auto rounded-t-2xl pb-8"
          >
            <SheetHeader>
              <SheetTitle>{editingExpense ? "Edit Expense" : "Log Expense"}</SheetTitle>
            </SheetHeader>

            <ExpenseForm
              monthYear={selectedMonth}
              availableWeekends={weekends}
              initialData={editingExpense ?? undefined}
              loading={formLoading}
              onSubmit={handleSubmit}
            />
          </SheetContent>
        </Sheet>

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            if (!deleting) {
              setDeleteDialogOpen(open);
              if (!open) setDeletingId(null);
            }
          }}
          title="Delete Expense?"
          description="This expense will be permanently removed."
          onConfirm={() => void confirmDelete()}
          loading={deleting}
        />
      </div>
    </DashboardLayout>
  );
}
