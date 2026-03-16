# Folder Structure Guidelines

## 🎯 Core Principles

### 1. "Co-locate by Feature"
- When you add a new feature, create its own folder
- Keep related files together
- Example: `components/dashboard/` not `components/dashboard-`

### 2. "Think in Routes First"
- New page? → `app/feature/page.tsx`
- New API? → `app/api/feature/route.ts`
- New layout? → `app/feature/layout.tsx`

### 3. "Shared vs Feature"
- **Shared** → `components/ui/`, `lib/utils.ts`
- **Feature-specific** → `components/dashboard/`, `lib/supabase/`

## 📁 Current Structure (Keep This)

```
app/
├── auth/           # Authentication routes
├── protected/      # Dashboard routes
├── layout.tsx      # Root layout
└── page.tsx        # Homepage

components/
├── ui/             # shadcn/ui components
├── auth-button.tsx
├── dashboard-layout.tsx
└── dashboard-components.tsx

lib/
├── supabase/       # Database clients
└── utils.ts        # Shared utilities
```

## 🧠 Decision Tree (Before Creating Files)

**Ask yourself:**
- "Is this reusable UI component?" → `components/ui/`
- "Is this dashboard-related?" → `components/dashboard/`
- "Is this auth-related?" → `components/auth/`
- "Is this a utility function?" → `lib/`
- "Is this a new page?" → `app/feature/page.tsx`
- "Is this an API endpoint?" → `app/api/feature/route.ts`

## 📝 Naming Conventions

**Files:**
- **Components**: `kebab-case.tsx`
- **Pages**: `page.tsx` (always)
- **Layouts**: `layout.tsx` (always)
- **Hooks**: `use-*.ts`
- **Types**: `types.ts`
- **Utilities**: `utils.ts`

**Folders:**
- **Features**: `kebab-case/`
- **UI**: `ui/`
- **Lib**: `lib/`

## 🚀 Scaling Pattern (When Adding Features)

```
New Feature? Create this structure:
app/feature/
├── page.tsx
├── layout.tsx
└── loading.tsx

components/feature/
├── component-1.tsx
└── component-2.tsx

lib/feature.ts
```

## ✅ Best Practices

1. **Keep it flat** when possible
2. **Group by feature**, not by file type
3. **Shared utilities** stay in `lib/`
4. **UI components** stay in `components/ui/`
5. **Pages** always named `page.tsx`
6. **Layouts** always named `layout.tsx`

## 🎯 Quick Reference

| What you're adding | Where it goes |
|-------------------|---------------|
| New page | `app/feature/page.tsx` |
| New API | `app/api/feature/route.ts` |
| Reusable UI | `components/ui/` |
| Feature component | `components/feature/` |
| Utility function | `lib/` |
| Custom hook | `hooks/` |
| Types | `types.ts` or `lib/types.ts` |

---

**Remember**: Your current structure is already excellent! Follow these patterns as you scale.
