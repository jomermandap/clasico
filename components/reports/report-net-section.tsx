import { formatPHP } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportNetSectionProps {
  totalCollected: number;
  totalExpenses: number;
}

export function ReportNetSection({
  totalCollected,
  totalExpenses,
}: ReportNetSectionProps) {
  const net = totalCollected - totalExpenses;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>Total Revenue Collected</span>
          <span className="text-green-600">{formatPHP(totalCollected)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Total Expenses</span>
          <span className="text-red-600">{formatPHP(totalExpenses)}</span>
        </div>
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Net</span>
          <span className={net >= 0 ? "text-green-600" : "text-red-600"}>
            {formatPHP(net)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
