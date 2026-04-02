const bars = [
  { label: "Mobile App",  value: 820 },
  { label: "Corporate",   value: 720 },
  { label: "E-commerce",  value: 640 },
  { label: "Design Sys.", value: 510 },
  { label: "Dashboard",   value: 390 },
  { label: "Branding",    value: 280 },
];

const svgWidth = 520;
const barH = 14;
const barGap = 14;
const paddingLeft = 78;
const paddingRight = 44;
const paddingTop = 4;
const paddingBottom = 4;
const maxValue = Math.max(...bars.map((b) => b.value));
const chartWidth = svgWidth - paddingLeft - paddingRight;
const svgHeight = paddingTop + paddingBottom + bars.length * (barH + barGap) - barGap;

export default function ChartBar() {
  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" aria-label="Projets les plus vus">
      <style>{`
        .hbar { fill: #DBEAFE; transition: fill 0.15s; }
        .hbar:hover { fill: #BFDBFE; }
        .hbar-fill { fill: #3B82F6; transition: fill 0.15s; pointer-events: none; }
      `}</style>

      {bars.map((bar, i) => {
        const y = paddingTop + i * (barH + barGap);
        const barW = (bar.value / maxValue) * chartWidth;
        const cy = y + barH / 2;

        return (
          <g key={bar.label}>
            {/* Label */}
            <text x={paddingLeft - 8} y={cy} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#64748B">
              {bar.label}
            </text>

            {/* Track */}
            <rect className="hbar" x={paddingLeft} y={y} width={chartWidth} height={barH} rx="3" />

            {/* Fill */}
            <rect className="hbar-fill" x={paddingLeft} y={y} width={barW} height={barH} rx="3" />

            {/* Value */}
            <text x={paddingLeft + barW + 6} y={cy} dominantBaseline="middle" fontSize="10" fill="#374151" fontWeight="600">
              {bar.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
