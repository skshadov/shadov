import type { HouseProject, RoomSpec, FloorKey } from "@/data/projects";

/**
 * Схематичный поэтажный план: автоматически раскладывает помещения
 * прямоугольной сеткой, размер блока пропорционален площади комнаты.
 * Это концептуальная схема, не архитектурный чертёж — точные размеры
 * выдаются после заключения договора.
 */
interface Props {
  project: HouseProject;
  floor: FloorKey;
  className?: string;
}

export function ProjectFloorPlan({ project, floor, className }: Props) {
  const rooms = project.rooms.filter((r) => r.floor === floor);
  if (rooms.length === 0) return null;

  // simple shelf-pack: ширина холста 400, высота — динамически
  const W = 400;
  const PAD = 6;
  const totalA = rooms.reduce((s, r) => s + r.area, 0);
  // целевая высота холста
  const H = 280;
  const scale = (W * H) / Math.max(totalA, 1);

  type Block = { r: RoomSpec; x: number; y: number; w: number; h: number };
  const blocks: Block[] = [];
  let x = PAD;
  let y = PAD;
  let rowH = 0;

  for (const room of rooms) {
    const a = Math.max(room.area * scale, 1200);
    // приоритетная ширина: попробуем сделать чуть «горизонтальной»
    let w = Math.min(W - 2 * PAD, Math.round(Math.sqrt(a * 1.4)));
    let h = Math.max(Math.round(a / w), 38);
    if (x + w > W - PAD) {
      x = PAD;
      y += rowH + PAD;
      rowH = 0;
    }
    blocks.push({ r: room, x, y, w, h });
    x += w + PAD;
    if (h > rowH) rowH = h;
  }
  const totalH = y + rowH + PAD;

  return (
    <svg
      viewBox={`0 0 ${W} ${totalH}`}
      role="img"
      aria-label={`Схема ${floor === "mansard" ? "мансарды" : `${floor} этажа`} проекта ${project.slug}`}
      className={className}
    >
      <rect width={W} height={totalH} fill="#FAFAF7" />
      {blocks.map((b, i) => (
        <g key={i}>
          <rect
            x={b.x} y={b.y} width={b.w} height={b.h}
            fill="#FFFFFF" stroke="#2C3138" strokeWidth="1.2"
          />
          <text
            x={b.x + b.w / 2}
            y={b.y + b.h / 2 - 4}
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui"
            fontSize={Math.min(12, Math.max(9, b.w / 12))}
            fill="#2C3138"
          >
            {b.r.name}
          </text>
          <text
            x={b.x + b.w / 2}
            y={b.y + b.h / 2 + 12}
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui"
            fontSize={Math.min(11, Math.max(8, b.w / 14))}
            fill="#5A6471"
          >
            {b.r.area} м²
          </text>
        </g>
      ))}
    </svg>
  );
}