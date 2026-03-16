import type { BoothType } from "./types";

export const WALL_RATES: Record<number, number> = {
  1: 4900,
  2: 9000,
  3: 12000,
  4: 15000,
  5: 17000,
};

// Garden and Outdoor share the same rate tier (TBD — set to 0 until confirmed)
export const GARDEN_OUTDOOR_RATES: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

export const SECURITY_DEPOSIT = 2000;
export const EXTRA_BRAND_FEE = 500;
export const HIGH_WATTAGE_FEE_PER_UNIT = 500;
export const SPACE_PENALTY_PER_INCH = 100;
export const INGRESS_PENALTY_PER_30MIN = 250;

export function getRateForBoothType(
  boothType: BoothType,
  weekendsAvailed: number
): number {
  if (boothType === "wall") return WALL_RATES[weekendsAvailed] ?? 0;
  return GARDEN_OUTDOOR_RATES[weekendsAvailed] ?? 0;
}

