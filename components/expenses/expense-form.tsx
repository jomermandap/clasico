"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Expense, Weekend } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE_WEEKEND_VALUE = "__none__";

export interface ExpenseFormData {
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  weekend_id?: string;
  receipt_note?: string;
  logged_by?: string;
}

interface ExpenseFormProps {
  monthYear: string;
  availableWeekends: Weekend[];
  initialData?: Partial<Expense>;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  loading?: boolean;
}

interface FormErrors {
  expense_date?: string;
  category?: string;
  description?: string;
  amount?: string;
}

function getTodayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export function ExpenseForm({
  monthYear,
  availableWeekends,
  initialData,
  onSubmit,
  loading = false,
}: ExpenseFormProps) {
  const [expenseDate, setExpenseDate] = useState<string>(getTodayIso());
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [weekendId, setWeekendId] = useState<string>(NONE_WEEKEND_VALUE);
  const [receiptNote, setReceiptNote] = useState<string>("");
  const [loggedBy, setLoggedBy] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (initialData) {
      setExpenseDate(initialData.expense_date ?? getTodayIso());
      setCategory(initialData.category ?? "");
      setDescription(initialData.description ?? "");
      setAmount(
        typeof initialData.amount === "number" ? String(initialData.amount) : "",
      );
      setWeekendId(initialData.weekend_id ?? NONE_WEEKEND_VALUE);
      setReceiptNote(initialData.receipt_note ?? "");
      setLoggedBy(initialData.logged_by ?? "");
      setErrors({});
      return;
    }

    setExpenseDate(getTodayIso());
    setCategory("");
    setDescription("");
    setAmount("");
    setWeekendId(NONE_WEEKEND_VALUE);
    setReceiptNote("");
    setLoggedBy("");
    setErrors({});
  }, [initialData, monthYear]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedAmount = Number(amount);
    const nextErrors: FormErrors = {
      expense_date: expenseDate ? undefined : "Date is required.",
      category: category ? undefined : "Category is required.",
      description: description.trim() ? undefined : "Description is required.",
      amount:
        Number.isFinite(parsedAmount) && parsedAmount > 0
          ? undefined
          : "Amount is required.",
    };

    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    await onSubmit({
      expense_date: expenseDate,
      category,
      description: description.trim(),
      amount: parsedAmount,
      weekend_id:
        weekendId !== NONE_WEEKEND_VALUE && weekendId ? weekendId : undefined,
      receipt_note: receiptNote.trim() || undefined,
      logged_by: loggedBy.trim() || undefined,
    });
  };

  return (
    <form className="space-y-4 px-4 pb-4" onSubmit={(event) => void handleSubmit(event)}>
      <div className="space-y-2">
        <Label htmlFor="expense_date">Date*</Label>
        <Input
          id="expense_date"
          type="date"
          value={expenseDate}
          onChange={(event) => setExpenseDate(event.target.value)}
        />
        {errors.expense_date && (
          <p className="text-xs text-destructive">{errors.expense_date}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Category*</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description*</Label>
        <Input
          id="description"
          placeholder="What was this expense for?"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount*</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            ₱
          </span>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            className="pl-7"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
      </div>

      <div className="space-y-2">
        <Label>Linked Weekend</Label>
        <Select value={weekendId} onValueChange={setWeekendId}>
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_WEEKEND_VALUE}>None</SelectItem>
            {availableWeekends.map((weekend) => (
              <SelectItem key={weekend.id} value={weekend.id}>
                {weekend.label} · {formatDateRange(weekend.date_start, weekend.date_end)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="receipt_note">Receipt / Reference Note</Label>
        <Input
          id="receipt_note"
          placeholder="GCash ref, OR number, etc."
          value={receiptNote}
          onChange={(event) => setReceiptNote(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logged_by">Logged By</Label>
        <Input
          id="logged_by"
          placeholder="Your name"
          value={loggedBy}
          onChange={(event) => setLoggedBy(event.target.value)}
        />
      </div>

      <Button type="submit" className="h-12 w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        Save Expense
      </Button>
    </form>
  );
}
