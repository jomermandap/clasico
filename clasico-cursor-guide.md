# Clásico — Cursor Build Guide
## Step-by-Step Instructions + Prompts

---

## Before You Start

1. Open your `clasico-main` project in Cursor
2. Have the PRD file (`clasico-prd.md`) open in a tab — you'll reference it every session
3. Make sure your `.env.local` has your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   ```
4. Each session = one Cursor chat. **Start a new chat for each session** so context stays clean.

---

## SESSION 1 — Foundation
### What you're building:
- Supabase database schema
- TypeScript types, rate constants, utility helpers
- Install missing shadcn components
- Mobile-first layout (bottom nav on mobile, sidebar on desktop)
- All shared components

### Step 1A — Run the SQL in Supabase FIRST (do this before opening Cursor)
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Paste and run this:

```sql
-- MERCHANTS
create table merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_name text not null,
  contact_number text,
  email text,
  booth_type text not null check (booth_type in ('wall', 'garden', 'outdoor')),
  booth_number text not null,
  product_category text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- WEEKENDS
create table weekends (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  month_year text not null,
  date_start date not null,
  date_end date not null,
  outdoor_booths_available boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- RESERVATIONS
create table reservations (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  weekend_id uuid not null references weekends(id) on delete cascade,
  booth_type text not null check (booth_type in ('wall', 'garden', 'outdoor')),
  weekends_availed integer not null check (weekends_availed between 1 and 5),
  base_rent numeric(10,2) not null,
  payment_option text check (payment_option in ('A', 'B')),
  security_deposit numeric(10,2) default 2000,
  security_deposit_paid boolean default false,
  downpayment_amount numeric(10,2) default 0,
  downpayment_paid boolean default false,
  balance_amount numeric(10,2) default 0,
  balance_paid boolean default false,
  extra_brand_fee numeric(10,2) default 0,
  high_wattage_fee numeric(10,2) default 0,
  space_penalty numeric(10,2) default 0,
  ingress_egress_penalty numeric(10,2) default 0,
  other_fees numeric(10,2) default 0,
  other_fees_note text,
  payment_status text default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(merchant_id, weekend_id)
);

-- EXPENSES
create table expenses (
  id uuid primary key default gen_random_uuid(),
  month_year text not null,
  weekend_id uuid references weekends(id),
  category text not null,
  description text not null,
  amount numeric(10,2) not null,
  receipt_note text,
  logged_by text,
  expense_date date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table merchants enable row level security;
alter table weekends enable row level security;
alter table reservations enable row level security;
alter table expenses enable row level security;

create policy "auth_full_access" on merchants for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on weekends for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on reservations for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on expenses for all using (auth.role() = 'authenticated');
```

4. Verify all 4 tables appear in the **Table Editor** before continuing.

---

### Step 1B — Cursor Prompt

Open a new Cursor chat. Paste this entire prompt:

---

```
I'm building an internal tracking system called Clásico for a weekend market business in Davao City. The project is Next.js 15 App Router with Supabase, Tailwind CSS v3, and shadcn/ui already installed and configured.

The Supabase SQL migrations have already been run. Tables exist: merchants, weekends, reservations, expenses — all with RLS for authenticated users only.

Complete these tasks IN ORDER. Do not build any feature pages yet.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 1 — Install missing shadcn components
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run these commands:
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add skeleton
npx shadcn@latest add switch
npx shadcn@latest add tabs
npx shadcn@latest add textarea
npx shadcn@latest add sonner
npx shadcn@latest add separator
npx shadcn@latest add alert
npx shadcn@latest add collapsible
npx shadcn@latest add progress

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 2 — Create lib/types.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type BoothType = 'wall' | 'garden' | 'outdoor';
export type PaymentOption = 'A' | 'B';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

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
  'Staff / Labor',
  'Utilities',
  'Permits & Compliance',
  'Supplies & Maintenance',
  'Marketing & Promotions',
  'Equipment',
  'Penalties & Fines',
  'Miscellaneous',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const BOOTH_NUMBERS: Record<BoothType, string[]> = {
  wall: ['Booth #1','Booth #2','Booth #3','Booth #4','Booth #5','Booth #6','Booth #7','Booth #8'],
  garden: ['Garden Booth #1', 'Garden Booth #2'],
  outdoor: ['Outdoor Booth #1', 'Outdoor Booth #2', 'Outdoor Booth #3'],
};

export const PRODUCT_CATEGORIES = [
  'Food & Beverage',
  'Clothing & Apparel',
  'Accessories',
  'Beauty & Wellness',
  'Art & Crafts',
  'Home & Decor',
  'Plants & Garden',
  'Other',
] as const;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 3 — Create lib/rates.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { BoothType } from './types';

export const WALL_RATES: Record<number, number> = {
  1: 4900,
  2: 9000,
  3: 12000,
  4: 15000,
  5: 17000,
};

// Garden and Outdoor share the same rate tier (TBD — set to 0 until confirmed)
export const GARDEN_OUTDOOR_RATES: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

export const SECURITY_DEPOSIT = 2000;
export const EXTRA_BRAND_FEE = 500;
export const HIGH_WATTAGE_FEE_PER_UNIT = 500;
export const SPACE_PENALTY_PER_INCH = 100;
export const INGRESS_PENALTY_PER_30MIN = 250;

export function getRateForBoothType(boothType: BoothType, weekendsAvailed: number): number {
  if (boothType === 'wall') return WALL_RATES[weekendsAvailed] ?? 0;
  return GARDEN_OUTDOOR_RATES[weekendsAvailed] ?? 0;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 4 — Update lib/utils.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keep the existing cn() utility. ADD these functions:

import { PaymentOption, PaymentStatus } from './types';

export function formatPHP(amount: number): string {
  return '₱' + amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function computePaymentStatus(params: {
  payment_option: PaymentOption | null | undefined;
  security_deposit_paid: boolean;
  downpayment_paid: boolean;
  balance_paid: boolean;
}): PaymentStatus {
  const { payment_option, security_deposit_paid, downpayment_paid, balance_paid } = params;
  if (!payment_option) return 'unpaid';
  if (payment_option === 'B') {
    return (security_deposit_paid && downpayment_paid) ? 'paid' : 'unpaid';
  }
  if (security_deposit_paid && downpayment_paid && balance_paid) return 'paid';
  if (security_deposit_paid && downpayment_paid) return 'partial';
  return 'unpaid';
}

export function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 5 — Create shared components
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All components: mobile-first, minimum 44px touch targets, use shadcn/ui primitives.

FILE: components/shared/month-selector.tsx
- "use client"
- Props: value (YYYY-MM string), onChange: (value: string) => void
- Layout: full-width row — ChevronLeft button | month label centered | ChevronRight button
- Use shadcn Button (variant="ghost", size="icon") for arrows
- Display month using formatMonthYear() from lib/utils.ts
- Clicking arrows correctly handles month boundary (Dec → Jan wraps year)

FILE: components/shared/status-badge.tsx
- Props: status: PaymentStatus
- Uses shadcn Badge
- unpaid: bg-red-100 text-red-700 border-red-200
- partial: bg-amber-100 text-amber-700 border-amber-200
- paid: bg-green-100 text-green-700 border-green-200
- Capitalize label. text-xs font-medium.

FILE: components/shared/booth-type-badge.tsx
- Props: type: BoothType
- Uses shadcn Badge
- wall: bg-blue-100 text-blue-700 border-blue-200, label "Wall"
- garden: bg-emerald-100 text-emerald-700 border-emerald-200, label "Garden"
- outdoor: bg-orange-100 text-orange-700 border-orange-200, label "Outdoor"

FILE: components/shared/currency-display.tsx
- Props: amount: number, className?: string, size?: 'sm' | 'md' | 'lg'
- Renders formatPHP(amount)
- size: sm = text-sm, md = text-base, lg = text-xl font-bold
- Default: font-semibold text-base

FILE: components/shared/empty-state.tsx
- Props: icon: LucideIcon, title: string, description: string, action?: { label: string, href?: string, onClick?: () => void }
- Centered layout, py-12, icon 48px text-muted-foreground
- title: font-semibold, description: text-sm text-muted-foreground mt-1
- If action: shadcn Button below (mt-4)
- If action.href: wrap Button in Next.js Link

FILE: components/shared/fab-button.tsx
- Props: onClick?: () => void, href?: string, label: string, icon?: LucideIcon (defaults to Plus)
- fixed bottom-24 right-4 z-40
- shadcn Button: rounded-full shadow-lg h-14 px-5 gap-2
- Icon (20px) + label text
- If href: wrap in Next.js Link

FILE: components/shared/page-header.tsx
- Props: title: string, description?: string, action?: ReactNode, backHref?: string
- If backHref: show ChevronLeft icon button as a Next.js Link before the title
- title: text-xl font-semibold tracking-tight
- description: text-sm text-muted-foreground mt-0.5
- action: right side (flex justify-between)
- Bottom margin: mb-4

FILE: components/shared/confirm-dialog.tsx
- Props: open: boolean, onOpenChange: (open: boolean) => void, title: string, description: string, onConfirm: () => void, confirmLabel?: string (default "Delete"), variant?: 'destructive' | 'default' (default 'destructive'), loading?: boolean
- shadcn Dialog with DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- Cancel button (variant="outline") + Confirm button
- Confirm button: variant="destructive" if variant prop is destructive, shows spinner icon when loading=true
- Disable both buttons when loading=true

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 6 — Refactor dashboard layout
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create a components/dashboard/ folder. Move dashboard-related files there.

FILE: components/dashboard/bottom-nav.tsx
- "use client"
- className: fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t
- style: { paddingBottom: 'env(safe-area-inset-bottom)' }
- 5 tabs in a flex row, each flex-1:
  1. Overview — Home icon — /protected
  2. Merchants — Store icon — /protected/merchants
  3. Reservations — CalendarRange icon — /protected/reservations
  4. Expenses — Receipt icon — /protected/expenses
  5. Report — FileBarChart2 icon — /protected/reports
- Each tab: flex flex-col items-center justify-center py-2 min-h-[56px] w-full
- Icon: h-5 w-5. Label: text-[10px] mt-1 font-medium
- Active (usePathname startsWith): text-primary. Inactive: text-muted-foreground
- Active tab: small div at top of tab, h-0.5 w-8 bg-primary rounded-full mb-1

FILE: components/dashboard/dashboard-layout.tsx (full rewrite)
- "use client"
- Props: children: ReactNode, title: string
- Desktop (md+): left sidebar 260px + main content. Sidebar has:
  - Header: Store icon + "Clásico" text + notification bell
  - Nav sections (Market): Overview, Merchants, Reservations, Expenses
  - Nav section (Insights): Report
  - User dropdown at bottom (same logout logic as before)
  - Active link: bg-accent text-primary. Hover: bg-accent/50
- Mobile: no sidebar. Header bar with "Clásico" title + user dropdown (CircleUser icon).
  Main content: pt-2 pb-24 (pb-24 to clear bottom nav + safe area)
- BottomNav rendered on mobile only (it handles its own md:hidden)
- Remove search bar entirely

After completing all tasks, list every file created or modified. Do not build any feature pages.
```

---

### After Session 1 — Test Checklist
- [ ] `npm run dev` runs with no errors
- [ ] Open on your phone — bottom nav shows with 5 tabs
- [ ] Tap each tab — navigates (pages will be empty/error, that's fine)
- [ ] On desktop — sidebar shows, bottom nav hidden
- [ ] Check Supabase Table Editor — all 4 tables exist

---
---

## SESSION 2 — Merchants
### What you're building:
- Merchant list with search + filter tabs
- Add merchant form
- Merchant detail + edit + delete
- Reservation history per merchant

### Cursor Prompt

Open a **new** Cursor chat. Paste this:

---

```
Continuing to build the Clásico internal tracking system. Session 1 is complete — schema, types (lib/types.ts), rates (lib/rates.ts), utilities (lib/utils.ts), shared components (components/shared/), and layout (components/dashboard/) are all done.

Build the MERCHANTS feature only this session. Do not touch any other feature or any file outside components/merchants/ and app/protected/merchants/.

Key context:
- Booth types: wall (Booth #1–#8), garden (Garden Booth #1–#2), outdoor (Outdoor Booth #1–#3)
- All types, constants, and utilities are already in lib/types.ts, lib/rates.ts, lib/utils.ts
- Shared components are in components/shared/ — use them: StatusBadge, BoothTypeBadge, EmptyState, FABButton, PageHeader, ConfirmDialog, CurrencyDisplay
- Use shadcn/ui: Card, CardContent, CardHeader, Button, Input, Select, SelectTrigger, SelectContent, SelectItem, Switch, Badge, Skeleton, Label, Textarea, Separator
- Use Sonner for toasts: import { toast } from 'sonner'
- Mobile-first. Cards on mobile. Min 44px touch targets. No horizontal scroll.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 1: components/merchants/merchant-form.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"use client"
Props:
  initialData?: Partial<Merchant>
  onSubmit: (data: MerchantFormData) => Promise<void>
  loading?: boolean

Define MerchantFormData type inline or export it:
{
  name: string
  business_name: string
  contact_number?: string
  email?: string
  booth_type: BoothType
  booth_number: string
  product_category?: string
  notes?: string
  is_active?: boolean
}

Form fields using shadcn Label + Input/Select/Switch pattern:
1. Business Name* — Input, full width
2. Contact Person Name* — Input, full width
3. Contact Number — Input, placeholder "09XX XXX XXXX"
4. Email — Input type="email"
5. Booth Type* — shadcn Select:
   - Options: { value: 'wall', label: 'Wall Booth' }, { value: 'garden', label: 'Garden Booth' }, { value: 'outdoor', label: 'Outdoor Booth' }
   - When this changes: clear booth_number field
6. Booth Number* — shadcn Select, options from BOOTH_NUMBERS[selectedBoothType]
   - Disabled until booth type is selected
7. Product Category — shadcn Select with PRODUCT_CATEGORIES
8. Notes — shadcn Textarea, rows=3
9. Active (Switch) — only render if initialData exists (edit mode only), default true

Validation rules (no form library needed, use simple useState):
  - business_name: required
  - name: required
  - booth_type: required
  - booth_number: required
  Show red text-sm error message below the field if validation fails on submit attempt

Submit button:
  - Full width, h-12
  - Text: "Save Merchant" (edit) or "Add Merchant" (new)
  - Disabled + spinner when loading=true

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 2: components/merchants/merchant-card.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Props: merchant: Merchant, onEdit: () => void, onDelete: () => void

shadcn Card, full width, p-4:
Row 1: BoothTypeBadge (type=merchant.booth_type) + " " + merchant.booth_number (text-sm font-mono) on left
       Active indicator on right: green dot (●) "Active" or gray dot "Inactive" in text-xs

Row 2: merchant.business_name — text-lg font-semibold mt-2

Row 3: merchant.name — text-sm text-muted-foreground (with User icon, 14px)

Row 4 (if product_category): text-sm text-muted-foreground with Tag icon

Row 5 (if contact_number): text-sm text-muted-foreground with Phone icon

Row 6 (actions): flex gap-2 mt-3 pt-3 border-t
  - "Edit" button: variant="outline" size="sm" flex-1, onClick=onEdit
  - "Delete" button: variant="ghost" size="sm", text-destructive, onClick=onDelete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 3: components/merchants/merchant-reservation-history.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"use client"
Props: merchantId: string

Fetches from Supabase (client-side):
  SELECT reservations.*, weekends.* FROM reservations
  JOIN weekends ON reservations.weekend_id = weekends.id
  WHERE reservations.merchant_id = merchantId
  ORDER BY weekends.date_start DESC

For each reservation, show a compact row:
  - Weekend label + formatDateRange(date_start, date_end)
  - StatusBadge
  - Amount paid: formatPHP(total_paid) + " / " + formatPHP(total_billed)
    total_paid = (security_deposit_paid ? security_deposit : 0) + (downpayment_paid ? downpayment_amount : 0) + (balance_paid ? balance_amount : 0)
    total_billed = base_rent + security_deposit + extra_brand_fee + high_wattage_fee + space_penalty + ingress_egress_penalty + other_fees
  - Separated by Separator component

Show Skeleton (3 rows) while loading.
Show EmptyState (CalendarX icon, "No reservations yet", "Reservations will appear here once added.") if empty.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 4: app/protected/merchants/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"use client" (needs search/filter state)

On mount: fetch all merchants from Supabase ordered by business_name asc.

Layout:
  PageHeader title="Merchants" description="Manage your booth merchants"

  Search: shadcn Input with Search icon (left), placeholder "Search merchants...", value bound to searchQuery state
    Filter: client-side, matches business_name OR name (case insensitive)

  Tabs (shadcn Tabs): "All" | "Active" | "Inactive"
    Filter merchants by is_active accordingly

  List: filtered merchants mapped to MerchantCard
    Each card: onEdit → router.push('/protected/merchants/' + id)
    onDelete → opens ConfirmDialog state

  ConfirmDialog:
    title="Delete Merchant?"
    description="This will permanently delete the merchant and all their reservations. This cannot be undone."
    onConfirm: DELETE from merchants WHERE id=selectedId, then refresh list, toast.success("Merchant deleted")

  EmptyState conditions:
    - No merchants at all: Store icon, "No merchants yet", "Add your first merchant to get started.", action { label: "Add Merchant", href: "/protected/merchants/new" }
    - Search with no results: Search icon, "No results for '[query]'", "Try a different name or booth number."

  FABButton label="Add Merchant" href="/protected/merchants/new"

  Show Skeleton (4 MerchantCard shapes) while initial fetch is loading.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 5: app/protected/merchants/loading.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Export default function that renders:
  - PageHeader-shaped skeleton (h-7 w-32 for title)
  - Input-shaped skeleton for search
  - Tabs-shaped skeleton
  - 4 Card skeletons that match MerchantCard proportions:
    Each: h-[160px] rounded-xl
Use shadcn Skeleton component throughout.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 6: app/protected/merchants/new/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"use client"
Imports: MerchantForm, createClient (from lib/supabase/client), useRouter, toast

PageHeader title="Add Merchant" backHref="/protected/merchants"

Renders MerchantForm (no initialData).

onSubmit handler:
  1. Set loading = true
  2. const supabase = createClient()
  3. const { error } = await supabase.from('merchants').insert({ ...data })
  4. If error: toast.error('Failed to add merchant. Please try again.'), set loading = false
  5. If success: toast.success('Merchant added!'), router.push('/protected/merchants')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 7: app/protected/merchants/[id]/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"use client"
Reads params.id. Fetches merchant by id from Supabase on mount.
If not found: show EmptyState (AlertCircle icon, "Merchant not found", "This merchant may have been deleted.", action { label: "Back to Merchants", href: "/protected/merchants" })

PageHeader title={merchant.business_name} backHref="/protected/merchants"

MerchantForm in edit mode (initialData=merchant).

onSubmit handler:
  UPDATE merchants SET { ...data, updated_at: new Date().toISOString() } WHERE id=merchant.id
  On success: toast.success("Changes saved"), re-fetch merchant to show updated data
  On error: toast.error("Failed to save changes. Please try again.")

Below form: shadcn Separator, then:
  h3 "Reservation History" text-base font-semibold mb-3
  MerchantReservationHistory merchantId={merchant.id}

Bottom: Delete Merchant button (variant="destructive", full width, mt-6)
  Opens ConfirmDialog:
    title="Delete Merchant?"
    description="All reservations for this merchant will also be deleted. This cannot be undone."
    onConfirm: DELETE from merchants WHERE id=merchant.id, toast.success("Merchant deleted"), router.push('/protected/merchants')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 8: app/protected/merchants/[id]/loading.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Skeleton matching the edit page layout:
  - PageHeader skeleton
  - Form field skeletons (8 fields, each ~h-10 with a label skeleton above)
  - Separator
  - "Reservation History" title skeleton + 3 row skeletons

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Every Supabase call handles the { data, error } return — always show toast.error on failure
- All forms disable inputs + show spinner on submit loading state
- Zero TypeScript errors — all types imported from lib/types.ts
- Do not modify any file outside components/merchants/ and app/protected/merchants/
- After completing, list every file created
```

---

### After Session 2 — Test Checklist
- [ ] Merchant list page loads on phone
- [ ] Add a real merchant — booth type → booth number filtering works
- [ ] Merchant card shows correct badges and info
- [ ] Search filters correctly
- [ ] Active / Inactive tabs work
- [ ] Edit pre-fills the form correctly
- [ ] Delete shows confirm dialog, then removes the merchant
- [ ] Reservation history shows "No reservations yet" (expected at this stage)

---
---

## SESSION 3 — Reservations
### What you're building:
- Month setup (create 4–5 weekends)
- Reservations month view
- Weekend detail page (shows merchants attending that weekend)
- Adding a merchant to a weekend (creates/reuses their monthly contract + attendance row)
- Contract detail (payment history, log payment, weekend assignments)

> ⚠️ Most complex session. Read through the schema changes before opening Cursor.

### Step 3A — Run new SQL in Supabase FIRST

The original guide mentioned a `reservations` table. **Do not create that.** Instead run this:

```sql
-- Monthly contract: one per merchant per month
create table monthly_contracts (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  month_year text not null,
  booth_type text not null check (booth_type in ('wall', 'garden', 'outdoor')),
  booth_number text not null,
  weekends_availed integer not null check (weekends_availed between 1 and 5),
  base_rent numeric(10,2) not null,
  payment_option text check (payment_option in ('A', 'B')),
  security_deposit numeric(10,2) default 2000,
  downpayment_amount numeric(10,2) default 0,
  balance_amount numeric(10,2) default 0,
  extra_brand_fee numeric(10,2) default 0,
  high_wattage_fee numeric(10,2) default 0,
  space_penalty numeric(10,2) default 0,
  ingress_egress_penalty numeric(10,2) default 0,
  other_fees numeric(10,2) default 0,
  other_fees_note text,
  payment_status text default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(merchant_id, month_year)
);

-- Every actual peso collected against a contract
create table contract_payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references monthly_contracts(id) on delete cascade,
  payment_type text not null check (payment_type in (
    'security_deposit', 'downpayment', 'balance', 'partial', 'other'
  )),
  amount numeric(10,2) not null,
  payment_date date not null default current_date,
  reference_note text,
  logged_by text,
  notes text,
  created_at timestamptz default now()
);

-- Which specific weekends a merchant attends under a contract
create table weekend_attendances (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references monthly_contracts(id) on delete cascade,
  weekend_id uuid not null references weekends(id) on delete cascade,
  booth_number text,
  notes text,
  created_at timestamptz default now(),
  unique(contract_id, weekend_id)
);

-- RLS
alter table monthly_contracts enable row level security;
alter table contract_payments enable row level security;
alter table weekend_attendances enable row level security;

create policy "auth_full_access" on monthly_contracts for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on contract_payments for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on weekend_attendances for all using (auth.role() = 'authenticated');
```

Verify all 3 new tables appear in Supabase Table Editor before continuing.

### Step 3B — Update lib/types.ts and lib/utils.ts manually

Open `lib/types.ts` and **add** these interfaces at the bottom (do not remove anything):

```ts
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
```

Open `lib/utils.ts` and **add** these two functions:

```ts
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
```

### Cursor Prompt

Open a **new** Cursor chat. Paste this:


---

```
Continuing to build the Clasico internal tracking system. Sessions 1 and 2 are complete (foundation + merchants).

IMPORTANT — the data model for this feature uses THREE tables, not one:

1. monthly_contracts — one per merchant per month. Stores booth, weekends_availed (1-5), rate tier, payment option, all fee amounts. ONE contract per merchant per month (unique constraint in DB).

2. contract_payments — one row per actual payment received. Stores: contract_id, payment_type, amount (real pesos, not a boolean), payment_date, reference_note, logged_by.

3. weekend_attendances — one row per weekend a merchant attends. Links contract_id + weekend_id. No payment info here at all.

All three tables already exist in Supabase with RLS enabled. Types are in lib/types.ts: MonthlyContract, ContractPayment, WeekendAttendance. Utility functions computeTotalOwed() and computeContractPaymentStatus() are in lib/utils.ts.

Key business rules:
- One contract per merchant per month (enforced by DB unique constraint). If a contract already exists for that merchant+month, do not create a new one — reuse it.
- Weekend attendances cannot exceed weekends_availed on the contract. Show counter "X of Y weekends scheduled."
- payment_status is computed from: totalCollected (sum of contract_payments.amount) vs totalOwed (computeTotalOwed()). Use computeContractPaymentStatus() always.
- totalOwed = base_rent + security_deposit + all add-on fees
- downpayment_amount = Option A: base_rent * 0.5, Option B: base_rent
- balance_amount = Option A: base_rent * 0.5, Option B: 0

Entry point for everything is the WEEKEND VIEW. The team opens a weekend and sees who is attending. They add merchants from there.

UI flow when tapping "Add Merchant" on a weekend:
  Step 1 — Pick merchant (searchable select from active merchants)
  Step 2 — Check if contract already exists for merchant + this weekend's month_year:
    IF NO CONTRACT EXISTS: show contract form fields (weekends_availed, payment option, fees, notes) then save contract + attendance in one action
    IF CONTRACT EXISTS: skip straight to confirmation — just show contract summary (booth, weekends availed, payment status, slots remaining) and confirm adding them to this weekend
  Validation: if contract.attendances.length >= contract.weekends_availed, block adding and show "This merchant has already used all X of their weekends for this month."

Build the following files only. Do not touch anything outside components/reservations/ and app/protected/reservations/.

Shared components available in components/shared/: StatusBadge, BoothTypeBadge, EmptyState, FABButton, PageHeader, ConfirmDialog, CurrencyDisplay, MonthSelector.
shadcn: Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Sheet, SheetContent, SheetHeader, SheetTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Label, Input, Textarea, Alert, AlertDescription, Collapsible, CollapsibleTrigger, CollapsibleContent, Progress, Badge, Skeleton, Separator, Tabs, TabsList, TabsTrigger, TabsContent.
Sonner: import { toast } from 'sonner'
All types from lib/types.ts. Utilities from lib/utils.ts. Rates from lib/rates.ts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 1: components/reservations/month-setup-form.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"use client"
Props: monthYear: string, onComplete: () => void

State: array of 4 weekend entries, expandable to 5.
Each entry: { label: string, date_start: string, outdoor_booths_available: boolean }
date_end: auto-computed as date_start + 3 days, shown as read-only text.

UI:
  Heading: "Set up [formatMonthYear(monthYear)]"
  Description: "Define the weekends for this month. Each weekend runs Thursday to Sunday."

  For each weekend slot (shadcn Card, compact p-3):
    Row 1: editable Label input (pre-filled "Weekend 1" etc.)
    Row 2: "Start Date (Thursday)" Input type="date" + auto-computed end date shown as "Thu [date] - Sun [date]"
    Row 3: shadcn Switch "Outdoor Booths Available this weekend" (default off)

  "+ Add 5th Weekend" ghost button — only visible when showing 4 slots

  "Create Weekends" Button full width primary

Validation on submit:
  - All date_start fields must be filled
  - Each must be a Thursday (getDay() === 4). Show "Must be a Thursday" inline error if not.
  - No duplicate dates

On submit: batch INSERT into weekends table. On success: toast.success("Weekends created!"), onComplete().

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 2: components/reservations/weekend-card.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Props: weekend: Weekend, attendanceCount: number, capacity: number, onClick: () => void

shadcn Card, p-4, hover:bg-accent/30 cursor-pointer transition:
  Row 1: weekend.label font-semibold | if outdoor_booths_available: BoothTypeBadge type="outdoor" (right)
  Row 2: formatDateRange(date_start, date_end) text-sm text-muted-foreground
  Row 3: shadcn Progress value={(attendanceCount/capacity)*100} className="h-1.5 mt-2"
  Row 4: "{attendanceCount} / {capacity} merchants" text-xs text-muted-foreground mt-1
  Row 5: "Manage" Button variant="outline" full width mt-3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 3: components/reservations/attendance-row.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Props:
  attendance: WeekendAttendance (with contract and merchant joined)
  onViewContract: () => void
  onRemove: () => void

This is one row in the weekend detail page merchant list.

shadcn Card p-3:
  Row 1 (flex justify-between):
    Left: BoothTypeBadge (contract.booth_type) + " " + (attendance.booth_number ?? contract.booth_number) text-sm font-mono
    Right: StatusBadge (contract.payment_status)
  Row 2: contract.merchant.business_name font-semibold
  Row 3: contract.merchant.name text-sm text-muted-foreground

  Payment summary (text-xs text-muted-foreground mt-1):
    totalOwed = computeTotalOwed(contract)
    totalCollected = sum of contract.payments (if joined) — show as "Paid: formatPHP(collected) / formatPHP(owed)"
    If payment_status is 'partial': show remaining in amber "formatPHP(owed - collected) remaining"

  Row (actions, mt-2 pt-2 border-t flex gap-2):
    "View Contract" Button variant="outline" size="sm" flex-1 onClick=onViewContract
    "Remove" Button variant="ghost" size="sm" text-destructive onClick=onRemove

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 4: components/reservations/add-merchant-sheet.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"use client"
Props:
  open: boolean
  onOpenChange: (open: boolean) => void
  weekend: Weekend
  allWeekendsThisMonth: Weekend[]
  onSuccess: () => void

This is the sheet that slides up when tapping "Add Merchant" on the weekend detail page.
It handles the smart two-step flow:

Internal state:
  step: 'select_merchant' | 'contract_form' | 'confirm_existing'
  selectedMerchant: Merchant | null
  existingContract: MonthlyContract | null (fetched when merchant is selected)
  formLoading: boolean

  Contract form fields state (only used when no existing contract):
    weekendsAvailed: number (1-5, default 1)
    paymentOption: 'A' | 'B' | null
    boothNumber: string (defaults to merchant.booth_number)
    extraBrandFee, highWattageFee, spacePenalty, ingressPenalty, otherFees: number (all default 0)
    otherFeesNote: string
    notes: string

STEP 1 — select_merchant:
  SheetHeader: "Add Merchant to {weekend.label}"
  
  Searchable merchant select:
    Label "Select Merchant"
    shadcn Select showing all active merchants as "{business_name} — {booth_number}"
    When merchant selected:
      Fetch monthly_contracts WHERE merchant_id = selected AND month_year = weekend.month_year
      Also fetch weekend_attendances for that contract to check slots used
      If contract found AND attendances.length >= contract.weekends_availed:
        Show Alert variant="destructive": "{merchant.business_name} has already used all {weekends_availed} weekend(s) for {formatMonthYear(month_year)}. No slots remaining."
        Disable continue button
      If contract found AND slots available: set existingContract, move to step 'confirm_existing'
      If no contract: move to step 'contract_form'

STEP 2a — confirm_existing (contract already exists):
  SheetHeader: "Confirm Attendance"
  
  Show contract summary card:
    Merchant name + business name
    BoothTypeBadge + booth number
    "Contract: {weekendsAvailed} weekends in {formatMonthYear(month_year)}"
    StatusBadge + "Paid: formatPHP(collected) / formatPHP(owed)"
    "Weekends scheduled: {attendances.length} of {weekends_availed} — {remaining} remaining after this"
  
  Info text: "Adding {business_name} to {weekend.label}. Payment is already tracked on their existing contract."
  
  "Confirm & Add" Button full width primary
  "Back" ghost button

  On confirm:
    INSERT into weekend_attendances { contract_id: existingContract.id, weekend_id: weekend.id, booth_number: existingContract.booth_number }
    On success: toast.success("{business_name} added to {weekend.label}!"), onSuccess(), close sheet

STEP 2b — contract_form (no contract yet):
  SheetHeader: "New Contract + Add to {weekend.label}"
  Description text: "This merchant doesn't have a contract for {formatMonthYear(month_year)} yet. Set it up now."

  Form sections (shadcn Cards):

  SECTION — Contract Details:
    Booth Number (select, options from BOOTH_NUMBERS[merchant.booth_type], default merchant.booth_number)
    Weekends Availing This Month:
      Stepper: "-" Button | number (1-5, text-xl font-bold w-12 text-center) | "+" Button
      Below stepper: computed base rent shown large:
        boothType = selectedMerchant.booth_type
        baseRent = getRateForBoothType(boothType, weekendsAvailed)
        If baseRent > 0: "Base Rent: formatPHP(baseRent)" text-lg font-bold text-primary
        If baseRent === 0: "Base Rent: TBD" text-sm text-muted-foreground
      Below rent: "Weekend 1 of {weekendsAvailed} will be {weekend.label}" text-xs text-muted-foreground (this weekend counts as the first one being scheduled)

  SECTION — Payment Option (shadcn Card):
    Two tappable cards side by side (grid grid-cols-2 gap-2):
      Option A card: title "Option A", subtitle "50% Down", computed amount formatPHP(baseRent*0.5), note "Balance before 1st weekend"
      Option B card: title "Option B", subtitle "Full Payment", computed amount formatPHP(baseRent), note "Secures slot faster"
      Selected: ring-2 ring-primary

  SECTION — Add-on Fees (shadcn Collapsible, collapsed by default):
    Trigger shows "Add-on Fees" + if any > 0: "(formatPHP(total))"
    Fields: Extra Brand Fee (helper: "500 per brand"), High Wattage (helper: "500 per unit"), Space Penalty (helper: "100 per inch"), Ingress/Egress Penalty (helper: "250 per 30min"), Other Fees + note input

  Notes: Textarea

  "Create Contract & Add to Weekend" Button:
    Full width, primary, h-12
    Disabled if: !paymentOption or formLoading
    Spinner when loading

  "Back" ghost button above form

  On submit:
    1. INSERT into monthly_contracts:
       { merchant_id, month_year: weekend.month_year, booth_type: merchant.booth_type, booth_number, weekends_availed, base_rent: baseRent, payment_option, security_deposit: 2000, downpayment_amount, balance_amount, extra_brand_fee, high_wattage_fee, space_penalty, ingress_egress_penalty, other_fees, other_fees_note, payment_status: 'unpaid', notes }
    2. INSERT into weekend_attendances:
       { contract_id: newContract.id, weekend_id: weekend.id, booth_number }
    3. On success: toast.success("Contract created and {business_name} added to {weekend.label}!"), onSuccess(), close sheet
    4. On error:
       If error code is '23505' (unique violation on monthly_contracts): toast.error("This merchant already has a contract for this month. Refresh and try again.")
       Else: toast.error("Failed to save. Please try again.")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 5: components/reservations/log-payment-sheet.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"use client"
Props:
  open: boolean
  onOpenChange: (open: boolean) => void
  contract: MonthlyContract (with merchant joined)
  onSuccess: () => void

Sheet (side="bottom") for logging a payment installment against a contract.

SheetHeader:
  SheetTitle: "Log Payment"
  Description: "{contract.merchant.business_name} — {formatMonthYear(contract.month_year)}"

Contract summary at top (compact, shadcn Card bg-muted p-3):
  totalOwed = computeTotalOwed(contract)
  Show: "Total Owed: formatPHP(totalOwed)" | "Paid so far: formatPHP(totalCollected)" | StatusBadge
  Progress bar: (totalCollected / totalOwed) * 100

Payment form (space-y-4 mt-4):
  Payment Type: shadcn Select with PAYMENT_TYPES options
    Hint text per type:
      security_deposit: "₱2,000 security deposit"
      downpayment: Option A "₱{downpayment_amount} (50% of base rent)" | Option B "₱{downpayment_amount} (full payment)"
      balance: "₱{balance_amount} remaining balance" (only meaningful for Option A)
      partial: "Any amount — use for irregular / installment payments"
      other: "Any other payment"
  
  Amount:
    Input type="number" min="0.01" step="0.01"
    Relative ₱ prefix
    Quick-fill buttons below (text-xs): if type=security_deposit show "Fill ₱2,000" button; if type=downpayment show "Fill formatPHP(downpayment_amount)"; if type=balance show "Fill formatPHP(balance_amount)"
  
  Payment Date: Input type="date" default today
  
  Reference / GCash Ref: Input placeholder="GCash ref, receipt number, etc."
  
  Logged By: Input placeholder="Your name"
  
  Notes: Textarea rows=2

  "Log Payment" Button full width primary h-12, spinner when loading

On submit:
  1. INSERT into contract_payments { contract_id, payment_type, amount, payment_date, reference_note, logged_by, notes }
  2. Re-fetch all contract_payments for this contract, sum amounts
  3. Compute new status: computeContractPaymentStatus(totalOwed, newTotalCollected)
  4. UPDATE monthly_contracts SET payment_status = newStatus, updated_at = now() WHERE id = contract.id
  5. On success: toast.success("Payment of formatPHP(amount) logged!"), onSuccess(), close sheet
  6. On error: toast.error("Failed to log payment.")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 6: components/reservations/contract-detail-sheet.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"use client"
Props:
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId: string
  onPaymentLogged: () => void

Sheet (side="bottom", h-[92vh] overflow-y-auto rounded-t-2xl).
Fetches full contract on open: monthly_contracts + merchant + contract_payments + weekend_attendances (with weekends joined).

Shows:

Header section:
  Merchant business_name text-lg font-semibold
  merchant.name text-sm text-muted-foreground
  BoothTypeBadge + booth_number

Contract summary card (bg-muted rounded-lg p-3 space-y-2):
  Row: "Contract Period" | formatMonthYear(month_year)
  Row: "Weekends Availed" | "{weekends_availed} weekend(s)"
  Row: "Base Rent" | CurrencyDisplay amount=base_rent
  Row: "Security Deposit" | CurrencyDisplay amount=security_deposit
  If any add-ons > 0: Row "Add-on Fees" | CurrencyDisplay amount=totalAddons
  Row: "Total Owed" | CurrencyDisplay amount=totalOwed (font-bold)
  Separator
  Row: "Total Paid" | CurrencyDisplay amount=totalCollected (green if > 0)
  Row: "Remaining" | CurrencyDisplay amount=max(0, totalOwed - totalCollected) (amber if > 0)
  StatusBadge (large, centered)

"Log Payment" Button: variant="outline" full width — opens LogPaymentSheet nested (or sets a state flag to swap views)

Weekends Attending section:
  Title: "Weekends This Month ({attendances.length} / {weekends_availed})"
  List of weekend chips/badges: each shows weekend.label + formatDateRange
  If attendances.length < weekends_availed: show "{weekends_availed - attendances.length} slot(s) remaining" in muted text

Payment History section:
  Title: "Payment History"
  If no payments: "No payments logged yet" text-sm muted
  Else: list of ContractPayment rows (newest first):
    Each row: payment_type label | formatPHP(amount) font-semibold | date text-xs | reference_note text-xs muted | logged_by text-xs muted
  Total row: "Total Collected: formatPHP(totalCollected)" font-bold border-t pt-2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 7: app/protected/reservations/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"use client"

State: selectedMonth (YYYY-MM from ?month= URL param, default getCurrentMonthYear())
When month changes: router.replace with updated ?month= param.

Fetch on selectedMonth change:
  weekends = SELECT * FROM weekends WHERE month_year = selectedMonth ORDER BY date_start
  For each weekend: fetch COUNT of weekend_attendances WHERE weekend_id = weekend.id

Layout:
  PageHeader title="Reservations"
  MonthSelector value=selectedMonth onChange=setSelectedMonth (sticky top-0 bg-background z-10 pb-2)

  If loading: 4 skeleton cards h-[140px]

  If weekends.length === 0:
    Centered card (max-w-sm mx-auto mt-8):
      CalendarRange icon 48px muted centered
      "No weekends set up" font-semibold mt-3
      "Set up {formatMonthYear(selectedMonth)} to start tracking merchants." text-sm muted mt-1
      Separator my-4
      MonthSetupForm monthYear=selectedMonth onComplete={() => re-fetch weekends}

  If weekends.length > 0:
    space-y-3: WeekendCard for each weekend
      capacity = 10 + (outdoor_booths_available ? 3 : 0)
      attendanceCount = fetched count
      onClick: router.push('/protected/reservations/' + weekend.id)

app/protected/reservations/loading.tsx:
  MonthSelector skeleton + 4 card skeletons h-[140px]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 8: app/protected/reservations/[weekendId]/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"use client"
Reads params.weekendId.

On mount, fetch:
  1. weekend = weekends WHERE id = weekendId
  2. attendances = weekend_attendances WHERE weekend_id = weekendId
     joined with: contract (monthly_contracts *), merchant (via contract), payments (contract_payments aggregated or fetched separately)
  3. allWeekendsThisMonth = weekends WHERE month_year = weekend.month_year ORDER BY date_start

For each attendance, also fetch sum of contract_payments WHERE contract_id = attendance.contract_id to show collected amount.

State:
  addMerchantSheetOpen: boolean
  contractDetailSheetOpen: boolean
  selectedContractId: string | null
  logPaymentSheetOpen: boolean
  selectedContractForPayment: MonthlyContract | null
  removeDialogOpen: boolean
  removingAttendanceId: string | null

Layout:
  PageHeader
    title={weekend.label}
    description={formatDateRange(date_start, date_end)}
    backHref="/protected/reservations"

  Info bar (flex gap-3 flex-wrap text-sm text-muted-foreground mb-4):
    "{attendances.length} / {capacity} merchants this weekend"
    If outdoor_booths_available: BoothTypeBadge type="outdoor" + "Outdoor open"

  If attendances.length === 0:
    EmptyState icon=Store title="No merchants yet" description="Tap the button below to add the first merchant for this weekend."

  If attendances.length > 0:
    space-y-3: AttendanceRow for each attendance
      onViewContract: () => { setSelectedContractId(attendance.contract_id); setContractDetailSheetOpen(true) }
      onRemove: () => { setRemovingAttendanceId(attendance.id); setRemoveDialogOpen(true) }

  FABButton label="Add Merchant" onClick={() => setAddMerchantSheetOpen(true)}

  AddMerchantSheet
    open=addMerchantSheetOpen
    onOpenChange=setAddMerchantSheetOpen
    weekend=weekend
    allWeekendsThisMonth=allWeekendsThisMonth
    onSuccess={() => { setAddMerchantSheetOpen(false); re-fetch attendances }}

  ContractDetailSheet
    open=contractDetailSheetOpen
    onOpenChange=setContractDetailSheetOpen
    contractId=selectedContractId
    onPaymentLogged={() => re-fetch attendances (to refresh payment status shown on attendance rows)}

  ConfirmDialog
    open=removeDialogOpen
    title="Remove from this weekend?"
    description="This only removes the merchant from this specific weekend. Their monthly contract and payment records are not affected."
    confirmLabel="Remove"
    variant="destructive"
    onConfirm: DELETE from weekend_attendances WHERE id=removingAttendanceId, re-fetch, toast.success("Removed from weekend")

app/protected/reservations/[weekendId]/loading.tsx:
  PageHeader skeleton + info bar skeleton + 3 AttendanceRow-shaped skeletons h-[160px]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- computeContractPaymentStatus() and computeTotalOwed() from lib/utils.ts must be used everywhere — never duplicate this logic
- getRateForBoothType() from lib/rates.ts for all rent computation
- The "Remove from weekend" action ONLY deletes the weekend_attendance row — NEVER touches the monthly_contract or contract_payments
- All payment amounts in LogPaymentSheet and ContractDetailSheet must reflect actual sums from contract_payments rows, not stored fields
- Handle Supabase unique constraint error (code 23505) on monthly_contracts gracefully with a clear toast message
- Sheet for adding merchant: side="bottom", h-[92vh], overflow-y-auto, rounded-t-2xl
- No TypeScript errors — all types from lib/types.ts
- Do not modify any file outside components/reservations/ and app/protected/reservations/
- After completing, list every file created
```

---


### After Session 3 — Test Checklist
- [ ] Reservations page loads, shows empty state + MonthSetupForm inline
- [ ] Create 4 weekends using real upcoming Thursdays — verify they appear as WeekendCards
- [ ] Open a weekend → tap "Add Merchant"
- [ ] **New contract flow**: pick a merchant with no contract → sheet shows contract form → set weekends availed, pick Option A, submit → merchant appears in the weekend list with UNPAID badge
- [ ] Open same weekend → tap "Add Merchant" → pick same merchant → sheet shows "confirm existing" step with contract summary → confirm → correctly blocked if all slots used
- [ ] **Existing contract flow**: pick the same merchant for a second weekend → should show existing contract summary, no re-entry of payment info
- [ ] **Slots exhausted**: if merchant availed 1 weekend and already attending → adding to another weekend shows clear error "all weekends used"
- [ ] Tap "View Contract" on an attendance row → ContractDetailSheet opens with full summary, payment history (empty), weekends attending
- [ ] Tap "Log Payment" → LogPaymentSheet opens → enter an amount → payment history updates → status badge changes (unpaid → partial → paid)
- [ ] Log a second partial payment → total collected updates correctly
- [ ] Tap "Remove" on an attendance row → confirm dialog shows the right message (contract not deleted) → merchant removed from weekend, contract still exists
- [ ] Go to a different weekend in the same month → add the same merchant → existing contract is detected and reused
- [ ] Switch months → start a new month → same merchant can get a brand new contract

## SESSION 4 — Expenses
### What you're building:
- Expense list grouped by category
- Log expense form (in a bottom Sheet)
- Monthly total display

### Cursor Prompt

Open a **new** Cursor chat. Paste this:

---

```
Continuing the Clásico tracking system. Sessions 1–3 are complete (foundation, merchants, reservations).

Build the EXPENSES feature only. Do not modify any file outside components/expenses/ and app/protected/expenses/.

Shared components available in components/shared/.
shadcn: Card, Button, Sheet, SheetContent, SheetHeader, SheetTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Label, Textarea, Skeleton, Separator, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
Sonner: import { toast } from 'sonner'
Types: all from lib/types.ts. formatPHP, formatMonthYear, formatDateRange, getCurrentMonthYear from lib/utils.ts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 1: components/expenses/expense-form.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"use client"
Props:
  monthYear: string
  availableWeekends: Weekend[]
  initialData?: Partial<Expense>
  onSubmit: (data: ExpenseFormData) => Promise<void>
  loading?: boolean

Define ExpenseFormData:
{
  expense_date: string
  category: string
  description: string
  amount: number
  weekend_id?: string
  receipt_note?: string
  logged_by?: string
}

Fields (Label + shadcn Input/Select/Textarea, space-y-4):
  1. Date* — Input type="date", default today (new Date().toISOString().split('T')[0])
  2. Category* — shadcn Select with EXPENSE_CATEGORIES options
  3. Description* — Input, full width, placeholder "What was this expense for?"
  4. Amount* — div with relative positioning:
       Left-side ₱ label (absolute, vertically centered, pl-3, text-muted-foreground)
       Input type="number" min="0" step="0.01" pl-7 (paddingLeft for ₱ symbol)
  5. Linked Weekend (optional) — shadcn Select:
       Default option: "None"
       Options: availableWeekends mapped as value=id, label="{label} · {formatDateRange(...)}"
  6. Receipt / Reference Note — Input, placeholder "GCash ref, OR number, etc."
  7. Logged By — Input, placeholder "Your name"

Validation: expense_date, category, description, amount required. Show inline errors.

Submit button: "Save Expense", full width, h-12, spinner when loading

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 2: components/expenses/expense-card.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Props: expense: Expense, onEdit: () => void, onDelete: () => void

Category color mapping (hardcoded, use these exact classes):
  'Staff / Labor': 'bg-violet-100 text-violet-700'
  'Utilities': 'bg-yellow-100 text-yellow-700'
  'Permits & Compliance': 'bg-sky-100 text-sky-700'
  'Supplies & Maintenance': 'bg-teal-100 text-teal-700'
  'Marketing & Promotions': 'bg-pink-100 text-pink-700'
  'Equipment': 'bg-orange-100 text-orange-700'
  'Penalties & Fines': 'bg-red-100 text-red-700'
  'Miscellaneous': 'bg-slate-100 text-slate-700'

shadcn Card, p-4:
  Row 1 (flex justify-between items-start):
    Left: category Badge (apply color above), text-xs
    Right: shadcn DropdownMenu (trigger: MoreVertical icon, h-8 w-8 button)
      DropdownMenuItems: "Edit" (onClick=onEdit), "Delete" (onClick=onDelete, text-destructive)
  
  Row 2: expense.description — font-medium mt-2
  
  Row 3 (flex justify-between items-center mt-1):
    Left: CurrencyDisplay amount=expense.amount size="md" font-bold
    Right: text-sm text-muted-foreground (formatted date: e.g. "Mar 16")
  
  Row 4 (if expense.logged_by or expense.weekend):
    text-xs text-muted-foreground mt-1
    "Logged by {logged_by}" (if present) + (if weekend joined: " · {weekend.label}")
  
  Row 5 (if expense.receipt_note):
    text-xs text-muted-foreground italic "Ref: {receipt_note}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 3: components/expenses/expense-category-group.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Props: category: string, expenses: Expense[], categoryTotal: number, onEdit: (e: Expense) => void, onDelete: (id: string) => void

Layout:
  Section header row (flex justify-between items-center mb-2):
    Left: category name (text-sm font-semibold text-muted-foreground uppercase tracking-wide)
    Right: CurrencyDisplay amount=categoryTotal size="sm" className="font-semibold"
  
  Stack of ExpenseCard components (space-y-2)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 4: app/protected/expenses/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"use client"

State: selectedMonth (YYYY-MM from ?month= param or getCurrentMonthYear()), expenses[], weekends[], loading, sheetOpen, editingExpense: Expense | null, deleteDialogOpen, deletingId

Fetch on selectedMonth change:
  expenses = SELECT *, weekends(*) FROM expenses WHERE month_year = selectedMonth ORDER BY expense_date DESC
  weekends = SELECT * FROM weekends WHERE month_year = selectedMonth ORDER BY date_start

Group expenses by category:
  const grouped = EXPENSE_CATEGORIES
    .map(cat => ({ category: cat, expenses: expenses.filter(e => e.category === cat) }))
    .filter(g => g.expenses.length > 0)
    .sort((a, b) => sum(b.expenses) - sum(a.expenses))  // sort by total descending

totalExpenses = sum of all expense amounts

Layout:
  PageHeader title="Expenses"
  
  MonthSelector (sticky, value=selectedMonth, onChange updates URL + state)
  
  Total display (below selector, mb-4):
    "Total this month" text-sm text-muted-foreground
    CurrencyDisplay amount=totalExpenses size="lg"
  
  If loading: 3 category group skeletons
  
  If expenses.length === 0:
    EmptyState icon=Receipt title="No expenses logged" description="Tap the button below to log the first expense for {formatMonthYear(selectedMonth)}."
  
  Else: grouped.map → ExpenseCategoryGroup (space-y-6)
  
  FABButton label="Log Expense" onClick={() => { setEditingExpense(null); setSheetOpen(true) }}
  
  Sheet (side="bottom", open=sheetOpen, onOpenChange=setSheetOpen):
    SheetContent className="h-[90vh] overflow-y-auto rounded-t-2xl pb-8"
    SheetHeader: SheetTitle = editingExpense ? "Edit Expense" : "Log Expense"
    
    ExpenseForm
      monthYear={selectedMonth}
      availableWeekends={weekends}
      initialData={editingExpense ?? undefined}
      loading={formLoading}
      onSubmit={handleSubmit}
  
  handleSubmit:
    If editingExpense: UPDATE expenses WHERE id=editingExpense.id
    Else: INSERT into expenses { ...data, month_year: selectedMonth }
    On success: close sheet, re-fetch, toast.success
    On error: toast.error, keep sheet open
  
  ConfirmDialog for delete:
    title="Delete Expense?" description="This expense will be permanently removed."
    onConfirm: DELETE from expenses WHERE id=deletingId, refresh, toast.success

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE 5: app/protected/expenses/loading.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MonthSelector skeleton + total skeleton + 3 category group skeletons.
Each group skeleton: label skeleton + 2 ExpenseCard-shaped skeletons.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Category color mapping must be consistent between expense-card.tsx and any other place categories are shown
- All amounts use formatPHP() — never raw numbers
- No TypeScript errors
- Do not touch files outside components/expenses/ and app/protected/expenses/
```

---

### After Session 4 — Test Checklist
- [ ] Log 3–4 expenses across different categories
- [ ] They group by category with correct per-category totals
- [ ] Total at top matches sum of all
- [ ] Edit an expense → form pre-fills correctly
- [ ] Delete shows confirm dialog
- [ ] Switch months → expenses filter correctly
- [ ] Receipt note and logged-by show on the card
- [ ] Category badges have distinct colors

---
---

## SESSION 5 — Overview + Reports
### What you're building:
- Overview page with 5 live stat cards + "This Weekend" preview
- Full audit report (5 sections)
- PDF export via print CSS

### Cursor Prompt

Open a **new** Cursor chat. Paste this:

---

```
Continuing the Clásico tracking system. Sessions 1–4 are complete (foundation, merchants, reservations, expenses).

This final session: build the OVERVIEW page and REPORTS feature.

Allowed files to modify/create:
  - components/dashboard/overview-stats.tsx (new)
  - components/dashboard/this-weekend-preview.tsx (new)
  - app/protected/page.tsx (refactor)
  - components/reports/ (all new files)
  - app/protected/reports/page.tsx (new)
  - app/protected/reports/loading.tsx (new)
  - app/globals.css (add print CSS only — do not remove existing styles)

Do not touch anything else.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART A: OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FILE 1: components/dashboard/overview-stats.tsx
"use client"
Props: monthYear: string

Fetches on monthYear change:
  1. weekends WHERE month_year = monthYear
  2. reservations joined with weekends WHERE weekends.month_year = monthYear (get all for the month, selecting all reservation fields)
  3. expenses WHERE month_year = monthYear

Computations:

rentCollected:
  For each reservation, sum amounts actually received:
  (security_deposit_paid ? security_deposit : 0) + (downpayment_paid ? downpayment_amount : 0) + (balance_paid ? balance_amount : 0)

totalBilled (per reservation):
  base_rent + security_deposit + extra_brand_fee + high_wattage_fee + space_penalty + ingress_egress_penalty + other_fees

outstandingRent:
  sum of (totalBilled - amountCollected) for each reservation

uniqueMerchantsReserved:
  count of unique merchant_ids in reservations for the month

totalCapacity:
  10 (8 wall + 2 garden) + (any weekend this month has outdoor_booths_available ? 3 : 0)

totalExpenses: sum of all expense.amount

net: rentCollected - totalExpenses

Display 5 shadcn Cards in grid (grid-cols-2 gap-3 on mobile, grid-cols-4 on lg, span-2 for net card):

Card structure (each):
  CardContent pt-4 pb-3:
    Row 1: icon (h-8 w-8 p-1.5 rounded-lg colored bg) on left
    Row 2: CurrencyDisplay or custom value — text-2xl font-bold mt-2
    Row 3: label — text-sm font-medium
    Row 4: sub-label — text-xs text-muted-foreground

Card 1 — Rent Collected: Banknote icon, green (bg-green-100 text-green-600), value=rentCollected, label="Rent Collected", sub="This month"
Card 2 — Outstanding: TrendingDown icon, amber (bg-amber-100 text-amber-600), value=outstandingRent, label="Outstanding", sub="Pending collection"
Card 3 — Occupancy: Store icon, blue (bg-blue-100 text-blue-600), value="{uniqueMerchantsReserved} / {totalCapacity}", label="Booth Occupancy", sub="Booths reserved" (not a currency display — just text)
Card 4 — Expenses: Receipt icon, red (bg-red-100 text-red-600), value=totalExpenses, label="Total Expenses", sub="All categories"
Card 5 — Net: BarChart3 icon, green if net >= 0 else red bg, value=net, label="Net", sub="Revenue minus expenses", span full width on mobile (col-span-2)

Show Skeleton (5 card shapes) while loading.

FILE 2: components/dashboard/this-weekend-preview.tsx
"use client"
Props: monthYear: string

Fetches weekends for the month.

Logic to find current/next weekend:
  const today = new Date()
  const currentWeekend = weekends.find(w => new Date(w.date_start) <= today && today <= new Date(w.date_end))
  const nextWeekend = weekends.find(w => new Date(w.date_start) > today)
  const targetWeekend = currentWeekend || nextWeekend

If no targetWeekend: show subtle empty state "No upcoming weekend scheduled this month."

If targetWeekend found:
  Fetch reservations for targetWeekend.id, joined with merchants

  shadcn Card:
    CardHeader:
      CardTitle: currentWeekend ? "This Weekend" : "Next Weekend" (text-base)
      CardDescription: formatDateRange + weekend label
    CardContent:
      If reservations.length === 0: "No reservations yet" text-sm text-muted-foreground
      Else: compact list (space-y-2):
        Each row (flex justify-between items-center min-h-[36px]):
          Left: booth_number text-sm font-mono + " · " + merchant.business_name text-sm
          Right: StatusBadge
      Separator + "View all →" link to /protected/reservations/{targetWeekend.id} (text-sm text-primary, right-aligned)

FILE 3: app/protected/page.tsx (full rewrite)
"use client"

State: selectedMonth from ?month= URL param or getCurrentMonthYear()

Layout:
  PageHeader title="Overview" description={formatMonthYear(selectedMonth)}
  MonthSelector value=selectedMonth onChange (update URL + state) sticky mb-4
  OverviewStats monthYear=selectedMonth
  div className="mt-6": ThisWeekendPreview monthYear=selectedMonth

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART B: REPORTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FILE 4: components/reports/report-revenue-section.tsx
Props: reservations: Reservation[]

shadcn Card, CardHeader title="Revenue Summary":
  Use a clean div layout (not Table — better on mobile):
  
  Rows (flex justify-between py-2 border-b text-sm, last row no border):
    "Total Base Rent Billed" | formatPHP(sum of base_rent)
    "Security Deposits Collected" | formatPHP(sum of security_deposit where paid)
    "Add-on Fees Collected" | formatPHP(sum of all add-on fees across paid reservations)
    "Total Collected" | formatPHP(total collected) — font-semibold, slightly larger
    "Outstanding Balances" | formatPHP(outstanding) — text-amber-600 if > 0

FILE 5: components/reports/report-expense-section.tsx
Props: expenses: Expense[]

shadcn Card, CardHeader title="Expense Summary":
  Group by category, show only categories with expenses
  Each row: category name | formatPHP(total) — flex justify-between py-2 border-b text-sm
  Sort by total descending
  Last row: "Total Expenses" | formatPHP(grand total) — font-semibold

FILE 6: components/reports/report-net-section.tsx
Props: totalCollected: number, totalExpenses: number

shadcn Card, CardHeader title="Net Summary":
  net = totalCollected - totalExpenses
  
  3 rows:
  "Total Revenue Collected" | formatPHP(totalCollected) — green text
  "Total Expenses" | formatPHP(totalExpenses) — red text
  "Net" | formatPHP(net) — text-lg font-bold, green if >= 0 else text-red-600

FILE 7: components/reports/report-merchant-breakdown.tsx
Props: weekends: Weekend[], reservations: Reservation[]

shadcn Card, CardHeader title="Merchant Breakdown":

For each weekend (in order):
  Sub-heading: "{weekend.label} · {formatDateRange(...)}" — text-sm font-semibold text-muted-foreground mt-4 mb-2 (first one no mt)
  
  Mobile (block): each reservation as a compact row card:
    Row: BoothTypeBadge + booth_number | merchant.business_name | StatusBadge + formatPHP(totalBilled)
    Second line: "Paid: {formatPHP(paid)} · Balance: {formatPHP(balance)}" text-xs muted
  
  Desktop (md+, hidden on mobile): shadcn Table:
    Columns: Booth | Merchant | Wknds | Base Rent | Add-ons | Total | Paid | Balance | Status
  
  Computations per reservation:
    addons = extra_brand_fee + high_wattage_fee + space_penalty + ingress_egress_penalty + other_fees
    totalBilled = base_rent + security_deposit + addons
    paid = (security_deposit_paid ? security_deposit : 0) + (downpayment_paid ? downpayment_amount : 0) + (balance_paid ? balance_amount : 0)
    balance = totalBilled - paid

FILE 8: components/reports/report-outstanding.tsx
Props: reservations: Reservation[]

shadcn Card, CardHeader title="Outstanding Balances":

Filter: reservations where payment_status !== 'paid'

If empty: EmptyState icon=CheckCircle2 title="All paid up!" description="Every merchant has settled their balance." (no action button)

Else: list (space-y-3):
  Each (shadcn Card p-3):
    Row 1: merchant.business_name font-semibold | StatusBadge (right)
    Row 2: BoothTypeBadge + booth_number text-sm
    Row 3 — What's missing (text-sm text-muted-foreground):
      List missing items: "Missing: " + join([!security_deposit_paid ? "Security deposit" : null, !downpayment_paid ? "Downpayment" : null, (payment_option === 'A' && !balance_paid) ? "Balance" : null].filter(Boolean), ", ")
    Row 4: "Amount outstanding: " + formatPHP(totalBilled - paid) — text-amber-600 font-semibold

FILE 9: app/protected/reports/page.tsx
"use client"

State: selectedMonth from ?month= param

Fetch on selectedMonth change:
  reservations = reservations WHERE weekends.month_year = selectedMonth, joined with merchants(*) and weekends(*)
  expenses = expenses WHERE month_year = selectedMonth, joined with weekends(*)
  weekends = weekends WHERE month_year = selectedMonth ORDER BY date_start

Derived:
  totalCollected = sum of (paid amounts per reservation)
  totalExpenses = sum of expense.amount

Layout:
  div (no-print class):
    PageHeader title="Audit Report"
    flex justify-between items-center mb-4:
      MonthSelector value=selectedMonth onChange=...
      Button onClick={() => window.print()} className="no-print" variant="outline":
        Printer icon + "Export PDF"
  
  Print-only header (className="hidden print-header"):
    "Clásico Events" — text-2xl font-bold
    "{formatMonthYear(selectedMonth)} Audit Report" — text-lg
    "Generated: {new Date().toLocaleDateString('en-PH', { ... })}" — text-sm text-muted-foreground
  
  Report sections (space-y-6 mt-4):
    ReportRevenueSection reservations=reservations
    ReportExpenseSection expenses=expenses
    ReportNetSection totalCollected=totalCollected totalExpenses=totalExpenses
    ReportMerchantBreakdown weekends=weekends reservations=reservations
    ReportOutstanding reservations=reservations

FILE 10: app/protected/reports/loading.tsx
5 Card skeletons of varying heights (h-[180px], h-[140px], h-[100px], h-[300px], h-[200px])

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRINT CSS — app/globals.css
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Append to the bottom of globals.css (do not remove existing styles):

@media print {
  .no-print { display: none !important; }
  .print-header { display: block !important; }
  body { font-size: 12px !important; color: #000 !important; background: #fff !important; }
  * { box-shadow: none !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page-break { page-break-before: always; }
}

Also add to the default (non-print) styles:
.print-header { display: none; }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- All money computations in reports must be IDENTICAL to how they are computed in overview-stats.tsx — same logic, same helper functions
- Use formatPHP() for every currency value
- Report sections: on mobile use stacked card layout, on desktop (md+) use tables where appropriate
- No TypeScript errors
- Do not modify files other than those listed above
```

---

### After Session 5 — Final Test Checklist
- [ ] Overview shows 5 cards with real numbers from Supabase
- [ ] "This Weekend" shows current/next weekend reservations
- [ ] Switching months updates all 5 stats correctly
- [ ] Reports → select a month with data
- [ ] Revenue section numbers match overview "Rent Collected"
- [ ] Expense section matches overview "Total Expenses"
- [ ] Net matches Overview "Net"
- [ ] Merchant breakdown shows all reservations grouped by weekend
- [ ] Outstanding shows only unpaid/partial reservations
- [ ] If all paid: "All paid up!" empty state shows
- [ ] Tap "Export PDF" → print dialog opens → save as PDF
- [ ] On the PDF: sidebar and bottom nav are gone, print header shows

---
---

## Troubleshooting

**`Cannot find module '@/lib/types'`**
→ Make sure `lib/types.ts` was created in Session 1. Check `tsconfig.json` has `"paths": { "@/*": ["./*"] }`.

**Bottom nav not showing on mobile**
→ Confirm `md:hidden` is on the bottom nav wrapper. Main content must have `pb-20` or `pb-24`.

**Supabase returns no data despite rows existing**
→ Check RLS policies in Supabase → Authentication → Policies. Confirm the `auth_full_access` policies are active on all 4 tables.

**PDF cuts off mid-card**
→ Add `style={{ pageBreakInside: 'avoid' }}` to report Card components, or add `.report-card { page-break-inside: avoid; }` to print CSS.

**Payment status not updating live in the form**
→ `computePaymentStatus()` must be called as a derived value (not stored in state). Recalculate on every render from the switch states.

**Garden/Outdoor rent shows ₱0**
→ Expected. Update `GARDEN_OUTDOOR_RATES` in `lib/rates.ts` when you confirm the prices.

**`unique constraint` error when adding reservation**
→ Each merchant can only have one reservation per weekend. The form should check for this and show a clear error: "This merchant already has a reservation for this weekend."

**Month selector not reflecting URL param**
→ Wrap the component reading `useSearchParams()` in a `<Suspense>` boundary — Next.js requires this.

---

## Quick Reference

| Session | Feature | Key files |
|---|---|---|
| 1 | Foundation | `lib/types.ts`, `lib/rates.ts`, `lib/utils.ts`, `components/shared/*`, `components/dashboard/dashboard-layout.tsx`, `components/dashboard/bottom-nav.tsx` |
| 2 | Merchants | `components/merchants/*`, `app/protected/merchants/**` |
| 3 | Reservations | `components/reservations/*`, `app/protected/reservations/**` |
| 4 | Expenses | `components/expenses/*`, `app/protected/expenses/**` |
| 5 | Overview + Reports | `components/dashboard/overview-stats.tsx`, `components/dashboard/this-weekend-preview.tsx`, `app/protected/page.tsx`, `components/reports/*`, `app/protected/reports/**` |
