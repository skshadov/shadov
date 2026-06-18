/**
 * Подэтап 2.1 — переключатель режимов прайса (работы / работы+базовые материалы).
 * На подэтапе 2.1 — управляемый компонент без сторонних эффектов.
 */
interface PriceModeToggleProps {
  value: "work" | "work_and_basic_materials";
  onChange: (v: "work" | "work_and_basic_materials") => void;
  hasMaterials: boolean;
}

export function PriceModeToggle({ value, onChange, hasMaterials }: PriceModeToggleProps) {
  return (
    <div role="radiogroup" aria-label="Режим прайса" className="inline-flex rounded-md border border-border bg-card p-1 text-xs font-medium">
      <button
        type="button"
        role="radio"
        aria-checked={value === "work"}
        onClick={() => onChange("work")}
        className={`min-h-9 rounded px-3 ${value === "work" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
      >
        Только работы
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "work_and_basic_materials"}
        onClick={() => onChange("work_and_basic_materials")}
        disabled={!hasMaterials}
        className={`min-h-9 rounded px-3 ${value === "work_and_basic_materials" ? "bg-primary text-primary-foreground" : "text-muted-foreground"} disabled:opacity-50`}
      >
        Работы и базовые материалы
      </button>
    </div>
  );
}
