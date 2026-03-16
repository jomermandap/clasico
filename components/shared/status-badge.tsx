import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: PaymentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const baseClasses =
    "border text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center justify-center";

  const variants: Record<PaymentStatus, string> = {
    unpaid: "bg-red-100 text-red-700 border-red-200",
    partial: "bg-amber-100 text-amber-700 border-amber-200",
    paid: "bg-green-100 text-green-700 border-green-200",
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge className={`${baseClasses} ${variants[status]}`}>{label}</Badge>
  );
}

