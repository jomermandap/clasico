import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const button = action ? (
    <Button
      type="button"
      className="mt-4 h-11 px-5"
      onClick={action.onClick}
    >
      {action.label}
    </Button>
  ) : null;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {action &&
        (action.href ? <Link href={action.href}>{button}</Link> : button)}
    </div>
  );
}

