import type { Expense } from "@/lib/types";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { ExpenseCard } from "@/components/expenses/expense-card";

interface ExpenseCategoryGroupProps {
  category: string;
  expenses: Expense[];
  categoryTotal: number;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseCategoryGroup({
  category,
  expenses,
  categoryTotal,
  onEdit,
  onDelete,
}: ExpenseCategoryGroupProps) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {category}
        </h2>
        <CurrencyDisplay amount={categoryTotal} size="sm" className="font-semibold" />
      </div>

      <div className="space-y-2">
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            onEdit={() => onEdit(expense)}
            onDelete={() => onDelete(expense.id)}
          />
        ))}
      </div>
    </section>
  );
}
