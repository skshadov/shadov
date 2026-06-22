/**
 * Подэтап 2.5.3 — чистый расчётный модуль калькулятора.
 * Без React, без eval, без строковых формул. Использует только утверждённые
 * цены из prices.ts и спецификацию calculator-specification.ts.
 */
import { getPriceById } from "@/data/prices";
import type { PriceItem, PriceCategory } from "@/types/pricing";
import type {
  CalculatorInput,
  CalculatorLineInput,
  CalculatorLineResult,
  CalculatorResult,
  CalculatorWarning,
} from "@/types/calculator";
import {
  PACKAGE_CONFLICTS,
  ROOFING_COMPLEX_PREFIX,
  BY_PROJECT_ITEM_IDS,
} from "@/data/calculator-specification";

const MAX_VOLUME = 1_000_000_000;

function safePositive(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0 && n <= MAX_VOLUME;
}
function safeNonNegative(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= MAX_VOLUME;
}

function roundRubles(n: number): number {
  // Промежуточные значения не округляем до тысяч; итоговая строка — до рубля.
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

function unknownLine(input: CalculatorLineInput): CalculatorLineResult {
  return {
    id: input.id,
    name: "Неизвестная позиция",
    category: "unknown",
    unit: "—",
    status: "skipped",
    reason: "Идентификатор позиции не найден в prices.ts",
  };
}

function byProjectLine(item: PriceItem): CalculatorLineResult {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    unit: item.unit ?? "—",
    unitLabel: item.unitLabel,
    status: "by-project",
    reason: item.priceLabel ?? "Рассчитывается по проекту",
  };
}

function computeOneLine(input: CalculatorLineInput, item: PriceItem, warnings: CalculatorWarning[]): CalculatorLineResult {
  // Позиции «по проекту» / individual / без числовой цены.
  if (
    item.mode === "individual" ||
    BY_PROJECT_ITEM_IDS.includes(item.id) ||
    (item.priceLabel && item.priceFrom === undefined && item.percentageFrom === undefined)
  ) {
    warnings.push({ code: "by-project", message: `${item.name}: рассчитывается по проекту`, affects: [item.id] });
    return byProjectLine(item);
  }

  // Процентная позиция: требует ручной ввод базы СМР.
  if (typeof item.percentageFrom === "number") {
    const base = input.smetaBase;
    if (!safeNonNegative(base) || base === 0) {
      warnings.push({
        code: "general-contracting-needs-base",
        message: `${item.name}: расчёт возможен только после ручного ввода стоимости СМР.`,
        affects: [item.id],
      });
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit ?? "%",
        percent: item.percentageFrom,
        status: "skipped",
        reason: "Не введена стоимость СМР",
      };
    }
    const cost = roundRubles((base * item.percentageFrom) / 100);
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit ?? "%",
      percent: item.percentageFrom,
      smetaBase: base,
      cost,
      status: "ok",
    };
  }

  // Числовая позиция: требует объём в фактической единице позиции.
  if (typeof item.priceFrom === "number" && item.unit) {
    const volume = input.volume;
    if (volume === undefined) {
      warnings.push({
        code: "missing-volume",
        message: `${item.name}: введите объём (${item.unitLabel ?? item.unit}).`,
        affects: [item.id],
      });
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        unitLabel: item.unitLabel,
        unitPrice: item.priceFrom,
        status: "skipped",
        reason: "Не введён объём",
      };
    }
    if (typeof volume !== "number" || !Number.isFinite(volume)) {
      warnings.push({
        code: "non-finite-volume",
        message: `${item.name}: объём должен быть числом.`,
        affects: [item.id],
      });
      return {
        id: item.id, name: item.name, category: item.category,
        unit: item.unit, unitLabel: item.unitLabel, unitPrice: item.priceFrom,
        status: "skipped", reason: "Объём не является конечным числом",
      };
    }
    if (volume <= 0) {
      warnings.push({
        code: "non-positive-volume",
        message: `${item.name}: объём должен быть положительным.`,
        affects: [item.id],
      });
      return {
        id: item.id, name: item.name, category: item.category,
        unit: item.unit, unitLabel: item.unitLabel, unitPrice: item.priceFrom,
        status: "skipped", reason: "Неположительный объём",
      };
    }
    if (volume > MAX_VOLUME) {
      warnings.push({
        code: "non-finite-volume",
        message: `${item.name}: слишком большой объём.`,
        affects: [item.id],
      });
      return {
        id: item.id, name: item.name, category: item.category,
        unit: item.unit, unitLabel: item.unitLabel, unitPrice: item.priceFrom,
        status: "skipped", reason: "Слишком большой объём",
      };
    }
    const cost = roundRubles(volume * item.priceFrom);
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      unitLabel: item.unitLabel,
      volume,
      unitPrice: item.priceFrom,
      cost,
      status: "ok",
    };
  }

  warnings.push({
    code: "by-project",
    message: `${item.name}: рассчитывается по проекту`,
    affects: [item.id],
  });
  return byProjectLine(item);
}

function detectDoubleCounting(items: PriceItem[], warnings: CalculatorWarning[]) {
  const cats = new Set(items.map((i) => i.category));
  for (const [pkgCat, conflictList] of Object.entries(PACKAGE_CONFLICTS)) {
    if (!cats.has(pkgCat as PriceCategory)) continue;
    for (const conflict of conflictList) {
      if (cats.has(conflict)) {
        warnings.push({
          code: "package-vs-item",
          message:
            "Проверьте состав выбранного пакета: отдельная работа может уже входить в его стоимость.",
          affects: items
            .filter((i) => i.category === conflict || i.category === pkgCat)
            .map((i) => i.id),
        });
        break;
      }
    }
  }

  // Работы и работы+материалы для дома — альтернативы, не суммируются.
  if (cats.has("house_construction_work") && cats.has("house_construction_materials")) {
    warnings.push({
      code: "house-work-vs-materials",
      message:
        "«Только работы» и «работы с базовыми материалами» — альтернативные режимы и не складываются.",
      affects: items
        .filter(
          (i) =>
            i.category === "house_construction_work" ||
            i.category === "house_construction_materials",
        )
        .map((i) => i.id),
    });
  }

  // Кровля — комплекс vs отдельные работы.
  const roofingItems = items.filter((i) => i.category === "roofing");
  const hasComplex = roofingItems.some((i) => i.id.startsWith(ROOFING_COMPLEX_PREFIX));
  const hasSeparate = roofingItems.some((i) => !i.id.startsWith(ROOFING_COMPLEX_PREFIX));
  if (hasComplex && hasSeparate) {
    warnings.push({
      code: "roofing-complex-vs-separate",
      message:
        "Кровельное комплексное решение и входящие в него отдельные операции по умолчанию не суммируются.",
      affects: roofingItems.map((i) => i.id),
    });
  }
}

export function calculate(input: CalculatorInput): CalculatorResult {
  const warnings: CalculatorWarning[] = [];
  const lines: CalculatorLineResult[] = [];

  // Дедупликация строк по id+volume+smetaBase: повторное добавление одной позиции
  // не суммируется автоматически, фиксируется одной строкой с предупреждением.
  const seen = new Set<string>();
  const dedupedInputs: CalculatorLineInput[] = [];
  for (const l of input.lines) {
    const key = `${l.id}::${l.volume ?? ""}::${l.smetaBase ?? ""}`;
    if (seen.has(key)) {
      warnings.push({
        code: "package-vs-item",
        message: `${l.id}: дубликат строки — повторное добавление не суммируется.`,
        affects: [l.id],
      });
      continue;
    }
    seen.add(key);
    dedupedInputs.push(l);
  }

  const resolvedItems: PriceItem[] = [];
  for (const li of dedupedInputs) {
    const item = getPriceById(li.id);
    if (!item) {
      warnings.push({
        code: "unknown-price-id",
        message: `Позиция ${li.id} не найдена в prices.ts.`,
        affects: [li.id],
      });
      lines.push(unknownLine(li));
      continue;
    }
    resolvedItems.push(item);
    lines.push(computeOneLine(li, item, warnings));
  }

  detectDoubleCounting(resolvedItems, warnings);

  const okLines = lines.filter((l) => l.status === "ok");
  const byProject = lines.filter((l) => l.status === "by-project");
  const skipped = lines.filter((l) => l.status === "skipped");

  const subtotal = okLines.reduce(
    (s, l) => s + (typeof l.cost === "number" && Number.isFinite(l.cost) && l.cost > 0 ? l.cost : 0),
    0,
  );

  return {
    mode: input.mode,
    lines,
    byProject,
    skipped,
    subtotal: roundRubles(subtotal),
    warnings,
  };
}

export const __testing = { roundRubles, computeOneLine, detectDoubleCounting };
