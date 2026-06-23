import { Link } from "@tanstack/react-router";
import type { HouseProject } from "@/data/projects";
import { MATERIAL_LABEL } from "@/data/projects-pricing";
import { ProjectCover } from "./ProjectCover";

export function ProjectCard({ p }: { p: HouseProject }) {
  const floorsLabel = p.floors === 1 ? "1 этаж" : p.floors === 1.5 ? "С мансардой" : "2 этажа";
  return (
    <Link
      to="/proekty/$slug"
      params={{ slug: p.slug }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <ProjectCover project={p} className="h-full w-full" />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-foreground backdrop-blur">
          {MATERIAL_LABEL[p.primaryMaterial]}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
          Входит в стоимость
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{p.slug}</span>
          <span>{p.width}×{p.depth} м</span>
        </div>
        <h3 className="font-display text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
          {p.title}
        </h3>
        <ul className="mt-auto grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <li><span className="block text-foreground text-sm font-medium">{p.area}</span>м² общая</li>
          <li><span className="block text-foreground text-sm font-medium">{floorsLabel}</span>этажность</li>
          <li><span className="block text-foreground text-sm font-medium">{p.bedrooms}</span>спален</li>
        </ul>
      </div>
    </Link>
  );
}