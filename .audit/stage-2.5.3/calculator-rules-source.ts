/**
 * Подэтап 2.1 — коэффициенты калькулятора (§13 запроса).
 * На этом подэтапе только источник данных. Калькулятор не применяет коэффициенты.
 */

export type CalculatorRule = {
  id: string;
  label: string;
  minCoefficient?: number;
  maxCoefficient?: number;
  individualCalculation: boolean;
  appliesTo: string[];
};

export const CALCULATOR_RULES: CalculatorRule[] = [
  // С утверждённым коэффициентом
  { id: "apartment-under-40",     label: "Квартира менее 40 м²",            minCoefficient: 1.15, maxCoefficient: 1.15, individualCalculation: false, appliesTo: ["repair"] },
  { id: "room-under-10",          label: "Помещение менее 10 м²",           minCoefficient: 1.20, maxCoefficient: 1.20, individualCalculation: false, appliesTo: ["repair", "tiling", "electrical", "plumbing"] },
  { id: "ceiling-3-4m",           label: "Высота помещения 3–4 м",          minCoefficient: 1.15, maxCoefficient: 1.15, individualCalculation: false, appliesTo: ["repair", "tiling", "finishing"] },
  { id: "complex-geometry",       label: "Сложная геометрия",                minCoefficient: 1.10, maxCoefficient: 1.30, individualCalculation: false, appliesTo: ["repair", "tiling", "finishing", "construction"] },
  { id: "working-premises",       label: "Работы в действующем помещении",   minCoefficient: 1.15, maxCoefficient: 1.25, individualCalculation: false, appliesTo: ["repair", "engineering"] },
  { id: "urgency",                label: "Срочность",                         minCoefficient: 1.20, maxCoefficient: 1.40, individualCalculation: false, appliesTo: ["repair", "construction", "engineering"] },
  { id: "night-work",             label: "Ночные работы",                     minCoefficient: 1.30, maxCoefficient: 1.30, individualCalculation: false, appliesTo: ["repair", "engineering"] },
  { id: "winter-external",        label: "Зимние наружные работы",            minCoefficient: 1.10, maxCoefficient: 1.25, individualCalculation: false, appliesTo: ["construction", "facades", "roofing"] },

  // Только индивидуальный расчёт — без коэффициента
  { id: "ceiling-over-4m",        label: "Высота более 4 м",                  individualCalculation: true, appliesTo: ["repair", "construction"] },
  { id: "manual-lifting",         label: "Ручной подъём материалов",          individualCalculation: true, appliesTo: ["repair", "construction"] },
  { id: "moscow-center",          label: "Центр Москвы",                      individualCalculation: true, appliesTo: ["repair", "construction", "engineering"] },
  { id: "limited-access",         label: "Ограниченный подъезд",              individualCalculation: true, appliesTo: ["repair", "construction"] },
  { id: "no-freight-elevator",    label: "Отсутствие грузового лифта",        individualCalculation: true, appliesTo: ["repair"] },
];

export function getCalculatorRule(id: string): CalculatorRule | undefined {
  return CALCULATOR_RULES.find((r) => r.id === id);
}
