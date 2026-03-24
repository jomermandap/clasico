import type { MonthlyContract } from "@/lib/types";
import { formatPHP } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getContractAddons,
  getContractSecurityCollected,
  sumContractCollectedAmounts,
  sumContractOutstanding,
} from "@/components/reports/report-utils";

interface ReportRevenueSectionProps {
  contracts: MonthlyContract[];
}

function Row({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between py-2 text-sm ${className ?? ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function ReportRevenueSection({ contracts }: ReportRevenueSectionProps) {
  const totalBaseRent = contracts.reduce(
    (sum, contract) => sum + contract.base_rent,
    0,
  );
  const securityDepositsCollected = contracts.reduce(
    (sum, contract) => sum + getContractSecurityCollected(contract),
    0,
  );
  const addOnFeesCollected = contracts
    .filter((contract) => contract.payment_status === "paid")
    .reduce((sum, contract) => sum + getContractAddons(contract), 0);
  const totalCollected = sumContractCollectedAmounts(contracts);
  const outstanding = sumContractOutstanding(contracts);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Summary</CardTitle>
      </CardHeader>

      <CardContent>
        <Row
          label="Total Base Rent Billed"
          value={formatPHP(totalBaseRent)}
          className="border-b"
        />
        <Row
          label="Security Deposits Collected"
          value={formatPHP(securityDepositsCollected)}
          className="border-b"
        />
        <Row
          label="Add-on Fees Collected"
          value={formatPHP(addOnFeesCollected)}
          className="border-b"
        />
        <Row
          label="Total Collected"
          value={formatPHP(totalCollected)}
          className="border-b text-base font-semibold"
        />
        <Row
          label="Outstanding Balances"
          value={formatPHP(outstanding)}
          className={outstanding > 0 ? "text-amber-600" : ""}
        />
      </CardContent>
    </Card>
  );
}
