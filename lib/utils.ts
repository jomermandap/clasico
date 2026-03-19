import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PaymentOption, PaymentStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function formatPHP(amount: number): string {
  return (
    "₱" +
    amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function computePaymentStatus(params: {
  payment_option: PaymentOption | null | undefined;
  security_deposit_paid: boolean;
  downpayment_paid: boolean;
  balance_paid: boolean;
}): PaymentStatus {
  const {
    payment_option,
    security_deposit_paid,
    downpayment_paid,
    balance_paid,
  } = params;
  if (!payment_option) return "unpaid";
  if (payment_option === "B") {
    return security_deposit_paid && downpayment_paid ? "paid" : "unpaid";
  }
  if (security_deposit_paid && downpayment_paid && balance_paid) return "paid";
  if (security_deposit_paid && downpayment_paid) return "partial";
  return "unpaid";
}

export function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  })} – ${end.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function computeTotalOwed(contract: {
  base_rent: number; security_deposit: number;
  extra_brand_fee: number; high_wattage_fee: number;
  space_penalty: number; ingress_egress_penalty: number; other_fees: number;
}): number {
  return contract.base_rent + contract.security_deposit +
    contract.extra_brand_fee + contract.high_wattage_fee +
    contract.space_penalty + contract.ingress_egress_penalty + contract.other_fees;
}

export function computeContractPaymentStatus(totalOwed: number, totalCollected: number): PaymentStatus {
  if (totalCollected <= 0) return 'unpaid';
  if (totalCollected >= totalOwed) return 'paid';
  return 'partial';
}

