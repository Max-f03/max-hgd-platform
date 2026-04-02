const data = [
  120, 145, 132, 160, 178, 155, 190, 210, 198, 225,
  240, 218, 260, 275, 255, 290, 310, 298, 330, 315,
  345, 360, 340, 380, 395, 410, 388, 430, 460, 445,
];

const svgWidth = 600;
const svgHeight = 132;
const paddingLeft = 40;
const paddingRight = 16;
const paddingTop = 16;
const paddingBottom = 24;

const chartWidth = svgWidth - paddingLeft - paddingRight;
const chartHeight = svgHeight - paddingTop - paddingBottom;

const dataMin = 0;
const dataMax = 500;

function toX(index: number): number {
  return paddingLeft + (index / (data.length - 1)) * chartWidth;
}

function toY(value: number): number {
  return paddingTop + chartHeight - ((value - dataMin) / (dataMax - dataMin)) * chartHeight;
}

type Point = [number, number];
const pts: Point[] = data.map((v, i) => [toX(i), toY(v)]);

function smoothLinePath(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const tension = 0.35;
    const cpx1 = prev[0] + (curr[0] - prev[0]) * tension;
    const cpy1 = prev[1];
    const cpx2 = curr[0] - (curr[0] - prev[0]) * tension;
    const cpy2 = curr[1];
    d += ` C ${cpx1},${cpy1} ${cpx2},${cpy2} ${curr[0]},${curr[1]}`;
  }
  return d;
}

function smoothAreaPath(points: Point[]): string {
  const line = smoothLinePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last[0]},${paddingTop + chartHeight} L ${first[0]},${paddingTop + chartHeight} Z`;
}

const yLabels = [0, 100, 200, 300, 400, 500];
const xLabels = [
  { label: "1 Mar", index: 0 },
  { label: "8 Mar", index: 7 },
  { label: "15 Mar", index: 14 },
  { label: "22 Mar", index: 21 },
  { label: "29 Mar", index: 28 },
];

const lastPt = pts[pts.length - 1];

export default function ChartLine() {
  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" aria-label="Vues sur 30 jours">
      <defs>
        <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {yLabels.map((v) => {
        const y = toY(v);
        return (
          <g key={v}>
            <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke="#DBEAFE" strokeWidth="1" />
            <text x={paddingLeft - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#94A3B8">
              {v}
            </text>
          </g>
        );
      })}

      {xLabels.map(({ label, index }) => (
        <text key={label} x={toX(index)} y={svgHeight - 4} textAnchor="middle" fontSize="9" fill="#94A3B8">
          {label}
        </text>
      ))}

      <path d={smoothAreaPath(pts)} fill="url(#lineAreaGradient)" />
      <path d={smoothLinePath(pts)} fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Last point highlight */}
      <circle cx={lastPt[0]} cy={lastPt[1]} r="4.5" fill="white" stroke="#2563EB" strokeWidth="2.4" />
    </svg>
  );
}
