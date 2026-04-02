"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface AreaChartCardProps {
  title: string;
  data: Record<string, string | number>[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
}

export function AreaChartCard({
  title,
  data,
  index,
  categories,
  colors = ["blue"],
  valueFormatter = (v) => `${v.toLocaleString()} FCFA`,
}: AreaChartCardProps) {
  const category = categories[0];
  const values = data
    .map((item) => {
      const raw = item[category];
      return typeof raw === "number" ? raw : Number(raw ?? 0);
    })
    .filter((value) => Number.isFinite(value));
  const maxValue = values.length ? Math.max(...values) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 rounded-lg border border-border/60 p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{String(index)}</span>
            <span>{String(category)}</span>
          </div>
          <div className="flex h-[220px] items-end gap-2">
            {data.map((item, idx) => {
              const label = String(item[index] ?? `P${idx + 1}`);
              const raw = item[category];
              const value = typeof raw === "number" ? raw : Number(raw ?? 0);
              const percent = maxValue > 0 ? Math.max(6, Math.round((value / maxValue) * 100)) : 6;

              return (
                <div key={`${label}-${idx}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-sm bg-primary/80" style={{ height: `${percent}%` }} title={valueFormatter(value)} />
                  <span className="truncate text-[10px] text-muted-foreground">{label}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{colors.length ? `Palette: ${colors.join(", ")}` : ""}</p>
        </div>
      </CardContent>
    </Card>
  );
}
