"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { MonthSelector } from "@/components/shared/month-selector";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type {
  ContractPayment,
  Expense,
  Merchant,
  MonthlyContract,
  Weekend,
  WeekendAttendance,
} from "@/lib/types";
import { formatMonthYear, getCurrentMonthYear } from "@/lib/utils";
import { ReportExpenseSection } from "@/components/reports/report-expense-section";
import { ReportMerchantBreakdown } from "@/components/reports/report-merchant-breakdown";
import { ReportNetSection } from "@/components/reports/report-net-section";
import { ReportOutstanding } from "@/components/reports/report-outstanding";
import { ReportRevenueSection } from "@/components/reports/report-revenue-section";
import { sumContractCollectedAmounts, sumExpenses } from "@/components/reports/report-utils";

type ContractWithJoins = MonthlyContract & {
  merchant?: Merchant;
  payments?: Pick<ContractPayment, "id" | "amount" | "payment_type">[] | null;
  attendances?: (WeekendAttendance & { weekend?: Weekend | null })[] | null;
};

type ExpenseWithWeekend = Expense & {
  weekend?: Weekend | null;
};

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMonth = useMemo(() => {
    const fromUrl = searchParams.get("month");
    return fromUrl && /^\d{4}-\d{2}$/.test(fromUrl)
      ? fromUrl
      : getCurrentMonthYear();
  }, [searchParams]);

  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<ContractWithJoins[]>([]);
  const [expenses, setExpenses] = useState<ExpenseWithWeekend[]>([]);
  const [weekends, setWeekends] = useState<Weekend[]>([]);

  useEffect(() => {
    router.replace(`/protected/reports?month=${selectedMonth}`);
  }, [router, selectedMonth]);

  const fetchData = useCallback(async (monthYear: string) => {
    setLoading(true);
    const supabase = createClient();

    const [contractsRes, expensesRes, weekendsRes] = await Promise.all([
      supabase
        .from("monthly_contracts")
        .select(
          "*, merchant:merchants(*), payments:contract_payments(id, amount, payment_type), attendances:weekend_attendances(*, weekend:weekends(*))",
        )
        .eq("month_year", monthYear),
      supabase
        .from("expenses")
        .select("*, weekend:weekends(*)")
        .eq("month_year", monthYear)
        .order("expense_date", { ascending: true }),
      supabase
        .from("weekends")
        .select("*")
        .eq("month_year", monthYear)
        .order("date_start", { ascending: true }),
    ]);

    if (contractsRes.error || expensesRes.error || weekendsRes.error) {
      setContracts([]);
      setExpenses([]);
      setWeekends([]);
      setLoading(false);
      return;
    }

    setContracts((contractsRes.data as ContractWithJoins[]) ?? []);
    setExpenses((expensesRes.data as ExpenseWithWeekend[]) ?? []);
    setWeekends((weekendsRes.data as Weekend[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData(selectedMonth);
  }, [fetchData, selectedMonth]);

  const totalCollected = useMemo(
    () => sumContractCollectedAmounts(contracts),
    [contracts],
  );
  const totalExpenses = useMemo(() => sumExpenses(expenses), [expenses]);
  const generatedOn = useMemo(
    () =>
      new Date().toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  return (
    <DashboardLayout title="Report">
      <div className="mx-auto w-full max-w-5xl px-2 py-2 pb-24 md:px-4">
        <div className="no-print">
          <PageHeader title="Audit Report" />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="w-full max-w-sm">
              <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
            </div>
            <Button
              type="button"
              variant="outline"
              className="no-print"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="hidden print-header mb-6">
          <div className="text-2xl font-bold">Clásico Events</div>
          <div className="text-lg">{formatMonthYear(selectedMonth)} Audit Report</div>
          <div className="text-sm text-muted-foreground">Generated: {generatedOn}</div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-6">
            <Skeleton className="h-[180px] w-full rounded-xl" />
            <Skeleton className="h-[140px] w-full rounded-xl" />
            <Skeleton className="h-[100px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            <ReportRevenueSection contracts={contracts} />
            <ReportExpenseSection expenses={expenses} />
            <ReportNetSection
              totalCollected={totalCollected}
              totalExpenses={totalExpenses}
            />
            <ReportMerchantBreakdown
              weekends={weekends}
              contracts={contracts}
            />
            <ReportOutstanding contracts={contracts} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
