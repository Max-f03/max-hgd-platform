interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  glow?: "blue" | "purple" | "pink" | "green" | "orange";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const glowMap = {
  blue: "glow-blue",
  purple: "glow-purple",
  pink: "glow-pink",
  green: "glow-green",
  orange: "glow-orange",
};

export default function GlassCard({
  children,
  className = "",
  padding = "md",
  glow,
}: GlassCardProps) {
  return (
    <div
      className={["glass-card", paddingMap[padding], glow ? glowMap[glow] : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
