"use client";

import { DonutChart } from "@tremor/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface DonutChartCardProps {
  title: string;
  data: Record<string, string | number>[];
  index: string;
  category: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
}

export function DonutChartCard({
  title,
  data,
  index,
  category,
  colors = ["blue", "cyan", "indigo", "violet", "fuchsia"],
  valueFormatter = (v) => `${v}`,
}: DonutChartCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <DonutChart
          className="h-60"
          data={data}
          index={index}
          category={category}
          colors={colors}
          valueFormatter={valueFormatter}
          showLabel
        />
      </CardContent>
    </Card>
  );
}
