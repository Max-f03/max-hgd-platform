import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired"
  | "pending"
  | "paid"
  | "partial"
  | "overdue"
  | "cancelled"
  | "active"
  | "paused"
  | "completed"
  | "archived"
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "planning"
  | "on_hold";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-secondary text-secondary-foreground" },
  sent: { label: "Envoye", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  viewed: { label: "Consulte", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  accepted: { label: "Accepte", className: "bg-success/10 text-success" },
  rejected: { label: "Refuse", className: "bg-destructive/10 text-destructive" },
  expired: { label: "Expire", className: "bg-secondary text-muted-foreground" },

  pending: { label: "En attente", className: "bg-warning/10 text-warning" },
  paid: { label: "Payee", className: "bg-success/10 text-success" },
  partial: { label: "Partiel", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  overdue: { label: "En retard", className: "bg-destructive/10 text-destructive" },
  cancelled: { label: "Annulee", className: "bg-secondary text-muted-foreground" },

  active: { label: "Actif", className: "bg-success/10 text-success" },
  paused: { label: "En pause", className: "bg-warning/10 text-warning" },
  completed: { label: "Termine", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  archived: { label: "Archive", className: "bg-secondary text-muted-foreground" },

  todo: { label: "A faire", className: "bg-secondary text-secondary-foreground" },
  in_progress: { label: "En cours", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  review: { label: "En revue", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  done: { label: "Termine", className: "bg-success/10 text-success" },

  planning: { label: "Planification", className: "bg-secondary text-secondary-foreground" },
  on_hold: { label: "En attente", className: "bg-warning/10 text-warning" },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: "bg-secondary" };

  return (
    <Badge variant="secondary" className={cn("border-0 font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}
