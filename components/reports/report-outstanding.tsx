import { CheckCircle2 } from "lucide-react";
import type { ContractPayment, Merchant, MonthlyContract } from "@/lib/types";
import { formatPHP } from "@/lib/utils";
import { BoothTypeBadge } from "@/components/shared/booth-type-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getContractCollectedAmount,
  getContractOutstanding,
  getContractTotalBilled,
} from "@/components/reports/report-utils";

interface ReportOutstandingProps {
  contracts: MonthlyContract[];
}

type ContractWithJoins = MonthlyContract & {
  merchant?: Pick<Merchant, "id" | "business_name" | "booth_number"> | null;
  payments?: Pick<ContractPayment, "amount">[] | null;
};

export function ReportOutstanding({ contracts }: ReportOutstandingProps) {
  const outstandingContracts = (contracts as ContractWithJoins[]).filter(
    (contract) => contract.payment_status !== "paid",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Outstanding Balances</CardTitle>
      </CardHeader>

      <CardContent>
        {outstandingContracts.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All paid up!"
            description="Every merchant has settled their balance."
          />
        ) : (
          <div className="space-y-3">
            {outstandingContracts.map((contract) => {
              const totalBilled = getContractTotalBilled(contract);
              const paid = getContractCollectedAmount(contract);
              const outstanding = getContractOutstanding(contract);
              const missing = [
                paid < contract.security_deposit ? "Security deposit" : null,
                paid < contract.security_deposit + contract.downpayment_amount
                  ? "Downpayment"
                  : null,
                contract.payment_option === "A" &&
                paid <
                  contract.security_deposit +
                    contract.downpayment_amount +
                    contract.balance_amount
                  ? "Balance"
                  : null,
              ].filter(Boolean) as string[];

              return (
                <Card key={contract.id} className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">
                      {contract.merchant?.business_name ?? "Unknown merchant"}
                    </div>
                    <StatusBadge status={contract.payment_status} />
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <BoothTypeBadge type={contract.booth_type} />
                    <span className="font-mono">
                      {contract.booth_number ?? contract.merchant?.booth_number ?? "N/A"}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-muted-foreground">
                    Missing: {missing.length > 0 ? missing.join(", ") : "None"}
                  </div>

                  <div className="mt-1 text-sm text-muted-foreground">
                    Paid: {formatPHP(paid)} / {formatPHP(totalBilled)}
                  </div>

                  <div className="mt-1 text-sm font-semibold text-amber-600">
                    Amount outstanding: {formatPHP(outstanding)}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
