"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { useChartColors } from "@/lib/hooks/use-chart-colors";

// 時系列折れ線チャート（汎用コンポーネント）
// Rechartsベースでテーマ対応

interface LineConfig {
  key: string;
  color: string;
  label: string;
}

interface TimeSeriesChartProps {
  data: Array<{ date: string; [key: string]: number | string }>;
  lines: LineConfig[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
}

// カスタムツールチップ
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-md bg-bg-card border border-border px-3 py-2 shadow-lg">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-secondary">{entry.name}:</span>
          <span className="font-mono-number text-text-primary font-medium">
            {typeof entry.value === "number"
              ? entry.value.toFixed(2)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TimeSeriesChart({
  data,
  lines,
  height = 300,
  showGrid = true,
  showLegend = true,
}: TimeSeriesChartProps) {
  const c = useChartColors();

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-border bg-bg-card text-text-muted text-sm"
        style={{ height }}
      >
        データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={c.grid}
            vertical={false}
          />
        )}

        <XAxis
          dataKey="date"
          tick={{ fill: c.tick, fontSize: 11 }}
          tickLine={{ stroke: c.axis }}
          axisLine={{ stroke: c.axis }}
          tickMargin={8}
        />

        <YAxis
          tick={{ fill: c.tick, fontSize: 11 }}
          tickLine={{ stroke: c.axis }}
          axisLine={{ stroke: c.axis }}
          tickMargin={4}
          width={50}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: c.cursor, strokeDasharray: "4 4" }}
        />

        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12, color: c.legendColor, paddingTop: 8 }}
          />
        )}

        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: line.color, stroke: c.bg, strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
