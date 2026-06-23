// Все доступные фотореалистичные рендеры проектов. Vite собирает карту
// slug → оптимизированный URL. Если файла нет — компонент покажет
// схематичный SVG-фасад.
const modules = import.meta.glob<{ default: string }>("./*.jpg", { eager: true });

export const PROJECT_RENDERS: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => {
    const slug = path.replace(/^\.\//, "").replace(/\.jpg$/, "");
    return [slug, mod.default];
  }),
);

export function getProjectRender(slug: string): string | undefined {
  return PROJECT_RENDERS[slug];
}