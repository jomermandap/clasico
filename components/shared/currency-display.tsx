import { cn, formatPHP } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CurrencyDisplay({
  amount,
  className,
  size = "md",
}: CurrencyDisplayProps) {
  const sizeClasses =
    size === "sm"
      ? "text-sm"
      : size === "lg"
      ? "text-xl font-bold"
      : "text-base";

  const baseClasses = "font-semibold";

  return (
    <span className={cn(baseClasses, sizeClasses, className)}>
      {formatPHP(amount)}
    </span>
  );
}

