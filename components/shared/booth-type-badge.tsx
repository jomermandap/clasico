import { Badge } from "@/components/ui/badge";
import type { BoothType } from "@/lib/types";

interface BoothTypeBadgeProps {
  type: BoothType;
}

const LABELS: Record<BoothType, string> = {
  wall: "Wall",
  garden: "Garden",
  outdoor: "Outdoor",
};

const STYLES: Record<BoothType, string> = {
  wall: "bg-blue-100 text-blue-700 border-blue-200",
  garden: "bg-emerald-100 text-emerald-700 border-emerald-200",
  outdoor: "bg-orange-100 text-orange-700 border-orange-200",
};

export function BoothTypeBadge({ type }: BoothTypeBadgeProps) {
  return (
    <Badge
      className={`border px-2.5 py-1 text-xs font-medium rounded-full ${STYLES[type]}`}
    >
      {LABELS[type]}
    </Badge>
  );
}

