"use client";

import { type ComponentType, type ReactNode, useEffect, useMemo, useState } from "react";
import { Banknote, BarChart3, Receipt, Store, TrendingDown } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Expense, MonthlyContract, Weekend } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  sumContractCollectedAmounts,
  sumContractOutstanding,
  sumExpenses,
} from "@/components/reports/report-utils";

interface OverviewStatsProps {
  monthYear: string;
}

interface StatValues {
  rentCollected: number;
  outstandingRent: number;
  uniqueMerchantsReserved: number;
  totalCapacity: number;
  totalExpenses: number;
  net: number;
}

type ContractWithPayments = MonthlyContract & {
  payments?: { amount: number; payment_type?: string }[] | null;
};

function StatCard({
  icon: Icon,
  iconClassName,
  value,
  label,
  subLabel,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  value: ReactNode;
  label: string;
  subLabel: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="pt-4 pb-3">
        <div className={cn("h-8 w-8 rounded-lg p-1.5", iconClassName)}>
          <Icon className="h-full w-full" />
        </div>
        <div className="mt-2">{value}</div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{subLabel}</div>
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Skeleton key={idx} className="h-[132px] w-full rounded-xl" />
      ))}
      <Skeleton className="col-span-2 h-[132px] w-full rounded-xl" />
    </div>
  );
}

const INITIAL_STATS: StatValues = {
  rentCollected: 0,
  outstandingRent: 0,
  uniqueMerchantsReserved: 0,
  totalCapacity: 10,
  totalExpenses: 0,
  net: 0,
};

export function OverviewStats({ monthYear }: OverviewStatsProps) {
  const [stats, setStats] = useState<StatValues>(INITIAL_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchStats = async () => {
      setLoading(true);
      const supabase = createClient();

      const [weekendsRes, contractsRes, expensesRes] = await Promise.all([
        supabase
          .from("weekends")
          .select("id, outdoor_booths_available")
          .eq("month_year", monthYear),
        supabase
          .from("monthly_contracts")
          .select("*, payments:contract_payments(amount, payment_type)")
          .eq("month_year", monthYear),
        supabase
          .from("expenses")
          .select("amount")
          .eq("month_year", monthYear),
      ]);

      if (!active) return;

      if (weekendsRes.error || contractsRes.error || expensesRes.error) {
        setStats(INITIAL_STATS);
        setLoading(false);
        return;
      }

      const weekends = (weekendsRes.data as Pick<Weekend, "id" | "outdoor_booths_available">[]) ?? [];
      const contracts = (contractsRes.data as ContractWithPayments[]) ?? [];
      const expenses = (expensesRes.data as Pick<Expense, "amount">[]) ?? [];

      const rentCollected = sumContractCollectedAmounts(contracts);
      const outstandingRent = sumContractOutstanding(contracts);
      const uniqueMerchantsReserved = new Set(contracts.map((contract) => contract.merchant_id)).size;
      const totalCapacity = 10 + (weekends.some((weekend) => weekend.outdoor_booths_available) ? 3 : 0);
      const totalExpenses = sumExpenses(expenses);
      const net = rentCollected - totalExpenses;

      setStats({
        rentCollected,
        outstandingRent,
        uniqueMerchantsReserved,
        totalCapacity,
        totalExpenses,
        net,
      });
      setLoading(false);
    };

    void fetchStats();

    return () => {
      active = false;
    };
  }, [monthYear]);

  const netIconColors = useMemo(
    () =>
      stats.net >= 0
        ? "bg-green-100 text-green-600"
        : "bg-red-100 text-red-600",
    [stats.net],
  );

  if (loading) {
    return <StatsSkeleton />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={Banknote}
        iconClassName="bg-green-100 text-green-600"
        value={
          <CurrencyDisplay
            amount={stats.rentCollected}
            className="block text-2xl font-bold"
          />
        }
        label="Rent Collected"
        subLabel="This month"
      />

      <StatCard
        icon={TrendingDown}
        iconClassName="bg-amber-100 text-amber-600"
        value={
          <CurrencyDisplay
            amount={stats.outstandingRent}
            className="block text-2xl font-bold"
          />
        }
        label="Outstanding"
        subLabel="Pending collection"
      />

      <StatCard
        icon={Store}
        iconClassName="bg-blue-100 text-blue-600"
        value={
          <div className="text-2xl font-bold">
            {stats.uniqueMerchantsReserved} / {stats.totalCapacity}
          </div>
        }
        label="Booth Occupancy"
        subLabel="Booths reserved"
      />

      <StatCard
        icon={Receipt}
        iconClassName="bg-red-100 text-red-600"
        value={
          <CurrencyDisplay
            amount={stats.totalExpenses}
            className="block text-2xl font-bold"
          />
        }
        label="Total Expenses"
        subLabel="All categories"
      />

      <StatCard
        icon={BarChart3}
        iconClassName={netIconColors}
        value={<CurrencyDisplay amount={stats.net} className="block text-2xl font-bold" />}
        label="Net"
        subLabel="Revenue minus expenses"
        className="col-span-2"
      />
    </div>
  );
}
