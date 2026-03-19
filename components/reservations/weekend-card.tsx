import type { Weekend } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import { BoothTypeBadge } from "@/components/shared/booth-type-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface WeekendCardProps {
  weekend: Weekend;
  attendanceCount: number;
  capacity: number;
  onClick: () => void;
}

export function WeekendCard({
  weekend,
  attendanceCount,
  capacity,
  onClick,
}: WeekendCardProps) {
  const value = capacity > 0 ? (attendanceCount / capacity) * 100 : 0;

  return (
    <Card
      className="p-4 hover:bg-accent/30 cursor-pointer transition"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold">{weekend.label}</div>
        {weekend.outdoor_booths_available && (
          <BoothTypeBadge type="outdoor" />
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {formatDateRange(weekend.date_start, weekend.date_end)}
      </div>

      <Progress value={value} className="h-1.5 mt-2" />
      <div className="text-xs text-muted-foreground mt-1">
        {attendanceCount} / {capacity} merchants
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full mt-3"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        Manage
      </Button>
    </Card>
  );
}
