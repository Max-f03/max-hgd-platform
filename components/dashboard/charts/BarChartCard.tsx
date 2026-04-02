"use client";

import { BarChart } from "@tremor/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface BarChartCardProps {
  title: string;
  data: Record<string, string | number>[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  layout?: "vertical" | "horizontal";
}

export function BarChartCard({
  title,
  data,
  index,
  categories,
  colors = ["blue"],
  valueFormatter = (v) => `${v}`,
  layout = "vertical",
}: BarChartCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          className="h-72"
          data={data}
          index={index}
          categories={categories}
          colors={colors}
          valueFormatter={valueFormatter}
          showLegend={false}
          layout={layout}
        />
      </CardContent>
    </Card>
  );
}
