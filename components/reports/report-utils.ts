import type { ContractPayment, Expense, MonthlyContract } from "@/lib/types";
import { computeTotalOwed } from "@/lib/utils";

type ContractMoneyFields = Pick<
  MonthlyContract,
  | "base_rent"
  | "security_deposit"
  | "extra_brand_fee"
  | "high_wattage_fee"
  | "space_penalty"
  | "ingress_egress_penalty"
  | "other_fees"
> & {
  payments?: Pick<ContractPayment, "amount" | "payment_type">[] | null;
};

export function getContractCollectedAmount(contract: ContractMoneyFields): number {
  return (contract.payments ?? []).reduce(
    (sum, payment) => sum + (payment.amount ?? 0),
    0,
  );
}

export function getContractAddons(contract: ContractMoneyFields): number {
  return (
    contract.extra_brand_fee +
    contract.high_wattage_fee +
    contract.space_penalty +
    contract.ingress_egress_penalty +
    contract.other_fees
  );
}

export function getContractTotalBilled(contract: ContractMoneyFields): number {
  return computeTotalOwed(contract);
}

export function getContractOutstanding(contract: ContractMoneyFields): number {
  return getContractTotalBilled(contract) - getContractCollectedAmount(contract);
}

export function sumContractCollectedAmounts(contracts: ContractMoneyFields[]): number {
  return contracts.reduce(
    (sum, contract) => sum + getContractCollectedAmount(contract),
    0,
  );
}

export function sumContractOutstanding(contracts: ContractMoneyFields[]): number {
  return contracts.reduce(
    (sum, contract) => sum + getContractOutstanding(contract),
    0,
  );
}

export function getContractSecurityCollected(contract: ContractMoneyFields): number {
  return Math.min(getContractCollectedAmount(contract), contract.security_deposit);
}

export function sumExpenses(expenses: Pick<Expense, "amount">[]): number {
  return expenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0);
}
