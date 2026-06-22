/**
 * Подэтап 2.5.3 — типы калькулятора предварительной стоимости.
 * Все идентификаторы ценовых позиций совпадают с prices.ts. Запрещено
 * добавлять коэффициенты или формулы без подтверждённого источника.
 */
import type { PriceCategory, PriceUnit } from "./pricing";

export type CalculatorMode =
  | "repair"
  | "house"
  | "construction"
  | "engineering";

export const CALCULATOR_MODES: CalculatorMode[] = [
  "repair",
  "house",
  "construction",
  "engineering",
];

export type HouseCompletionLevel =
  | "shell"
  | "warm"
  | "prefinish"
  | "turnkey"
  | "turnkey-materials";

export const HOUSE_COMPLETION_LEVEL_IDS: HouseCompletionLevel[] = [
  "shell",
  "warm",
  "prefinish",
  "turnkey",
  "turnkey-materials",
];

export type CalculatorLineInput = {
  /** ID позиции из prices.ts. */
  id: string;
  /** Объём в фактической единице позиции. Не используется для процентных позиций. */
  volume?: number;
  /** Стоимость СМР, вручную введённая пользователем для процентных позиций. */
  smetaBase?: number;
};

export type CalculatorInput = {
  mode: CalculatorMode;
  /** Площадь пола (repair) или площадь дома (house) в м². */
  area?: number;
  /** Пакет ремонта (repair_packages.id) или пакет (engineering). */
  packageId?: string;
  /** Уровень готовности для режима «дом». */
  completionLevel?: HouseCompletionLevel;
  /** slug технологии дома для режима «дом». */
  technologySlug?: string;
  /** Произвольные строки расчёта. */
  lines: CalculatorLineInput[];
};

export type CalculatorLineStatus = "ok" | "by-project" | "skipped";

export type CalculatorLineResult = {
  id: string;
  name: string;
  category: PriceCategory | "unknown";
  unit: PriceUnit | "—";
  unitLabel?: string;
  volume?: number;
  unitPrice?: number;
  percent?: number;
  smetaBase?: number;
  cost?: number;
  status: CalculatorLineStatus;
  reason?: string;
};

export type CalculatorWarning = {
  code:
    | "package-vs-item"
    | "house-work-vs-materials"
    | "roofing-complex-vs-separate"
    | "general-contracting-needs-base"
    | "missing-volume"
    | "non-positive-volume"
    | "non-finite-volume"
    | "unknown-price-id"
    | "by-project"
    | "unit-mismatch";
  message: string;
  affects: string[];
};

export type CalculatorResult = {
  mode: CalculatorMode;
  lines: CalculatorLineResult[];
  byProject: CalculatorLineResult[];
  skipped: CalculatorLineResult[];
  subtotal: number;
  warnings: CalculatorWarning[];
};

export const CALCULATOR_LOCAL_STORAGE_KEY = "shadov-cost-calculator-v1" as const;
