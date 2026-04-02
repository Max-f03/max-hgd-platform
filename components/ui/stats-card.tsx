"use client";

import { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("border-border", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {Icon && (
              <div className="rounded-lg bg-accent p-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            {trend && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
