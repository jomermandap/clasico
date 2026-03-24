import type { Expense } from "@/lib/types";
import { formatPHP } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sumExpenses } from "@/components/reports/report-utils";

interface ReportExpenseSectionProps {
  expenses: Expense[];
}

export function ReportExpenseSection({ expenses }: ReportExpenseSectionProps) {
  const totalsByCategory = expenses.reduce<Record<string, number>>((acc, expense) => {
    if (!expense.category) return acc;
    acc[expense.category] = (acc[expense.category] ?? 0) + (expense.amount ?? 0);
    return acc;
  }, {});

  const rows = Object.entries(totalsByCategory)
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1]);

  const totalExpenses = sumExpenses(expenses);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Summary</CardTitle>
      </CardHeader>

      <CardContent>
        {rows.map(([category, total]) => (
          <div
            key={category}
            className="flex items-center justify-between border-b py-2 text-sm"
          >
            <span>{category}</span>
            <span>{formatPHP(total)}</span>
          </div>
        ))}

        <div className="flex items-center justify-between py-2 text-sm font-semibold">
          <span>Total Expenses</span>
          <span>{formatPHP(totalExpenses)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
