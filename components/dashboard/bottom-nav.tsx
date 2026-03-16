"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  FileBarChart2,
  Home,
  Receipt,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/protected", label: "Overview", icon: Home },
  { href: "/protected/merchants", label: "Merchants", icon: Store },
  { href: "/protected/reservations", label: "Reservations", icon: CalendarRange },
  { href: "/protected/expenses", label: "Expenses", icon: Receipt },
  { href: "/protected/reports", label: "Report", icon: FileBarChart2 },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1"
            >
              <div
                className={cn(
                  "flex w-full flex-col items-center justify-center py-2 min-h-[56px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="flex flex-col items-center">
                  {isActive && (
                    <div className="mb-1 h-0.5 w-8 rounded-full bg-primary" />
                  )}
                  <Icon className="h-5 w-5" />
                  <span className="mt-1 text-[10px] font-medium">
                    {tab.label}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

