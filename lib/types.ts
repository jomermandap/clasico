export type BoothType = "wall" | "garden" | "outdoor";
export type PaymentOption = "A" | "B";
export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface Merchant {
  id: string;
  name: string;
  business_name: string;
  contact_number?: string;
  email?: string;
  booth_type: BoothType;
  booth_number: string;
  product_category?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Weekend {
  id: string;
  label: string;
  month_year: string;
  date_start: string;
  date_end: string;
  outdoor_booths_available: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Reservation {
  id: string;
  merchant_id: string;
  weekend_id: string;
  booth_type: BoothType;
  weekends_availed: number;
  base_rent: number;
  payment_option?: PaymentOption;
  security_deposit: number;
  security_deposit_paid: boolean;
  downpayment_amount: number;
  downpayment_paid: boolean;
  balance_amount: number;
  balance_paid: boolean;
  extra_brand_fee: number;
  high_wattage_fee: number;
  space_penalty: number;
  ingress_egress_penalty: number;
  other_fees: number;
  other_fees_note?: string;
  payment_status: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  merchant?: Merchant;
  weekend?: Weekend;
}

export interface Expense {
  id: string;
  month_year: string;
  weekend_id?: string;
  category: string;
  description: string;
  amount: number;
  receipt_note?: string;
  logged_by?: string;
  expense_date: string;
  created_at: string;
  updated_at: string;
  weekend?: Weekend;
}

export const EXPENSE_CATEGORIES = [
  "Staff / Labor",
  "Utilities",
  "Permits & Compliance",
  "Supplies & Maintenance",
  "Marketing & Promotions",
  "Equipment",
  "Penalties & Fines",
  "Miscellaneous",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const BOOTH_NUMBERS: Record<BoothType, string[]> = {
  wall: [
    "Booth #1",
    "Booth #2",
    "Booth #3",
    "Booth #4",
    "Booth #5",
    "Booth #6",
    "Booth #7",
    "Booth #8",
  ],
  garden: ["Garden Booth #1", "Garden Booth #2"],
  outdoor: ["Outdoor Booth #1", "Outdoor Booth #2", "Outdoor Booth #3"],
};

export const PRODUCT_CATEGORIES = [
  "Food & Beverage",
  "Clothing & Apparel",
  "Accessories",
  "Beauty & Wellness",
  "Art & Crafts",
  "Home & Decor",
  "Plants & Garden",
  "Other",
] as const;

export interface MonthlyContract {
  id: string;
  merchant_id: string;
  month_year: string;
  booth_type: BoothType;
  booth_number: string;
  weekends_availed: number;
  base_rent: number;
  payment_option?: PaymentOption;
  security_deposit: number;
  downpayment_amount: number;
  balance_amount: number;
  extra_brand_fee: number;
  high_wattage_fee: number;
  space_penalty: number;
  ingress_egress_penalty: number;
  other_fees: number;
  other_fees_note?: string;
  payment_status: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  merchant?: Merchant;
  attendances?: WeekendAttendance[];
  payments?: ContractPayment[];
}

export interface ContractPayment {
  id: string;
  contract_id: string;
  payment_type: 'security_deposit' | 'downpayment' | 'balance' | 'partial' | 'other';
  amount: number;
  payment_date: string;
  reference_note?: string;
  logged_by?: string;
  notes?: string;
  created_at: string;
}

export interface WeekendAttendance {
  id: string;
  contract_id: string;
  weekend_id: string;
  booth_number?: string;
  notes?: string;
  created_at: string;
  contract?: MonthlyContract;
  weekend?: Weekend;
}

export const PAYMENT_TYPES = [
  { value: 'security_deposit', label: 'Security Deposit' },
  { value: 'downpayment', label: 'Downpayment' },
  { value: 'balance', label: 'Balance' },
  { value: 'partial', label: 'Partial Payment' },
  { value: 'other', label: 'Other' },
] as const;
