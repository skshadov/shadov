import type { ServicePricing } from "./types";
import { SHTUKATURKA } from "./shtukaturka";
import { STYAZHKA } from "./styazhka";
import { POLUSUHAYA } from "./polusuhaya";
import { TEPLYY_POL } from "./teplyy-pol";
import { ELEKTRIKA } from "./elektrika";
import { SANTEHNIKA } from "./santehnika";

export * from "./types";

export const SERVICE_PRICING: ServicePricing[] = [
  SHTUKATURKA,
  STYAZHKA,
  POLUSUHAYA,
  TEPLYY_POL,
  ELEKTRIKA,
  SANTEHNIKA,
];

export function getServicePricing(slug: string): ServicePricing | undefined {
  return SERVICE_PRICING.find((s) => s.slug === slug);
}

export { SHTUKATURKA, STYAZHKA, POLUSUHAYA, TEPLYY_POL, ELEKTRIKA, SANTEHNIKA };