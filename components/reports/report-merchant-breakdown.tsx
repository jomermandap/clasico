import type {
  ContractPayment,
  Merchant,
  MonthlyContract,
  Weekend,
  WeekendAttendance,
} from "@/lib/types";
import { formatDateRange, formatPHP } from "@/lib/utils";
import { BoothTypeBadge } from "@/components/shared/booth-type-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getContractAddons,
  getContractCollectedAmount,
  getContractOutstanding,
  getContractTotalBilled,
} from "@/components/reports/report-utils";

interface ReportMerchantBreakdownProps {
  weekends: Weekend[];
  contracts: MonthlyContract[];
}

type ContractWithJoins = MonthlyContract & {
  merchant?: Pick<Merchant, "id" | "business_name" | "booth_number"> | null;
  payments?: Pick<ContractPayment, "amount">[] | null;
  attendances?: (WeekendAttendance & { weekend?: Weekend | null })[] | null;
};

export function ReportMerchantBreakdown({
  weekends,
  contracts,
}: ReportMerchantBreakdownProps) {
  const sortedWeekends = [...weekends].sort((a, b) => {
    const startA = new Date(a.date_start).getTime();
    const startB = new Date(b.date_start).getTime();
    return startA - startB;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Merchant Breakdown</CardTitle>
      </CardHeader>

      <CardContent>
        {sortedWeekends.map((weekend, weekendIndex) => {
          const weekendContracts = (contracts as ContractWithJoins[])
            .filter((contract) =>
              (contract.attendances ?? []).some(
                (attendance) => attendance.weekend_id === weekend.id,
              ),
            )
            .sort((a, b) => {
              const aBooth = a.booth_number ?? a.merchant?.booth_number ?? "";
              const bBooth = b.booth_number ?? b.merchant?.booth_number ?? "";
              return aBooth.localeCompare(bBooth);
            });

          return (
            <section key={weekend.id}>
              <h3
                className={`mb-2 text-sm font-semibold text-muted-foreground ${
                  weekendIndex === 0 ? "" : "mt-4"
                }`}
              >
                {weekend.label} · {formatDateRange(weekend.date_start, weekend.date_end)}
              </h3>

              {weekendContracts.length === 0 ? (
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                  No reservations for this weekend.
                </div>
              ) : (
                <>
                  <div className="space-y-2 md:hidden">
                    {weekendContracts.map((contract) => {
                      const addOns = getContractAddons(contract);
                      const totalBilled = getContractTotalBilled(contract);
                      const paid = getContractCollectedAmount(contract);
                      const balance = getContractOutstanding(contract);

                      return (
                        <Card key={`${weekend.id}-${contract.id}`} className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <BoothTypeBadge type={contract.booth_type} />
                                <span className="text-sm font-mono">
                                  {contract.booth_number ??
                                    contract.merchant?.booth_number ??
                                    "N/A"}
                                </span>
                              </div>
                              <div className="mt-1 truncate text-sm font-medium">
                                {contract.merchant?.business_name ?? "Unknown merchant"}
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <StatusBadge status={contract.payment_status} />
                              <span className="text-sm font-semibold">
                                {formatPHP(totalBilled)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Paid: {formatPHP(paid)} · Balance: {formatPHP(balance)}
                          </div>
                          {addOns > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Add-ons: {formatPHP(addOns)}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>

                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booth</TableHead>
                          <TableHead>Merchant</TableHead>
                          <TableHead>Wknds</TableHead>
                          <TableHead className="text-right">Base Rent</TableHead>
                          <TableHead className="text-right">Add-ons</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weekendContracts.map((contract) => {
                          const addOns = getContractAddons(contract);
                          const totalBilled = getContractTotalBilled(contract);
                          const paid = getContractCollectedAmount(contract);
                          const balance = getContractOutstanding(contract);

                          return (
                            <TableRow key={`${weekend.id}-${contract.id}`}>
                              <TableCell className="font-mono">
                                {contract.booth_number ??
                                  contract.merchant?.booth_number ??
                                  "N/A"}
                              </TableCell>
                              <TableCell>
                                {contract.merchant?.business_name ?? "Unknown merchant"}
                              </TableCell>
                              <TableCell>{contract.weekends_availed}</TableCell>
                              <TableCell className="text-right">
                                {formatPHP(contract.base_rent)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatPHP(addOns)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatPHP(totalBilled)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatPHP(paid)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatPHP(balance)}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={contract.payment_status} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
