interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  sub?: string;
  variant?: "blue" | "green" | "yellow" | "pink" | "purple";
}

const palette: Record<string, { iconBg: string; iconColor: string; accent: string; trendBg: string; trendColor: string }> = {
  blue:   { iconBg: "#DBEAFE", iconColor: "#2563EB", accent: "#3B82F6", trendBg: "#EFF6FF", trendColor: "#1D4ED8" },
  green:  { iconBg: "#DBEAFE", iconColor: "#2563EB", accent: "#2563EB", trendBg: "#EFF6FF", trendColor: "#1D4ED8" },
  yellow: { iconBg: "#FEF3C7", iconColor: "#D97706", accent: "#F59E0B", trendBg: "#FFFBEB", trendColor: "#B45309" },
  pink:   { iconBg: "#FCE7F3", iconColor: "#DB2777", accent: "#EC4899", trendBg: "#FDF2F8", trendColor: "#BE185D" },
  purple: { iconBg: "#DBEAFE", iconColor: "#1D4ED8", accent: "#3B82F6", trendBg: "#F5F3FF", trendColor: "#1E40AF" },
};

const sparkPts = [4, 6, 5, 8, 6, 10, 9, 11, 10, 13];

function MiniSparkline({ color }: { color: string }) {
  const w = 72;
  const h = 36;
  const min = Math.min(...sparkPts);
  const max = Math.max(...sparkPts);
  const range = max - min || 1;
  const toX = (i: number) => (i / (sparkPts.length - 1)) * w;
  const toY = (v: number) => h - 5 - ((v - min) / range) * (h - 12);

  const pts: [number, number][] = sparkPts.map((v, i) => [toX(i), toY(v)]);
  let line = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  let area = line;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cpx = (x0 + x1) / 2;
    const seg = ` C ${cpx.toFixed(1)},${y0.toFixed(1)} ${cpx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    line += seg;
    area += seg;
  }
  const last = pts[pts.length - 1];
  area += ` L ${last[0].toFixed(1)},${h} L ${pts[0][0].toFixed(1)},${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${color.replace("#", "")})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StatsCard({ title, value, icon, trend, sub, variant = "blue" }: StatsCardProps) {
  const p = palette[variant];

  return (
    <div className="bg-white rounded-2xl flex flex-col gap-4" style={{ padding: "18px 20px" }}>

      {/* Row 1 : icône + titre + badge tendance */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: p.iconBg, color: p.iconColor }}
          >
            {icon}
          </div>
          <p
            className="text-[11px] font-semibold uppercase tracking-widest truncate"
            style={{ color: "#94A3B8" }}
          >
            {title}
          </p>
        </div>

        {trend && (
          <span
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
            style={{
              background: trend.positive ? p.trendBg : "#FEE2E2",
              color:      trend.positive ? p.trendColor : "#DC2626",
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {trend.positive
                ? <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>
                : <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>
              }
            </svg>
            {trend.value}
          </span>
        )}
      </div>

      {/* Row 2 : valeur + sparkline */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className="font-black leading-none tracking-tight"
            style={{ fontSize: "32px", color: "#0F172A" }}
          >
            {value}
          </p>
          {sub && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: "#94A3B8" }}>{sub}</p>
          )}
        </div>
        <MiniSparkline color={p.accent} />
      </div>

    </div>
  );
}
