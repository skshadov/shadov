import type { HouseProject, RoomSpec, FloorKey } from "@/data/projects";

/**
 * Архитектурно-стилизованный поэтажный план в духе catalog-plans.ru:
 * толстые синие наружные стены, тонкие межкомнатные перегородки,
 * цветовая заливка по типу помещения, окна (разрывы во внешней стене),
 * дуги дверных проёмов и штриховка лестниц. Это художественная схема —
 * рабочие чертежи выдаются после договора.
 */
interface Props {
  project: HouseProject;
  floor: FloorKey;
  className?: string;
}

type Category = "bedroom" | "bath" | "stairs" | "tech" | "outdoor" | "common";

function categorize(name: string): Category {
  const n = name.toLowerCase();
  if (/(спальн|детск|мастер)/.test(n)) return "bedroom";
  if (/(санузел|ванн|душ|гард|постироч|wc)/.test(n)) return "bath";
  if (/(лестниц|второй свет)/.test(n)) return "stairs";
  if (/(котельн|техн|кладов|тамбур)/.test(n)) return "tech";
  if (/(терра|балкон|крыльц|веранд)/.test(n)) return "outdoor";
  return "common";
}

const FILL: Record<Category, string> = {
  bedroom: "#FBE6EC",
  bath: "#D8ECF7",
  stairs: "#FFE2B8",
  tech: "#EFEAE0",
  outdoor: "#E6E0CE",
  common: "#FFFFFF",
};

const WALL = "#2F4E8B";
const WALL_OUTER = 10;
const WALL_INNER = 3;
const BG = "#F6F1E3";

type Block = { r: RoomSpec; x: number; y: number; w: number; h: number; cat: Category };

export function ProjectFloorPlan({ project, floor, className }: Props) {
  const rooms = project.rooms.filter((r) => r.floor === floor);
  if (rooms.length === 0) return null;

  // Shelf-pack без зазоров: комнаты делят общие стены.
  const W = 560;
  const TOP = 38; // заголовок
  const MARGIN = 22;
  const innerW = W - MARGIN * 2;
  const targetH = 360;
  const totalA = rooms.reduce((s, r) => s + r.area, 0);
  const scale = (innerW * targetH) / Math.max(totalA, 1);

  const blocks: Block[] = [];
  let cx = MARGIN;
  let cy = TOP + MARGIN;
  let rowH = 0;
  let rowStart = 0;

  for (const room of rooms) {
    const a = Math.max(room.area * scale, 6000);
    let w = Math.min(innerW, Math.round(Math.sqrt(a * 1.35)));
    let h = Math.max(Math.round(a / w), 60);
    if (cx + w > MARGIN + innerW + 0.5) {
      // растянуть предыдущий ряд до правой границы
      const rowItems = blocks.slice(rowStart);
      if (rowItems.length > 0) {
        const lastRight = rowItems[rowItems.length - 1].x + rowItems[rowItems.length - 1].w;
        const gap = MARGIN + innerW - lastRight;
        if (gap > 0) rowItems[rowItems.length - 1].w += gap;
      }
      cx = MARGIN;
      cy += rowH;
      rowH = 0;
      rowStart = blocks.length;
    }
    blocks.push({ r: room, x: cx, y: cy, w, h, cat: categorize(room.name) });
    cx += w;
    if (h > rowH) rowH = h;
  }
  // последний ряд: растянуть по высоте до общей средней высоты
  // и докрутить правую границу
  const lastRow = blocks.slice(rowStart);
  if (lastRow.length > 0) {
    const last = lastRow[lastRow.length - 1];
    const gap = MARGIN + innerW - (last.x + last.w);
    if (gap > 0) last.w += gap;
  }
  // выровнять высоту блоков внутри каждого ряда
  let i = 0;
  while (i < blocks.length) {
    const yRow = blocks[i].y;
    let j = i;
    let maxH = 0;
    while (j < blocks.length && blocks[j].y === yRow) {
      if (blocks[j].h > maxH) maxH = blocks[j].h;
      j++;
    }
    for (let k = i; k < j; k++) blocks[k].h = maxH;
    i = j;
  }

  const totalH = (blocks[blocks.length - 1].y + blocks[blocks.length - 1].h) + MARGIN;

  // bbox строения
  const bx = MARGIN;
  const by = TOP + MARGIN;
  const bw = innerW;
  const bh = totalH - by - MARGIN;

  // Определяем какие стороны каждой комнаты — внешние (для окон)
  const isOuter = (b: Block, side: "n" | "s" | "e" | "w"): boolean => {
    if (side === "n") return Math.abs(b.y - by) < 0.5;
    if (side === "s") return Math.abs(b.y + b.h - (by + bh)) < 0.5;
    if (side === "w") return Math.abs(b.x - bx) < 0.5;
    return Math.abs(b.x + b.w - (bx + bw)) < 0.5;
  };

  const floorTitle =
    floor === "mansard" ? "План мансарды" : floor === 2 ? "План 2 этажа" : "План 1 этажа";

  return (
    <svg
      viewBox={`0 0 ${W} ${totalH}`}
      role="img"
      aria-label={`${floorTitle} проекта ${project.slug}`}
      className={className}
    >
      <rect width={W} height={totalH} fill={BG} />

      <text
        x={W / 2}
        y={26}
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={15}
        fill="#2C3138"
      >
        {floorTitle}
      </text>

      {/* Заливка комнат */}
      {blocks.map((b, k) => (
        <rect key={`f${k}`} x={b.x} y={b.y} width={b.w} height={b.h} fill={FILL[b.cat]} />
      ))}

      {/* Штриховка плитки (санузлы) и лестниц */}
      <defs>
        <pattern id="tilePat" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill={FILL.bath} />
          <path d="M0 0H12M0 6H12M0 0V12M6 0V12" stroke="#9CC7E2" strokeWidth="0.6" />
        </pattern>
        <pattern id="stairPat" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill={FILL.stairs} />
          <path d="M0 3H14M0 7H14M0 11H14" stroke="#C68A2E" strokeWidth="0.8" />
        </pattern>
      </defs>
      {blocks.map((b, k) =>
        b.cat === "bath" ? (
          <rect key={`t${k}`} x={b.x} y={b.y} width={b.w} height={b.h} fill="url(#tilePat)" />
        ) : b.cat === "stairs" ? (
          <rect key={`t${k}`} x={b.x} y={b.y} width={b.w} height={b.h} fill="url(#stairPat)" />
        ) : null,
      )}

      {/* Межкомнатные перегородки */}
      {blocks.map((b, k) => (
        <rect
          key={`w${k}`}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill="none"
          stroke={WALL}
          strokeWidth={WALL_INNER}
        />
      ))}

      {/* Двери: дуга на одной из внутренних стен каждой жилой комнаты */}
      {blocks.map((b, k) => {
        if (b.cat === "outdoor" || b.cat === "stairs") return null;
        // выбираем сторону, которая НЕ внешняя
        const sides: Array<"n" | "s" | "e" | "w"> = (["s", "n", "e", "w"] as const).filter(
          (s) => !isOuter(b, s),
        );
        if (sides.length === 0) return null;
        const side = sides[k % sides.length];
        const door = 16;
        let cx0 = 0, cy0 = 0, sweep = 0;
        if (side === "s") {
          cx0 = b.x + b.w / 2 - door / 2;
          cy0 = b.y + b.h - 1;
          return (
            <g key={`d${k}`}>
              <rect x={cx0} y={cy0 - 1.5} width={door} height={3} fill={BG} />
              <path
                d={`M${cx0} ${cy0} a${door} ${door} 0 0 0 ${door} ${-door}`}
                fill="none"
                stroke={WALL}
                strokeWidth={0.8}
              />
            </g>
          );
        }
        if (side === "n") {
          cx0 = b.x + b.w / 2 - door / 2;
          cy0 = b.y + 1;
          return (
            <g key={`d${k}`}>
              <rect x={cx0} y={cy0 - 1.5} width={door} height={3} fill={BG} />
              <path
                d={`M${cx0} ${cy0} a${door} ${door} 0 0 1 ${door} ${door}`}
                fill="none"
                stroke={WALL}
                strokeWidth={0.8}
              />
            </g>
          );
        }
        if (side === "e") {
          cx0 = b.x + b.w - 1;
          cy0 = b.y + b.h / 2 - door / 2;
          return (
            <g key={`d${k}`}>
              <rect x={cx0 - 1.5} y={cy0} width={3} height={door} fill={BG} />
              <path
                d={`M${cx0} ${cy0} a${door} ${door} 0 0 0 ${-door} ${door}`}
                fill="none"
                stroke={WALL}
                strokeWidth={0.8}
              />
            </g>
          );
        }
        cx0 = b.x + 1;
        cy0 = b.y + b.h / 2 - door / 2;
        return (
          <g key={`d${k}`}>
            <rect x={cx0 - 1.5} y={cy0} width={3} height={door} fill={BG} />
            <path
              d={`M${cx0} ${cy0} a${door} ${door} 0 0 1 ${door} ${door}`}
              fill="none"
              stroke={WALL}
              strokeWidth={0.8}
            />
          </g>
        );
      })}

      {/* Внешняя несущая стена */}
      <rect
        x={bx}
        y={by}
        width={bw}
        height={bh}
        fill="none"
        stroke={WALL}
        strokeWidth={WALL_OUTER}
      />

      {/* Окна — разрывы в наружной стене для каждой комнаты, граничащей с улицей */}
      {blocks.flatMap((b, k) => {
        const out: JSX.Element[] = [];
        const winLen = (len: number) => Math.min(Math.max(len * 0.35, 22), 70);
        if (isOuter(b, "n") && b.cat !== "outdoor") {
          const L = winLen(b.w);
          const x0 = b.x + b.w / 2 - L / 2;
          out.push(
            <g key={`wn${k}`}>
              <rect x={x0} y={by - WALL_OUTER / 2} width={L} height={WALL_OUTER} fill={BG} />
              <line x1={x0} y1={by} x2={x0 + L} y2={by} stroke={WALL} strokeWidth={1} />
            </g>,
          );
        }
        if (isOuter(b, "s") && b.cat !== "outdoor") {
          const L = winLen(b.w);
          const x0 = b.x + b.w / 2 - L / 2;
          out.push(
            <g key={`ws${k}`}>
              <rect x={x0} y={by + bh - WALL_OUTER / 2} width={L} height={WALL_OUTER} fill={BG} />
              <line x1={x0} y1={by + bh} x2={x0 + L} y2={by + bh} stroke={WALL} strokeWidth={1} />
            </g>,
          );
        }
        if (isOuter(b, "w") && b.cat !== "outdoor") {
          const L = winLen(b.h);
          const y0 = b.y + b.h / 2 - L / 2;
          out.push(
            <g key={`ww${k}`}>
              <rect x={bx - WALL_OUTER / 2} y={y0} width={WALL_OUTER} height={L} fill={BG} />
              <line x1={bx} y1={y0} x2={bx} y2={y0 + L} stroke={WALL} strokeWidth={1} />
            </g>,
          );
        }
        if (isOuter(b, "e") && b.cat !== "outdoor") {
          const L = winLen(b.h);
          const y0 = b.y + b.h / 2 - L / 2;
          out.push(
            <g key={`we${k}`}>
              <rect x={bx + bw - WALL_OUTER / 2} y={y0} width={WALL_OUTER} height={L} fill={BG} />
              <line x1={bx + bw} y1={y0} x2={bx + bw} y2={y0 + L} stroke={WALL} strokeWidth={1} />
            </g>,
          );
        }
        return out;
      })}

      {/* Подписи комнат */}
      {blocks.map((b, k) => {
        const fs = Math.min(13, Math.max(9, Math.min(b.w, b.h) / 7));
        return (
          <g key={`l${k}`}>
            <text
              x={b.x + b.w / 2}
              y={b.y + b.h / 2 - 2}
              textAnchor="middle"
              fontFamily="ui-sans-serif, system-ui"
              fontSize={fs}
              fill="#1F2937"
            >
              {b.r.name}
            </text>
            <text
              x={b.x + b.w / 2}
              y={b.y + b.h / 2 + fs + 2}
              textAnchor="middle"
              fontFamily="ui-sans-serif, system-ui"
              fontSize={fs - 1}
              fill="#4B5563"
            >
              {b.r.area.toString().replace(".", ",")} м²
            </text>
          </g>
        );
      })}
    </svg>
  );
}