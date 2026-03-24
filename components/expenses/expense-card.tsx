import { MoreVertical } from "lucide-react";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CurrencyDisplay } from "@/components/shared/currency-display";

const CATEGORY_BADGE_COLORS: Record<ExpenseCategory, string> = {
  "Staff / Labor": "bg-violet-100 text-violet-700",
  Utilities: "bg-yellow-100 text-yellow-700",
  "Permits & Compliance": "bg-sky-100 text-sky-700",
  "Supplies & Maintenance": "bg-teal-100 text-teal-700",
  "Marketing & Promotions": "bg-pink-100 text-pink-700",
  Equipment: "bg-orange-100 text-orange-700",
  "Penalties & Fines": "bg-red-100 text-red-700",
  Miscellaneous: "bg-slate-100 text-slate-700",
};

interface ExpenseCardProps {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const formattedDate = new Date(expense.expense_date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <Badge
          className={CATEGORY_BADGE_COLORS[expense.category as ExpenseCategory]}
        >
          {expense.category}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Expense actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2 font-medium">{expense.description}</div>

      <div className="mt-1 flex items-center justify-between gap-3">
        <CurrencyDisplay amount={expense.amount} size="md" className="font-bold" />
        <span className="text-sm text-muted-foreground">{formattedDate}</span>
      </div>

      {(expense.logged_by || expense.weekend) && (
        <div className="mt-1 text-xs text-muted-foreground">
          {expense.logged_by ? `Logged by ${expense.logged_by}` : ""}
          {expense.logged_by && expense.weekend ? " · " : ""}
          {expense.weekend ? expense.weekend.label : ""}
        </div>
      )}

      {expense.receipt_note && (
        <div className="mt-1 text-xs italic text-muted-foreground">
          Ref: {expense.receipt_note}
        </div>
      )}
    </Card>
  );
}
