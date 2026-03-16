import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
}

export function PageHeader({
  title,
  description,
  action,
  backHref,
}: PageHeaderProps) {
  return (
    <header className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {backHref && (
          <Link href={backHref}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Go back</span>
            </Button>
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

