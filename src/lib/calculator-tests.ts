/**
 * Подэтап 2.5.3 — машинные тестовые сценарии калькулятора.
 * Цены и единицы берутся напрямую из prices.ts. Ручное копирование
 * чисел запрещено.
 */
import { calculate } from "@/lib/calculator-engine";
import { getPriceById } from "@/data/prices";

type Scenario = { name: string; run: () => string | null };

const fail = (name: string, msg: string) => `${name}: ${msg}`;
const ok = (_name: string) => null;

function need(id: string) {
  const item = getPriceById(id);
  if (!item) throw new Error(`Тестовый сценарий ссылается на отсутствующий ID: ${id}`);
  return item;
}

const scenarios: Scenario[] = [
  {
    name: "Ремонт по пакету (cosmetic, 50 м²)",
    run: () => {
      const item = need("repair_packages-cosmetic");
      const r = calculate({ mode: "repair", lines: [{ id: item.id, volume: 50 }] });
      const expected = 50 * (item.priceFrom ?? 0);
      return r.subtotal === expected ? ok("") : fail("сумма", `expected ${expected}, got ${r.subtotal}`);
    },
  },
  {
    name: "Ремонт с дополнительной работой (cosmetic + demolition.peregorodka-blok)",
    run: () => {
      const pkg = need("repair_packages-cosmetic");
      const dem = need("demolition-peregorodka-blok");
      const r = calculate({
        mode: "repair",
        lines: [{ id: pkg.id, volume: 30 }, { id: dem.id, volume: 5 }],
      });
      const expected = 30 * (pkg.priceFrom ?? 0) + 5 * (dem.priceFrom ?? 0);
      const hasWarn = r.warnings.some((w) => w.code === "package-vs-item");
      if (r.subtotal !== expected) return fail("сумма", `expected ${expected}, got ${r.subtotal}`);
      if (!hasWarn) return fail("предупреждение", "ожидалось предупреждение package-vs-item");
      return null;
    },
  },
  {
    name: "Каркасный дом — под ключ (100 м²)",
    run: () => {
      const it = need("house_construction_work-karkasnye-doma-turnkey");
      const r = calculate({ mode: "house", lines: [{ id: it.id, volume: 100 }] });
      const expected = 100 * (it.priceFrom ?? 0);
      return r.subtotal === expected ? null : fail("сумма", `expected ${expected}, got ${r.subtotal}`);
    },
  },
  {
    name: "Газобетонный дом — под ключ (120 м²)",
    run: () => {
      const it = need("house_construction_work-doma-iz-gazobetona-turnkey");
      const r = calculate({ mode: "house", lines: [{ id: it.id, volume: 120 }] });
      const expected = 120 * (it.priceFrom ?? 0);
      return r.subtotal === expected ? null : fail("сумма", `${expected}/${r.subtotal}`);
    },
  },
  {
    name: "Дом с базовыми материалами (kombinirovannye)",
    run: () => {
      const it = need("house_construction_materials-kombinirovannye-doma-turnkey-materials");
      const r = calculate({ mode: "house", lines: [{ id: it.id, volume: 200 }] });
      const expected = 200 * (it.priceFrom ?? 0);
      return r.subtotal === expected ? null : fail("сумма", `${expected}/${r.subtotal}`);
    },
  },
  {
    name: "Монолитная работа в м³ (perekrytie)",
    run: () => {
      const it = need("monolithic-perekrytie");
      const r = calculate({ mode: "construction", lines: [{ id: it.id, volume: 8 }] });
      const expected = 8 * (it.priceFrom ?? 0);
      return r.subtotal === expected ? null : fail("сумма", `${expected}/${r.subtotal}`);
    },
  },
  {
    name: "Кладочная работа в м³ (gazobeton-naruzh)",
    run: () => {
      const it = need("masonry-gazobeton-naruzh");
      const r = calculate({ mode: "construction", lines: [{ id: it.id, volume: 12 }] });
      const expected = 12 * (it.priceFrom ?? 0);
      return r.subtotal === expected ? null : fail("сумма", `${expected}/${r.subtotal}`);
    },
  },
  {
    name: "Кровельная работа в м² (complex-utepl-metall)",
    run: () => {
      const it = need("roofing-complex-utepl-metall");
      const r = calculate({ mode: "construction", lines: [{ id: it.id, volume: 180 }] });
      const expected = 180 * (it.priceFrom ?? 0);
      return r.subtotal === expected ? null : fail("сумма", `${expected}/${r.subtotal}`);
    },
  },
  {
    name: "Фасадная работа в м² (mokryy)",
    run: () => {
      const it = need("facades-mokryy");
      const r = calculate({ mode: "construction", lines: [{ id: it.id, volume: 220 }] });
      const expected = 220 * (it.priceFrom ?? 0);
      return r.subtotal === expected ? null : fail("сумма", `${expected}/${r.subtotal}`);
    },
  },
  {
    name: "Электромонтажный пакет (basic, 60 м²)",
    run: () => {
      const it = need("electrical_packages-basic");
      const r = calculate({ mode: "engineering", lines: [{ id: it.id, volume: 60 }] });
      const expected = 60 * (it.priceFrom ?? 0);
      return r.subtotal === expected ? null : fail("сумма", `${expected}/${r.subtotal}`);
    },
  },
  {
    name: "Отдельные электрические точки (chernovaya-tochka, 22 шт.)",
    run: () => {
      const it = need("electrical-chernovaya-tochka");
      const r = calculate({ mode: "engineering", lines: [{ id: it.id, volume: 22 }] });
      const expected = 22 * (it.priceFrom ?? 0);
      return r.subtotal === expected ? null : fail("сумма", `${expected}/${r.subtotal}`);
    },
  },
  {
    name: "Сантехнический пакет (chastnyy-dom, 140 м²)",
    run: () => {
      const it = need("plumbing_packages-chastnyy-dom");
      const r = calculate({ mode: "engineering", lines: [{ id: it.id, volume: 140 }] });
      const expected = 140 * (it.priceFrom ?? 0);
      return r.subtotal === expected ? null : fail("сумма", `${expected}/${r.subtotal}`);
    },
  },
  {
    name: "Отдельная сантехническая работа (smesitel, 4 шт.)",
    run: () => {
      const it = need("plumbing-smesitel");
      const r = calculate({ mode: "engineering", lines: [{ id: it.id, volume: 4 }] });
      const expected = 4 * (it.priceFrom ?? 0);
      return r.subtotal === expected ? null : fail("сумма", `${expected}/${r.subtotal}`);
    },
  },
  {
    name: "Пакет отопления (bazovoe, 150 м²)",
    run: () => {
      const it = need("heating_packages-bazovoe");
      const r = calculate({ mode: "engineering", lines: [{ id: it.id, volume: 150 }] });
      const expected = 150 * (it.priceFrom ?? 0);
      return r.subtotal === expected ? null : fail("сумма", `${expected}/${r.subtotal}`);
    },
  },
  {
    name: "Тёплый пол по фактической единице (truba-tp, м²)",
    run: () => {
      const it = need("underfloor_heating-truba-tp");
      const r = calculate({ mode: "engineering", lines: [{ id: it.id, volume: 40 }] });
      const expected = 40 * (it.priceFrom ?? 0);
      return r.subtotal === expected ? null : fail("сумма", `${expected}/${r.subtotal}`);
    },
  },
  {
    name: "Процентная позиция генподряда — без базы СМР не считается",
    run: () => {
      const it = need("general_contracting-coordination");
      const r = calculate({ mode: "construction", lines: [{ id: it.id }] });
      if (r.subtotal !== 0) return fail("сумма", `ожидался 0 без базы СМР, got ${r.subtotal}`);
      if (!r.warnings.some((w) => w.code === "general-contracting-needs-base"))
        return fail("предупреждение", "ожидалось general-contracting-needs-base");
      return null;
    },
  },
  {
    name: "Процентная позиция генподряда — с базой СМР",
    run: () => {
      const it = need("general_contracting-coordination");
      const base = 10_000_000;
      const r = calculate({ mode: "construction", lines: [{ id: it.id, smetaBase: base }] });
      const expected = Math.round((base * (it.percentageFrom ?? 0)) / 100);
      return r.subtotal === expected ? null : fail("сумма", `${expected}/${r.subtotal}`);
    },
  },
  {
    name: "Позиция «по проекту» (demolition-vyvoz)",
    run: () => {
      const it = need("demolition-vyvoz");
      const r = calculate({ mode: "repair", lines: [{ id: it.id, volume: 1 }] });
      if (r.subtotal !== 0) return fail("сумма", "по-проектная позиция не должна давать сумму");
      if (r.byProject.length !== 1) return fail("byProject", "ожидалась 1 строка по проекту");
      return null;
    },
  },
  {
    name: "Попытка двойного учёта (electrical_packages-basic + electrical-chernovaya-tochka)",
    run: () => {
      const r = calculate({
        mode: "engineering",
        lines: [
          { id: "electrical_packages-basic", volume: 60 },
          { id: "electrical-chernovaya-tochka", volume: 10 },
        ],
      });
      return r.warnings.some((w) => w.code === "package-vs-item") ? null : fail("warn", "ожидалось package-vs-item");
    },
  },
  {
    name: "Нулевой объём",
    run: () => {
      const r = calculate({ mode: "repair", lines: [{ id: "repair_packages-cosmetic", volume: 0 }] });
      if (r.subtotal !== 0) return fail("сумма", "0 объём — 0 стоимость");
      if (!r.warnings.some((w) => w.code === "non-positive-volume")) return fail("warn", "ожидалось non-positive-volume");
      return null;
    },
  },
  {
    name: "Отрицательный объём",
    run: () => {
      const r = calculate({ mode: "repair", lines: [{ id: "repair_packages-cosmetic", volume: -5 }] });
      if (r.subtotal !== 0) return fail("сумма", "отрицательный объём не должен давать сумму");
      if (!r.warnings.some((w) => w.code === "non-positive-volume")) return fail("warn", "ожидалось non-positive-volume");
      return null;
    },
  },
  {
    name: "Несуществующий ID",
    run: () => {
      const r = calculate({ mode: "repair", lines: [{ id: "no-such-id", volume: 10 }] });
      if (r.subtotal !== 0) return fail("сумма", "сумма должна быть 0");
      if (!r.warnings.some((w) => w.code === "unknown-price-id")) return fail("warn", "ожидалось unknown-price-id");
      return null;
    },
  },
  {
    name: "NaN и Infinity не появляются в результате",
    run: () => {
      const r = calculate({
        mode: "repair",
        lines: [{ id: "repair_packages-cosmetic", volume: Number.POSITIVE_INFINITY }, { id: "repair_packages-cosmetic", volume: Number.NaN }],
      });
      if (!Number.isFinite(r.subtotal)) return fail("subtotal", "не finite");
      for (const l of r.lines) if (l.cost !== undefined && !Number.isFinite(l.cost)) return fail(l.id, "не finite cost");
      return null;
    },
  },
  {
    name: "Восстановление из localStorage (имитация)",
    run: () => {
      const snapshot = { mode: "repair" as const, lines: [{ id: "repair_packages-cosmetic", volume: 70 }] };
      const json = JSON.stringify(snapshot);
      const parsed = JSON.parse(json);
      const r = calculate(parsed);
      const exp = 70 * (need("repair_packages-cosmetic").priceFrom ?? 0);
      return r.subtotal === exp ? null : fail("сумма", `${exp}/${r.subtotal}`);
    },
  },
  {
    name: "Очистка localStorage (пустой ввод)",
    run: () => {
      const r = calculate({ mode: "repair", lines: [] });
      return r.subtotal === 0 && r.lines.length === 0 ? null : fail("сумма", "пустой ввод — нулевая сумма");
    },
  },
  {
    name: "Некорректный query-параметр (несуществующий mode)",
    run: () => {
      const bad = "weird-mode" as unknown as "repair";
      const r = calculate({ mode: bad, lines: [] });
      return r.subtotal === 0 ? null : fail("сумма", "не должно падать");
    },
  },
];

let failed = 0;
for (const s of scenarios) {
  try {
    const err = s.run();
    if (err === null) {
      console.log(`  ✓ ${s.name}`);
    } else {
      failed++;
      console.error(`  ✗ ${s.name}: ${err}`);
    }
  } catch (e) {
    failed++;
    console.error(`  ✗ ${s.name}: исключение ${(e as Error).message}`);
  }
}
console.log(`calculator-tests: ${scenarios.length - failed}/${scenarios.length} прошли`);
if (failed > 0) {
  console.error(`✗ calculator-tests: провалено ${failed}`);
  process.exit(1);
}
console.log("✓ calculator-tests passed.");
process.exit(0);
