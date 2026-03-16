# Clásico Events — Internal Tracking System
## Product Requirements Document (PRD)
**Version:** 1.0  
**Stack:** Next.js 15 (App Router) · Supabase · Tailwind CSS · shadcn/ui  
**Primary Device:** Mobile (phones) — MOBILE FIRST throughout  
**Users:** 4 internal team members, equal access, no roles  

---

## 1. Context & Goals

Clásico Events runs a weekend market ("Clásico at Project L") every Thursday–Sunday at Project L Compound, Araullo St., Poblacion District, Davao City. The market currently has:

- **8 Wall Booths** (#1–#8) — 1.6m × 1.6m
- **2 Garden Booths** (#1–#2) — 2.0m × 2.0m tent (inside garden area)
- **3 Outdoor Booths** (#1–#3) — available on select weekends only (not every weekend), same rate tier as Garden Booths (TBD)
- 2 fixed in-house tenants (Shazam, Nomnom's) — **not tracked in this system**

The team of 4 currently manages everything in Notion and wants to migrate to this custom system.

**Core goals:**
1. Track merchant profiles and booth assignments
2. Manage reservations per weekend per month (payment status, option A/B)
3. Log and categorize monthly expenses
4. Generate monthly audit reports (screen + PDF export)

---

## 2. Tech Stack & Existing Repo

```
Next.js 15 App Router
Supabase (auth + postgres)
Tailwind CSS v3
shadcn/ui (already installed)
TypeScript
```

**Existing auth flow** (keep as-is):
- `/` → redirects to `/auth/login`
- `/auth/login`, `/auth/sign-up`, `/auth/forgot-password`, `/auth/update-password`
- `/protected/*` → all authenticated routes

**Key existing files:**
- `lib/supabase/client.ts` — browser Supabase client
- `lib/supabase/server.ts` — server Supabase client
- `components/dashboard-layout.tsx` — existing nav shell (needs mobile-first redesign)
- `components/ui/*` — shadcn primitives already available

---

## 3. Navigation Structure

### Mobile (primary) — Bottom Tab Bar
Fixed bottom navigation with 5 tabs:

```
[ Overview ] [ Merchants ] [ Reservations ] [ Expenses ] [ Report ]
```

Icons from lucide-react. Active tab highlighted. No hamburger menu on mobile.

### Desktop — Left Sidebar (existing pattern, keep)
Same 5 sections in a sidebar. The `dashboard-layout.tsx` component should be refactored to support both.

### Routes
```
/protected                        → Overview (dashboard)
/protected/merchants              → Merchant list
/protected/merchants/new          → Add merchant form
/protected/merchants/[id]         → Merchant detail / edit
/protected/reservations           → Reservations (month view)
/protected/reservations/[weekendId] → Weekend detail
/protected/expenses               → Expense list
/protected/expenses/new           → Add expense form
/protected/reports                → Audit report (month selector)
```

---

## 4. Database Schema (Supabase)

Run these migrations in the Supabase SQL editor.

### 4.1 `merchants`
```sql
create table merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,                        -- contact person full name
  business_name text not null,               -- brand / stall name
  contact_number text,
  email text,
  booth_type text not null check (booth_type in ('wall', 'garden', 'outdoor')),
  booth_number text not null,                -- "Booth #1"-"Booth #8", "Garden Booth #1"-"Garden Booth #2", "Outdoor Booth #1"-"Outdoor Booth #3"
  product_category text,                     -- e.g. "Food", "Clothing", "Accessories"
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 4.2 `weekends`
Each weekend run (Thu–Sun) within a month. The team creates these manually.

```sql
create table weekends (
  id uuid primary key default gen_random_uuid(),
  label text not null,             -- e.g. "Weekend 1", "Weekend 2"
  month_year text not null,        -- e.g. "2025-07" (YYYY-MM)
  date_start date not null,        -- Thursday date
  date_end date not null,          -- Sunday date
  outdoor_booths_available boolean default false,  -- whether Outdoor Booth #1-3 are open this weekend
  is_active boolean default true,
  created_at timestamptz default now()
);
```

### 4.3 `reservations`
One row per merchant per weekend.

```sql
create table reservations (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  weekend_id uuid not null references weekends(id) on delete cascade,

  -- Pricing
  booth_type text not null check (booth_type in ('wall', 'garden', 'outdoor')),
  weekends_availed integer not null check (weekends_availed between 1 and 5),
  -- weekends_availed = total weekends booked THIS MONTH (determines rate tier)
  base_rent numeric(10,2) not null,   -- computed from rate table, stored for record

  -- Payment option
  payment_option text check (payment_option in ('A', 'B')),
  -- Option A: 50% down + ₱2,000 security deposit, balance before first weekend
  -- Option B: 100% full + ₱2,000 security deposit

  security_deposit numeric(10,2) default 2000,
  security_deposit_paid boolean default false,
  downpayment_amount numeric(10,2) default 0,
  downpayment_paid boolean default false,
  balance_amount numeric(10,2) default 0,
  balance_paid boolean default false,

  -- Add-on fees
  extra_brand_fee numeric(10,2) default 0,       -- ₱500 per extra brand
  high_wattage_fee numeric(10,2) default 0,       -- ₱500/unit/week
  space_penalty numeric(10,2) default 0,          -- ₱100/inch overage
  ingress_egress_penalty numeric(10,2) default 0, -- ₱250/30min
  other_fees numeric(10,2) default 0,
  other_fees_note text,

  -- Status
  payment_status text default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid')),
  -- unpaid = nothing paid yet
  -- partial = downpayment paid, balance outstanding (Option A only)
  -- paid = fully settled

  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(merchant_id, weekend_id)
);
```

### 4.4 `expenses`
```sql
create table expenses (
  id uuid primary key default gen_random_uuid(),
  month_year text not null,          -- "2025-07"
  weekend_id uuid references weekends(id), -- optional: link to specific weekend
  category text not null,            -- see categories below
  description text not null,
  amount numeric(10,2) not null,
  receipt_note text,                 -- reference number or note
  logged_by text,                    -- team member name (free text)
  expense_date date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Expense categories** (hardcoded in app, not a table):
- `Staff / Labor`
- `Utilities`
- `Permits & Compliance`
- `Supplies & Maintenance`
- `Marketing & Promotions`
- `Equipment`
- `Penalties & Fines`
- `Miscellaneous`

### 4.5 Rate Table (stored as constants in code, not DB)

**Wall Merchant Rates:**
| Weekends | Fee |
|----------|-----|
| 1 | ₱4,900 |
| 2 | ₱9,000 |
| 3 | ₱12,000 |
| 4 | ₱15,000 |
| 5 | ₱17,000 |

**Garden & Outdoor Merchant Rates:** TBD — same rate tier for both. Store as a configurable constant, default 0 until set.

```ts
// lib/rates.ts
export const WALL_RATES: Record<number, number> = {
  1: 4900,
  2: 9000,
  3: 12000,
  4: 15000,
  5: 17000,
};

// Garden and Outdoor share the same rate tier (TBD)
export const GARDEN_OUTDOOR_RATES: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

export const SECURITY_DEPOSIT = 2000;
export const EXTRA_BRAND_FEE = 500;
export const HIGH_WATTAGE_FEE = 500;
export const SPACE_PENALTY_PER_INCH = 100;
export const INGRESS_PENALTY_PER_30MIN = 250;
```

### 4.6 Row Level Security
Enable RLS on all tables. Since all 4 users are authenticated and have equal access, use a simple policy:

```sql
-- Enable RLS
alter table merchants enable row level security;
alter table weekends enable row level security;
alter table reservations enable row level security;
alter table expenses enable row level security;

-- Allow all authenticated users full access
create policy "auth_full_access" on merchants for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on weekends for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on reservations for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on expenses for all using (auth.role() = 'authenticated');
```

---

## 5. Feature Specs

### 5.1 Overview Page (`/protected`)

**Mobile layout:** Vertical stack of cards, full-width, comfortable touch targets.

**Month selector** at top — defaults to current month, allows switching months (prev/next arrows).

**Summary cards (tap to navigate):**
1. **Rent Collected** — sum of all paid amounts this month (downpayment + balance paid)
2. **Pending Rent** — sum of unpaid / partial balances
3. **Booth Occupancy** — "X / Y booths reserved" this month (Y = 10 base + 3 if any weekend has outdoor booths enabled)
4. **Total Expenses** — sum of all expenses this month
5. **Net (Rent − Expenses)** — quick profitability indicator

**Quick actions row:**
- "+ Add Reservation"
- "+ Log Expense"

**This Weekend section:**
- Shows current/upcoming weekend's reservations
- Each row: booth number, merchant name, payment status badge

---

### 5.2 Merchants (`/protected/merchants`)

**List view (mobile-first):**
- Card per merchant showing: business name, merchant name, booth number badge (color-coded wall=blue, garden=emerald, outdoor=orange), product category, payment status for current month
- Search bar at top (filter by name/business/booth)
- Filter toggle: All / Active / Inactive
- FAB (floating action button) bottom-right: "+ Add Merchant"

**Add/Edit Merchant Form (`/protected/merchants/new` and `/protected/merchants/[id]`):**

Fields:
- Business Name* (text)
- Contact Person Name* (text)
- Contact Number (text, Philippine format hint)
- Email (email)
- Booth Type* (segmented control: Wall | Garden | Outdoor)
- Booth Number* (dropdown — shows available booths based on type selected)
  - Wall: Booth #1 through Booth #8
  - Garden: Garden Booth #1, Garden Booth #2
  - Outdoor: Outdoor Booth #1, Outdoor Booth #2, Outdoor Booth #3
- Product Category (text or select: Food, Clothing, Accessories, Beauty, Art, Crafts, Other)
- Notes (textarea)
- Active (toggle, default on)

Booth numbers are not unique-enforced in DB — a booth can have different merchants across months. The team handles curation.

**Merchant Detail (`/protected/merchants/[id]`):**
- Shows all their fields + edit button
- Reservation history: list of past weekends with payment status
- Total paid to date

---

### 5.3 Reservations (`/protected/reservations`)

This is the most complex and most-used section.

**Month view (default):**
- Month selector at top (default: current month)
- Shows all weekends for that month as expandable sections
- Each weekend section shows: date range, list of reserved booths with payment status

**Weekend setup:**
- If no weekends exist for selected month → show "Set up this month" prompt
- "Set up month" screen: lets team create 4 (or 5) weekend entries by picking start dates (Thursdays)
- System auto-fills end date as +3 days (Sunday)
- Each weekend has an **"Outdoor booths available"** toggle (default off) — when enabled, Outdoor Booth #1–#3 become bookable for that specific weekend. When off, outdoor booths cannot be selected in the reservation form for that weekend.

**Reservation card (per merchant per weekend):**
```
[ Booth #3 ]  Merchant Business Name
  Maria Santos · Wall · 2 weekends
  Base rent: ₱9,000
  Security deposit: ₱2,000 ✓
  Downpayment: ₱4,500 ✓
  Balance: ₱4,500 ⏳
  ─────────────────────────
  Status: PARTIAL  [Edit]
```

**Add/Edit Reservation form:**

Section 1 — Booking Details:
- Merchant* (searchable dropdown from merchants list)
- Weekend* (auto-selected if coming from weekend view)
- Booth Type (auto-filled from merchant profile, editable)
  - If booth_type is 'outdoor' and the selected weekend does not have outdoor_booths_available = true, show a warning and block submission
- Weekends Availed This Month* (1–5 stepper) — this determines the rate tier
- Computed base rent shown immediately (read-only, reactive)

Section 2 — Payment:
- Payment Option* (A or B radio)
  - Option A: shows 50% amount auto-computed, balance auto-computed
  - Option B: shows full amount
- Security Deposit (₱2,000 default) — Paid? (checkbox)
- Downpayment — Paid? (checkbox)
- Balance — Paid? (checkbox, only for Option A)
- Payment status auto-computed: unpaid → partial → paid

Section 3 — Add-on Fees (collapsible, only show if values > 0 or when editing):
- Extra Brand Fee (₱500 × number of extra brands, numeric input)
- High Wattage Fee (₱500/unit/week, numeric)
- Space Penalty (numeric)
- Ingress/Egress Penalty (numeric)
- Other Fees (numeric + note)

Section 4 — Notes (textarea)

**Business logic for payment_status auto-computation:**
```
if security_deposit_paid = false AND downpayment_paid = false → 'unpaid'
if (downpayment_paid = true OR option B with full payment) AND balance_paid = false → 'partial'  
if all applicable payments paid → 'paid'
```

For Option B: only two states — unpaid (nothing paid) or paid (full + deposit paid).

---

### 5.4 Expenses (`/protected/expenses`)

**List view:**
- Month selector at top
- Total for month shown prominently
- Group by category (accordion or flat list with category label)
- Each expense row: description, amount, date, category badge, logged_by
- Search/filter by category
- FAB: "+ Log Expense"

**Add/Edit Expense form:**
- Date* (date picker, defaults to today)
- Category* (select from list)
- Description* (text)
- Amount* (numeric, Philippine Peso)
- Linked Weekend (optional dropdown — weekends of that month)
- Receipt Note (text — reference number, GCash ref, etc.)
- Logged By (text — team member name)
- Notes (textarea)

---

### 5.5 Audit Report (`/protected/reports`)

**Month selector** — default current month.

**Section 1: Revenue Summary**
| | Amount |
|---|---|
| Total Base Rent Billed | ₱XX,XXX |
| Security Deposits Collected | ₱XX,XXX |
| Add-on Fees Collected | ₱XX,XXX |
| **Total Collected** | **₱XX,XXX** |
| Outstanding Balances | ₱XX,XXX |

**Section 2: Expense Summary**
- Table grouped by category
- Category | Total Amount
- Grand total expenses

**Section 3: Net Summary**
| | |
|---|---|
| Total Revenue Collected | ₱XX,XXX |
| Total Expenses | ₱XX,XXX |
| **Net** | **₱XX,XXX** |

**Section 4: Merchant Breakdown**
- Per weekend: table of all reservations
- Columns: Booth, Merchant, Weekends Availed, Base Rent, Addons, Total Billed, Paid, Balance, Status

**Section 5: Unpaid / Outstanding**
- List of merchants with outstanding balances
- Shows: name, booth, amount owed, what's missing (deposit / downpayment / balance)

**Export to PDF:**
- "Export PDF" button at top right
- Uses `window.print()` with a print stylesheet OR a library like `jspdf` / `html2canvas`
- Recommended: use `@react-pdf/renderer` or just a print-optimized CSS (`@media print`) that hides nav and formats cleanly
- PDF should include: Clásico Events header, month/year, all 5 sections above

---

## 6. UX / Design Guidelines

### Mobile-First Rules
- **Minimum tap target:** 44px height for all interactive elements
- **Bottom tab bar** (fixed): `h-16`, safe-area aware (`pb-safe`)
- **Cards** over tables on mobile — tables only acceptable on desktop
- **Full-width forms** with generous padding (`px-4 py-3` minimum per field)
- **Sticky headers** on list pages (month selector stays visible while scrolling)
- **FAB** (floating action button) for primary create actions — bottom-right, `fixed bottom-20 right-4`
- **No horizontal scroll** — all content must fit within viewport width

### Status Badge Colors
- `paid` → green (`bg-green-100 text-green-800`)
- `partial` → yellow/amber (`bg-amber-100 text-amber-800`)
- `unpaid` → red (`bg-red-100 text-red-800`)

### Booth Type Badge Colors
- Wall → blue (`bg-blue-100 text-blue-800`)
- Garden → emerald (`bg-emerald-100 text-emerald-800`)
- Outdoor → orange (`bg-orange-100 text-orange-800`)

### Currency Display
Always show Philippine Peso: `₱X,XXX.00`
Use a helper: `formatPHP(amount: number) => '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })`

### Loading & Empty States
- Skeleton loaders on all list pages
- Empty states with icon + descriptive message + CTA button
- Example: "No merchants yet. Add your first merchant to get started." + button

### Error Handling
- Form validation inline (react-hook-form or simple useState)
- Supabase errors shown as toast notifications (use sonner or a simple toast component)
- Network errors: "Something went wrong. Please try again."

---

## 7. File & Folder Structure

Follows `FOLDER_STRUCTURE.md` conventions exactly: co-locate by feature, group by feature not file type, keep flat where possible.

```
app/
├── page.tsx                              ← Root: redirects to /auth/login
├── layout.tsx                            ← Root layout (existing)
├── globals.css                           ← Global styles (existing)
├── auth/                                 ← Auth routes (existing, keep as-is)
│   ├── login/page.tsx
│   ├── sign-up/page.tsx
│   ├── forgot-password/page.tsx
│   ├── update-password/page.tsx
│   ├── sign-up-success/page.tsx
│   ├── error/page.tsx
│   └── confirm/route.ts
└── protected/                            ← All authenticated routes
    ├── layout.tsx                        ← Minimal wrapper (existing, keep)
    ├── page.tsx                          ← Overview / dashboard
    ├── merchants/
    │   ├── page.tsx                      ← Merchant list
    │   ├── loading.tsx                   ← Skeleton loader
    │   ├── new/
    │   │   └── page.tsx                  ← Add merchant form
    │   └── [id]/
    │       └── page.tsx                  ← Merchant detail + edit
    ├── reservations/
    │   ├── page.tsx                      ← Month view (all weekends)
    │   ├── loading.tsx
    │   └── [weekendId]/
    │       └── page.tsx                  ← Weekend detail + reservations
    ├── expenses/
    │   ├── page.tsx                      ← Expense list
    │   ├── loading.tsx
    │   └── new/
    │       └── page.tsx                  ← Add expense form
    └── reports/
        ├── page.tsx                      ← Audit report (month view + PDF)
        └── loading.tsx

components/
├── ui/                                   ← shadcn/ui ONLY — never put custom code here
│   ├── avatar.tsx                        ← (existing)
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── checkbox.tsx
│   ├── dialog.tsx                        ← Add via: npx shadcn@latest add dialog
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx                        ← Add via: npx shadcn@latest add select
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── skeleton.tsx                      ← Add via: npx shadcn@latest add skeleton
│   ├── switch.tsx                        ← Add via: npx shadcn@latest add switch
│   ├── table.tsx
│   ├── tabs.tsx                          ← Add via: npx shadcn@latest add tabs
│   ├── textarea.tsx                      ← Add via: npx shadcn@latest add textarea
│   └── toast.tsx                         ← Add via: npx shadcn@latest add toast
│
├── dashboard/                            ← Dashboard/overview feature components
│   ├── dashboard-layout.tsx              ← REFACTORED: mobile bottom nav + desktop sidebar
│   ├── bottom-nav.tsx                    ← Mobile bottom tab bar (5 tabs)
│   ├── overview-stats.tsx                ← Summary stat cards
│   └── this-weekend-preview.tsx          ← Current weekend reservation snapshot
│
├── merchants/                            ← Merchant feature components
│   ├── merchant-card.tsx                 ← Card used in list view
│   ├── merchant-form.tsx                 ← Shared add/edit form
│   └── merchant-reservation-history.tsx  ← Past reservations on detail page
│
├── reservations/                         ← Reservation feature components
│   ├── month-setup-form.tsx              ← Create weekends for a month
│   ├── weekend-card.tsx                  ← Weekend summary card in month view
│   ├── reservation-card.tsx              ← Per-merchant reservation card
│   └── reservation-form.tsx             ← Add/edit reservation form
│
├── expenses/                             ← Expense feature components
│   ├── expense-card.tsx                  ← Single expense row/card
│   ├── expense-form.tsx                  ← Add/edit expense form
│   └── expense-category-group.tsx        ← Grouped list by category
│
├── reports/                              ← Report feature components
│   ├── report-revenue-section.tsx        ← Revenue summary table
│   ├── report-expense-section.tsx        ← Expense summary table
│   ├── report-net-section.tsx            ← Net summary
│   ├── report-merchant-breakdown.tsx     ← Per-weekend merchant table
│   └── report-outstanding.tsx           ← Unpaid/partial list
│
└── shared/                              ← Truly reusable across features
    ├── month-selector.tsx                ← "< July 2025 >" prev/next control
    ├── status-badge.tsx                  ← paid / partial / unpaid badge
    ├── booth-type-badge.tsx              ← wall / garden / outdoor badge
    ├── currency-display.tsx              ← ₱X,XXX.00 formatter component
    ├── fab-button.tsx                    ← Floating action button
    ├── empty-state.tsx                   ← Empty list state with CTA
    ├── page-header.tsx                   ← Consistent page title + action area
    └── confirm-dialog.tsx                ← Reusable delete/confirm dialog

lib/
├── supabase/
│   ├── client.ts                         ← Browser Supabase client (existing)
│   ├── server.ts                         ← Server Supabase client (existing)
│   └── proxy.ts                          ← (existing)
├── types.ts                              ← All TypeScript interfaces & enums
├── rates.ts                              ← Rate constants (wall/garden/outdoor)
└── utils.ts                             ← Existing + formatPHP(), computePaymentStatus()

hooks/                                    ← Custom React hooks (new top-level folder)
├── use-month-param.ts                    ← Read/set ?month= URL search param
├── use-merchants.ts                      ← Fetch merchants (client-side)
├── use-weekends.ts                       ← Fetch weekends for a month
├── use-reservations.ts                   ← Fetch reservations for a weekend/month
└── use-expenses.ts                       ← Fetch expenses for a month
```

### shadcn Components to Install
Run these before building (some may already be installed):
```bash
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add skeleton
npx shadcn@latest add switch
npx shadcn@latest add tabs
npx shadcn@latest add textarea
npx shadcn@latest add toast
npx shadcn@latest add sonner
```

### Structure Rules (from FOLDER_STRUCTURE.md)
- `components/ui/` — shadcn primitives ONLY. Never add custom business logic here.
- `components/[feature]/` — feature-specific components. One folder per feature.
- `components/shared/` — only if used by 2+ features. Don't pre-emptively move things here.
- `hooks/` — all custom hooks, named `use-*.ts`
- `lib/` — pure functions, constants, types, Supabase clients
- Pages are thin: import feature components, pass data down. No business logic in `page.tsx`.
- Loading states: always add `loading.tsx` alongside `page.tsx` for skeleton UX.

---

## 8. TypeScript Types (`lib/types.ts`)

```ts
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
  month_year: string;   // "YYYY-MM"
  date_start: string;   // ISO date
  date_end: string;     // ISO date
  outdoor_booths_available: boolean;  // toggles Outdoor Booth #1-3 for this weekend
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
  // Joined
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
  // Joined
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

export const BOOTH_NUMBERS = {
  wall: ['Booth #1', 'Booth #2', 'Booth #3', 'Booth #4', 'Booth #5', 'Booth #6', 'Booth #7', 'Booth #8'],
  garden: ['Garden Booth #1', 'Garden Booth #2'],
  outdoor: ['Outdoor Booth #1', 'Outdoor Booth #2', 'Outdoor Booth #3'],
} as const;
```

---

## 9. Key Implementation Notes for Cursor

### Pages Are Thin
`page.tsx` files should only: fetch data (server component), pass props to feature components, handle layout. No business logic, no JSX beyond a wrapper div and feature component imports. All UI lives in `components/[feature]/`.

### Dashboard Layout Refactor (`components/dashboard/dashboard-layout.tsx`)
Split the existing `dashboard-layout.tsx` into:
- `dashboard-layout.tsx` — top-level shell, conditionally renders sidebar (desktop) or bottom nav (mobile)
- `bottom-nav.tsx` — fixed bottom bar, 5 tabs, mobile only (`md:hidden`)

Bottom tab bar:
```tsx
// Fixed bottom, above safe area: className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
// Add padding-bottom safe area: style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
// 5 tabs: Overview (/protected), Merchants, Reservations, Expenses, Report
// Each tab: Icon (24px) stacked above label (10px text)
// Active: use usePathname() to match route, apply primary color
// Main content area needs: className="pb-20 md:pb-0" to clear the bottom nav
```

### Month Selector (`components/shared/month-selector.tsx`)
```tsx
// Uses useRouter + useSearchParams to read/set ?month=YYYY-MM
// Shows: "< July 2025 >" with prev/next buttons
// Defaults to current month if no param present
// Used identically on Overview, Reservations, Expenses, Reports pages
```

### Reservation Payment Logic (`lib/utils.ts`)
```ts
export function computePaymentStatus(r: {
  payment_option: 'A' | 'B' | null,
  security_deposit_paid: boolean,
  downpayment_paid: boolean,
  balance_paid: boolean,
}): PaymentStatus {
  if (!r.payment_option) return 'unpaid';
  if (r.payment_option === 'B') {
    return (r.security_deposit_paid && r.downpayment_paid) ? 'paid' : 'unpaid';
  }
  // Option A
  if (r.security_deposit_paid && r.downpayment_paid && r.balance_paid) return 'paid';
  if (r.security_deposit_paid && r.downpayment_paid) return 'partial';
  return 'unpaid';
}
```

Reservation form reactivity (all in `components/reservations/reservation-form.tsx`):
1. Select merchant → auto-fill `booth_type` from merchant profile
2. If `booth_type === 'outdoor'` and selected weekend has `outdoor_booths_available = false` → show `Alert` (shadcn) and disable submit
3. Enter `weekends_availed` (1–5 stepper) → auto-compute `base_rent` from `lib/rates.ts`
4. Select payment option → auto-compute `downpayment_amount` and `balance_amount`
5. On any payment checkbox change → call `computePaymentStatus()` and update status display live

### PDF Export (`app/protected/reports/page.tsx`)
Use `@media print` CSS — no extra library needed:
```css
/* in globals.css */
@media print {
  .no-print { display: none !important; }
  .print-break { page-break-before: always; }
  body { font-size: 12px; color: #000; }
}
```
Add `className="no-print"` to: bottom nav, sidebar, month selector, export button itself.
"Export PDF" button calls `window.print()`. Browser's "Save as PDF" handles the rest.

### Supabase Patterns
- **Server components** (`page.tsx`): use `createClient()` from `lib/supabase/server.ts` — no loading states needed
- **Client components** (forms, interactive): use `createClient()` from `lib/supabase/client.ts`
- **Custom hooks** in `hooks/` wrap client-side Supabase calls with `useState` + `useEffect`
- Always handle the `error` return from Supabase — show via shadcn `Toast` or `Sonner`

### shadcn Usage Notes
- Use `Select` (not native `<select>`) for all dropdowns
- Use `Switch` for boolean toggles (outdoor booths available, is_active, payment paid checkboxes)
- Use `Dialog` for confirmation prompts (delete merchant, etc.)
- Use `Skeleton` from shadcn in all `loading.tsx` files — match the shape of actual content
- Use `Sonner` for toast notifications (success/error feedback after mutations)
- Use `Tabs` on the reservations month view if switching between weekends makes sense

---

## 10. Suggested Build Order

Build in this sequence. Each step is independently testable before moving on.

1. **Install shadcn components** — run the `npx shadcn@latest add` commands listed in Section 7
2. **Schema** — run all SQL migrations in Supabase SQL editor
3. **`lib/types.ts`** — all interfaces, enums, constants (`BOOTH_NUMBERS`, `EXPENSE_CATEGORIES`)
4. **`lib/rates.ts`** — rate tables and fee constants
5. **`lib/utils.ts`** — add `formatPHP()` and `computePaymentStatus()` helpers
6. **`components/shared/`** — build all shared components first: `MonthSelector`, `StatusBadge`, `BoothTypeBadge`, `CurrencyDisplay`, `FABButton`, `EmptyState`, `PageHeader`, `ConfirmDialog`
7. **`components/dashboard/dashboard-layout.tsx`** — refactor to mobile bottom nav + desktop sidebar
8. **Merchants** — `merchant-form.tsx` → `merchant-card.tsx` → pages (`/merchants`, `/merchants/new`, `/merchants/[id]`)
9. **Weekends** — `month-setup-form.tsx` → `weekend-card.tsx` → `/reservations` page (month view + setup)
10. **Reservations** — `reservation-form.tsx` → `reservation-card.tsx` → `/reservations/[weekendId]` page
11. **Expenses** — `expense-form.tsx` → `expense-card.tsx` → `expense-category-group.tsx` → pages
12. **Overview** — `overview-stats.tsx` → `this-weekend-preview.tsx` → wire up `/protected` page with real data
13. **Reports** — build all 5 report section components → wire up `/reports` page → add print CSS for PDF export
14. **`hooks/`** — extract any repeated data-fetching logic into custom hooks as patterns emerge

---

## 11. Out of Scope (v1)

- Push notifications / reminders
- Merchant-facing portal (merchants cannot log in)
- Image/receipt uploads
- Multi-location support
- Revenue forecasting / analytics charts
- Automated payment reminders via SMS/email
- Integration with GCash or bank APIs

---

## 12. Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

Both already in place from the starter kit. No additional env vars needed for v1.
