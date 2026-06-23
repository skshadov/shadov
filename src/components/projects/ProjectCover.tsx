import type { HouseProject } from "@/data/projects";
import type { MaterialKey } from "@/data/projects-pricing";

/**
 * Стилизованный SVG-рендер фасада дома. Используется как обложка проекта
 * до загрузки фотореалистичных рендеров. Геометрия зависит от архетипа
 * (одноэтажный / с мансардой / двухэтажный), палитра — от материала.
 */

const PALETTE: Record<MaterialKey, { wall: string; trim: string; roof: string; sky: [string, string]; ground: string }> = {
  frame:  { wall: "#E8DFD3", trim: "#3A2E26", roof: "#2C3138", sky: ["#DCE7EE", "#F1F4F2"], ground: "#A6B3A0" },
  sip:    { wall: "#F2F2EE", trim: "#222831", roof: "#1F2933", sky: ["#E2ECE9", "#F4F0E6"], ground: "#B8B8A8" },
  gas:    { wall: "#D9CFC2", trim: "#5B5249", roof: "#3C3A36", sky: ["#D7DDE2", "#EFE7DA"], ground: "#9CA68A" },
  brick:  { wall: "#9C5747", trim: "#2B1E18", roof: "#231B17", sky: ["#D2DCE0", "#EADFCB"], ground: "#8C9678" },
};

interface Props {
  project: HouseProject;
  className?: string;
  ariaLabel?: string;
}

export function ProjectCover({ project, className, ariaLabel }: Props) {
  const p = PALETTE[project.primaryMaterial];
  const id = project.slug;
  const floors = project.floors;
  // одноэтажный: только корпус + двускатка низкая
  // 1.5 (мансарда): крутая двускатка
  // 2: высокий корпус + вальмовая

  // вариативная ширина крыши и высота — псевдослучайно от slug
  const hash = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const windowSeed = hash % 4;

  return (
    <svg
      viewBox="0 0 400 300"
      role="img"
      aria-label={ariaLabel ?? `${project.title}, фасад, ${project.slug}`}
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky[0]} />
          <stop offset="100%" stopColor={p.sky[1]} />
        </linearGradient>
        {project.primaryMaterial === "brick" && (
          <pattern id={`brick-${id}`} width="20" height="10" patternUnits="userSpaceOnUse">
            <rect width="20" height="10" fill={p.wall} />
            <path d="M0 0 H20 M0 10 H20 M10 0 V10" stroke="#7a4536" strokeWidth="0.6" opacity="0.45" />
          </pattern>
        )}
      </defs>
      {/* небо */}
      <rect width="400" height="220" fill={`url(#sky-${id})`} />
      {/* земля */}
      <rect y="220" width="400" height="80" fill={p.ground} />
      <rect y="218" width="400" height="3" fill={p.trim} opacity="0.18" />

      {/* корпус */}
      {renderHouse(project, p, id, windowSeed, floors)}

      {/* подпись slug */}
      <text x="14" y="288" fontFamily="ui-sans-serif, system-ui" fontSize="12"
            fill={p.trim} opacity="0.55" letterSpacing="2">
        {project.slug}
      </text>
    </svg>
  );
}

function renderHouse(
  project: HouseProject,
  p: typeof PALETTE[MaterialKey],
  id: string,
  windowSeed: number,
  floors: 1 | 1.5 | 2,
) {
  const wallFill = project.primaryMaterial === "brick" ? `url(#brick-${id})` : p.wall;

  if (floors === 1) {
    return (
      <g>
        {/* двускатная крыша */}
        <polygon points="60,150 200,90 340,150" fill={p.roof} />
        <polygon points="60,150 200,90 340,150" fill="none" stroke={p.trim} strokeWidth="1.5" />
        {/* стены */}
        <rect x="70" y="150" width="260" height="80" fill={wallFill} stroke={p.trim} strokeWidth="1.4" />
        {/* окна */}
        <rect x="95" y="170" width="42" height="40" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.2" />
        <rect x="160" y="170" width="80" height="40" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.2" />
        <rect x="265" y="170" width="42" height="40" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.2" />
        {/* дверь */}
        <rect x="180" y="172" width="0" height="0" />
        {/* терраса */}
        {project.features.includes("terrace") && (
          <g>
            <rect x="240" y="200" width="100" height="30" fill={p.wall} opacity="0.5" stroke={p.trim} />
            <line x1="250" y1="200" x2="250" y2="160" stroke={p.trim} strokeWidth="1.2" />
            <line x1="280" y1="200" x2="280" y2="160" stroke={p.trim} strokeWidth="1.2" />
            <line x1="310" y1="200" x2="310" y2="160" stroke={p.trim} strokeWidth="1.2" />
          </g>
        )}
      </g>
    );
  }
  if (floors === 1.5) {
    return (
      <g>
        {/* крутая двускатка */}
        <polygon points="65,170 200,55 335,170" fill={p.roof} />
        <polygon points="65,170 200,55 335,170" fill="none" stroke={p.trim} strokeWidth="1.5" />
        {/* стены */}
        <rect x="75" y="170" width="250" height="65" fill={wallFill} stroke={p.trim} strokeWidth="1.4" />
        {/* мансардные окна */}
        <rect x="155" y="100" width="40" height="32" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.2" />
        <rect x="205" y="100" width="40" height="32" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.2" />
        {/* окна 1 этажа */}
        <rect x="95" y="185" width="40" height="38" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.2" />
        <rect x="160" y="185" width="80" height="38" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.2" />
        <rect x="265" y="185" width="40" height="38" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.2" />
      </g>
    );
  }
  // 2 этажа
  return (
    <g>
      {/* вальмовая крыша */}
      <polygon points="55,120 145,75 255,75 345,120 345,135 55,135" fill={p.roof} />
      <polygon points="55,120 145,75 255,75 345,120" fill="none" stroke={p.trim} strokeWidth="1.5" />
      <line x1="55" y1="135" x2="345" y2="135" stroke={p.trim} strokeWidth="1.2" />
      {/* стены 2 эт */}
      <rect x="65" y="135" width="270" height="50" fill={wallFill} stroke={p.trim} strokeWidth="1.4" />
      {/* стены 1 эт */}
      <rect x="65" y="185" width="270" height="55" fill={wallFill} stroke={p.trim} strokeWidth="1.4" />
      <line x1="65" y1="185" x2="335" y2="185" stroke={p.trim} strokeWidth="1.2" opacity="0.7" />
      {/* окна 2 эт */}
      <rect x="85" y="148" width="38" height="28" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.1" />
      <rect x="140" y="148" width="38" height="28" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.1" />
      <rect x="195" y="148" width="38" height="28" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.1" />
      <rect x="255" y="148" width="38" height="28" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.1" />
      {/* окна 1 эт + панорамное */}
      <rect x="85" y="200" width="38" height="32" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.1" />
      <rect x="140" y="195" width="120" height="40" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.2" />
      <rect x="278" y="200" width="38" height="32" fill="#F0F4F6" stroke={p.trim} strokeWidth="1.1" />
      {/* гараж */}
      {project.features.includes("garage") && (
        <g>
          <rect x="280" y="190" width="55" height="50" fill={p.trim} opacity="0.85" />
          <line x1="280" y1="205" x2="335" y2="205" stroke={p.wall} strokeWidth="1" opacity="0.6" />
          <line x1="280" y1="220" x2="335" y2="220" stroke={p.wall} strokeWidth="1" opacity="0.6" />
        </g>
      )}
    </g>
  );
}