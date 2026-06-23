import { useMemo, useState } from "react";
import type { HouseProject, FeatureKey } from "@/data/projects";
import { FEATURE_LABEL } from "@/data/projects";
import { MATERIAL_LABEL, type MaterialKey } from "@/data/projects-pricing";

type FloorFilter = "all" | "1" | "1.5" | "2";
type SortKey = "default" | "area-asc" | "area-desc" | "floors-asc";

export interface FilterState {
  materials: MaterialKey[];
  floor: FloorFilter;
  bedrooms: number | null;     // null = any, 5 means 5+
  features: FeatureKey[];
  areaMin: number;
  areaMax: number;
  query: string;
  sort: SortKey;
}

const DEFAULT: FilterState = {
  materials: [],
  floor: "all",
  bedrooms: null,
  features: [],
  areaMin: 50,
  areaMax: 360,
  query: "",
  sort: "default",
};

const MATERIALS: MaterialKey[] = ["frame", "sip", "gas", "brick"];
const FEATURES: FeatureKey[] = ["garage", "terrace", "boiler", "sauna", "second-light", "master"];

export function useFilteredProjects(all: HouseProject[]) {
  const [state, setState] = useState<FilterState>(DEFAULT);

  const list = useMemo(() => {
    let out = all.filter((p) => {
      if (state.materials.length && !state.materials.includes(p.primaryMaterial)) return false;
      if (state.floor !== "all" && String(p.floors) !== state.floor) return false;
      if (state.bedrooms != null) {
        if (state.bedrooms === 5 ? p.bedrooms < 5 : p.bedrooms !== state.bedrooms) return false;
      }
      if (p.area < state.areaMin || p.area > state.areaMax) return false;
      if (state.features.length && !state.features.every((f) => p.features.includes(f))) return false;
      if (state.query.trim()) {
        const q = state.query.trim().toLowerCase();
        if (!p.slug.toLowerCase().includes(q) && !p.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    switch (state.sort) {
      case "area-asc": out = [...out].sort((a, b) => a.area - b.area); break;
      case "area-desc": out = [...out].sort((a, b) => b.area - a.area); break;
      case "floors-asc": out = [...out].sort((a, b) => a.floors - b.floors); break;
    }
    return out;
  }, [all, state]);

  return { state, setState, list };
}

export function CatalogFilters({
  state, setState, totalCount,
}: {
  state: FilterState;
  setState: (s: FilterState) => void;
  totalCount: number;
}) {
  const toggleMaterial = (m: MaterialKey) =>
    setState({
      ...state,
      materials: state.materials.includes(m)
        ? state.materials.filter((x) => x !== m)
        : [...state.materials, m],
    });

  const toggleFeature = (f: FeatureKey) =>
    setState({
      ...state,
      features: state.features.includes(f)
        ? state.features.filter((x) => x !== f)
        : [...state.features, f],
    });

  return (
    <aside className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">Фильтры</h2>
        <button
          type="button"
          onClick={() => setState(DEFAULT)}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Сбросить
        </button>
      </div>

      <Group title="Поиск">
        <input
          type="search"
          inputMode="search"
          placeholder="Артикул или название"
          value={state.query}
          onChange={(e) => setState({ ...state, query: e.target.value })}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </Group>

      <Group title="Материал">
        <div className="flex flex-wrap gap-2">
          {MATERIALS.map((m) => (
            <Chip key={m} active={state.materials.includes(m)} onClick={() => toggleMaterial(m)}>
              {MATERIAL_LABEL[m]}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Этажность">
        <div className="flex flex-wrap gap-2">
          {(["all", "1", "1.5", "2"] as FloorFilter[]).map((f) => (
            <Chip key={f} active={state.floor === f} onClick={() => setState({ ...state, floor: f })}>
              {f === "all" ? "Все" : f === "1.5" ? "С мансардой" : `${f} этаж${f === "1" ? "" : "а"}`}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Спальни">
        <div className="flex flex-wrap gap-2">
          <Chip active={state.bedrooms == null} onClick={() => setState({ ...state, bedrooms: null })}>Любое</Chip>
          {[1, 2, 3, 4, 5].map((n) => (
            <Chip key={n} active={state.bedrooms === n} onClick={() => setState({ ...state, bedrooms: n })}>
              {n === 5 ? "5+" : n}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title={`Площадь: ${state.areaMin}–${state.areaMax} м²`}>
        <div className="flex items-center gap-3">
          <input
            type="range" min={50} max={360} value={state.areaMin}
            onChange={(e) => setState({ ...state, areaMin: Math.min(+e.target.value, state.areaMax - 10) })}
            className="w-full accent-primary"
          />
          <input
            type="range" min={50} max={360} value={state.areaMax}
            onChange={(e) => setState({ ...state, areaMax: Math.max(+e.target.value, state.areaMin + 10) })}
            className="w-full accent-primary"
          />
        </div>
      </Group>

      <Group title="Особенности">
        <div className="flex flex-wrap gap-2">
          {FEATURES.map((f) => (
            <Chip key={f} active={state.features.includes(f)} onClick={() => toggleFeature(f)}>
              {FEATURE_LABEL[f]}
            </Chip>
          ))}
        </div>
      </Group>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Найдено: <span className="font-medium text-foreground">{totalCount}</span></span>
        <select
          value={state.sort}
          onChange={(e) => setState({ ...state, sort: e.target.value as SortKey })}
          className="rounded border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="default">по умолчанию</option>
          <option value="area-asc">площадь ↑</option>
          <option value="area-desc">площадь ↓</option>
          <option value="floors-asc">этажность ↑</option>
        </select>
      </div>
    </aside>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}