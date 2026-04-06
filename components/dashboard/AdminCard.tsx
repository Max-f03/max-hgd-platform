interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  style?: React.CSSProperties;
}

const paddingMap = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

export default function AdminCard({ children, className = "", padding = "md", style }: AdminCardProps) {
  return (
    <div
      className={[paddingMap[padding], className].filter(Boolean).join(" ")}
      style={{
        background: "var(--d-card)",
        border: "1px solid var(--d-border)",
        borderRadius: "1rem",
        transition: "background 0.25s ease, border-color 0.25s ease, color 0.25s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
