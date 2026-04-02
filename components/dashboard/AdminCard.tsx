interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

export default function AdminCard({ children, className = "", padding = "md" }: AdminCardProps) {
  return (
    <div
      className={[
        "bg-white rounded-2xl border border-neutral-200",
        paddingMap[padding],
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
