"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CircleUser, Home, Receipt, Store } from "lucide-react";
import { FileBarChart2 } from "lucide-react";
import { CalendarRange } from "lucide-react";
import { Store as StoreIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BottomNav } from "./bottom-nav";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

const MAIN_NAV = [
  { href: "/protected", label: "Overview", icon: Home },
  { href: "/protected/merchants", label: "Merchants", icon: StoreIcon },
  { href: "/protected/reservations", label: "Reservations", icon: CalendarRange },
  { href: "/protected/expenses", label: "Expenses", icon: Receipt },
] as const;

const INSIGHTS_NAV = [
  { href: "/protected/reports", label: "Report", icon: FileBarChart2 },
] as const;

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const renderUserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full"
        >
          <CircleUser className="h-5 w-5" />
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/auth/login");
          }}
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderSidebarNav = () => (
    <div className="hidden border-r bg-muted/40 md:flex md:flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link
          href="/protected"
          className="flex items-center gap-2 font-semibold"
        >
          <Store className="h-6 w-6" />
          <span className="text-base">Clásico</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-8 w-8"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 px-3 py-4 lg:px-4">
        <div className="flex h-full flex-col justify-between text-sm font-medium">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Market
              </p>
              <nav className="space-y-1">
                {MAIN_NAV.map((item) => {
                  const isOverview = item.href === "/protected";
                  const isActive = isOverview
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-primary",
                        isActive && "bg-accent text-primary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="space-y-1">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Insights
              </p>
              <nav className="space-y-1">
                {INSIGHTS_NAV.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-primary",
                        isActive && "bg-accent text-primary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
          <div className="mt-4 border-t pt-4">
            {renderUserMenu()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMobileHeader = () => (
    <header className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3 md:hidden">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Weekend Market
        </p>
        <h1 className="text-base font-semibold tracking-tight">Clásico</h1>
      </div>
      {renderUserMenu()}
    </header>
  );

  return (
    <div className="flex min-h-screen w-full flex-col md:grid md:grid-cols-[260px_1fr]">
      {renderSidebarNav()}
      <div className="flex flex-1 flex-col">
        {renderMobileHeader()}
        <main className="flex flex-1 flex-col gap-4 px-4 pb-24 pt-2 lg:gap-6 lg:px-6 lg:pb-8 lg:pt-6">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
          </div>
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
