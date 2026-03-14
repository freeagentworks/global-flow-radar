"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useEtfFlowHistory } from "@/lib/hooks/use-etf-data";
import { useChartColors } from "@/lib/hooks/use-chart-colors";

// ETFファンドフロー + 価格オーバーレイチャート

interface EtfFlowChartProps {
  symbol: string;
  period: string;
  height?: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
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
          <span className="text-text-secondary">
            {entry.dataKey === "flow_usd_mm" ? "資金フロー" : "価格"}:
          </span>
          <span className="font-mono-number text-text-primary font-medium">
            {entry.dataKey === "flow_usd_mm"
              ? `${entry.value.toLocaleString()} M USD`
              : `$${entry.value.toFixed(2)}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function EtfFlowChart({ symbol, period, height = 350 }: EtfFlowChartProps) {
  const { data, isLoading, isError } = useEtfFlowHistory(symbol, period);
  const c = useChartColors();

  if (isLoading) {
    return <div className="skeleton w-full" style={{ height }} />;
  }

  if (isError) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-border bg-bg-card text-text-muted text-sm"
        style={{ height }}
      >
        データの取得に失敗しました
      </div>
    );
  }

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
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={c.grid}
          vertical={false}
        />

        <XAxis
          dataKey="date"
          tick={{ fill: c.tick, fontSize: 11 }}
          tickLine={{ stroke: c.axis }}
          axisLine={{ stroke: c.axis }}
          tickMargin={8}
        />

        <YAxis
          yAxisId="flow"
          orientation="left"
          tick={{ fill: c.tick, fontSize: 11 }}
          tickLine={{ stroke: c.axis }}
          axisLine={{ stroke: c.axis }}
          tickMargin={4}
          width={60}
          label={{
            value: "Flow (M USD)",
            angle: -90,
            position: "insideLeft",
            style: { fill: c.tick, fontSize: 10 },
          }}
        />

        <YAxis
          yAxisId="price"
          orientation="right"
          tick={{ fill: c.tick, fontSize: 11 }}
          tickLine={{ stroke: c.axis }}
          axisLine={{ stroke: c.axis }}
          tickMargin={4}
          width={60}
          label={{
            value: "Price (USD)",
            angle: 90,
            position: "insideRight",
            style: { fill: c.tick, fontSize: 10 },
          }}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: c.cursor, strokeDasharray: "4 4" }}
        />

        <Legend
          wrapperStyle={{ fontSize: 12, color: c.legendColor, paddingTop: 8 }}
        />

        <Bar
          yAxisId="flow"
          dataKey="flow_usd_mm"
          name="資金フロー"
          fill="#58A6FF"
          opacity={0.7}
          radius={[2, 2, 0, 0]}
        />

        <Line
          yAxisId="price"
          type="monotone"
          dataKey="price"
          name="価格"
          stroke="#F0883E"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#F0883E", stroke: c.bg, strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
