/**
 * Живые правки контента сайта (прайс и фотографии) из админки.
 * SSR отдаёт статичные значения из `src/data/pricing`, после гидратации
 * применяются сохранённые переопределения.
 */
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_PRICING } from "@/data/pricing";
import type { CalcConfig, PriceGroup, ServicePricing } from "@/data/pricing/types";

export interface PricingOverride {
  priceHeadline?: string;
  priceHeadlineNote?: string;
  lead?: string;
  baseConditions?: string[];
  groups?: PriceGroup[];
  calc?: CalcConfig;
}

interface SiteContentState {
  pricing: Record<string, PricingOverride>;
  images: Record<string, string>;
  loaded: boolean;
}

const EMPTY: SiteContentState = { pricing: {}, images: {}, loaded: false };
let state: SiteContentState = EMPTY;
let started = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function siteImageUrl(key: string, version?: string | null): string {
  const v = version ? `?v=${encodeURIComponent(version)}` : "";
  return `/api/public/site-image/${encodeURIComponent(key)}${v}`;
}

export async function refreshSiteContent(): Promise<void> {
  const [pricingRes, imagesRes] = await Promise.all([
    supabase.from("site_pricing").select("slug, data"),
    supabase.from("site_images").select("key, updated_at"),
  ]);

  const pricing: Record<string, PricingOverride> = {};
  for (const row of pricingRes.data ?? []) {
    if (row.data && typeof row.data === "object") {
      pricing[row.slug] = row.data as PricingOverride;
    }
  }
  const images: Record<string, string> = {};
  for (const row of imagesRes.data ?? []) {
    images[row.key] = siteImageUrl(row.key, row.updated_at);
  }

  state = { pricing, images, loaded: true };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    void refreshSiteContent().catch(() => undefined);
  }
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}
function getServerSnapshot() {
  return EMPTY;
}

export function useSiteContent(): SiteContentState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function mergePricing(base: ServicePricing, ov?: PricingOverride): ServicePricing {
  if (!ov) return base;
  return {
    ...base,
    ...(ov.priceHeadline ? { priceHeadline: ov.priceHeadline } : {}),
    ...(ov.priceHeadlineNote ? { priceHeadlineNote: ov.priceHeadlineNote } : {}),
    ...(ov.lead ? { lead: ov.lead } : {}),
    ...(Array.isArray(ov.baseConditions) ? { baseConditions: ov.baseConditions } : {}),
    ...(Array.isArray(ov.groups) ? { groups: ov.groups } : {}),
    ...(ov.calc ? { calc: { ...base.calc, ...ov.calc } } : {}),
  };
}

/** Прайс одного направления с учётом правок админки. */
export function useLivePricing(base: ServicePricing): ServicePricing {
  const { pricing } = useSiteContent();
  return mergePricing(base, pricing[base.slug]);
}

/** Все направления с учётом правок админки. */
export function useLivePricingList(): ServicePricing[] {
  const { pricing } = useSiteContent();
  return SERVICE_PRICING.map((s) => mergePricing(s, pricing[s.slug]));
}

/** URL заменённой фотографии слота (или undefined — используется исходная). */
export function useSiteImageUrl(key: string): string | undefined {
  return useSiteContent().images[key];
}