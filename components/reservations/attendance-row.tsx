import type { WeekendAttendance } from "@/lib/types";
import { computeTotalOwed, formatPHP } from "@/lib/utils";
import { BoothTypeBadge } from "@/components/shared/booth-type-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AttendanceRowProps {
  attendance: WeekendAttendance;
  onViewContract: () => void;
  onRemove: () => void;
}

export function AttendanceRow({
  attendance,
  onViewContract,
  onRemove,
}: AttendanceRowProps) {
  const contract = attendance.contract;
  const merchant = contract?.merchant;

  const totalOwed = contract ? computeTotalOwed(contract) : 0;
  const totalCollected =
    contract?.payments?.reduce((sum, p) => sum + (p?.amount ?? 0), 0) ?? 0;

  const remaining = Math.max(0, totalOwed - totalCollected);

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {contract && (
            <div className="flex items-center gap-2 text-sm font-mono">
              <BoothTypeBadge type={contract.booth_type} />
              <span>
                {attendance.booth_number ?? contract.booth_number}
              </span>
            </div>
          )}
        </div>
        {contract && <StatusBadge status={contract.payment_status} />}
      </div>

      <div className="mt-1 font-semibold">
        {merchant?.business_name ?? ""}
      </div>
      <div className="text-sm text-muted-foreground">
        {merchant?.name ?? ""}
      </div>

      {contract && (
        <div className="text-xs text-muted-foreground mt-1">
          <div>
            Paid: {formatPHP(totalCollected)} / {formatPHP(totalOwed)}
          </div>
          {contract.payment_status === "partial" && remaining > 0 && (
            <div className="text-amber-700">
              {formatPHP(remaining)} remaining
            </div>
          )}
        </div>
      )}

      <div className="mt-2 pt-2 border-t flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onViewContract}
          disabled={!contract}
        >
          View Contract
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>
    </Card>
  );
}
