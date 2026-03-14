"use client";

// マーケットサマリーカード（07_ui-wireframe.md 2.5節 MetricCard準拠）
// 数値は JetBrains Mono フォントで表示

interface MetricCardProps {
  label: string;
  value: number;
  change: number;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
}

export function MetricCard({
  label,
  value,
  change,
  prefix = "",
  suffix = "",
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-bg-card p-4">
        <p className="text-xs text-text-secondary mb-1">{label}</p>
        <div className="skeleton h-8 w-24 mb-1" />
        <div className="skeleton h-4 w-16" />
      </div>
    );
  }

  // 変化率に応じた色とアイコン
  const isPositive = change > 0;
  const isNeutral = change === 0;
  const changeColor = isNeutral
    ? "text-text-muted"
    : isPositive
      ? "text-inflow"
      : "text-outflow";
  const changeIcon = isNeutral ? "─" : isPositive ? "▲" : "▼";

  // 数値フォーマット
  const formattedValue = formatNumber(value, prefix, suffix);
  const formattedChange = `${changeIcon} ${Math.abs(change).toFixed(2)}${suffix === "%" ? " bp" : "%"}`;

  return (
    <div className="rounded-lg border border-border bg-bg-card p-4 hover:border-neutral/30 transition-colors">
      <p className="text-xs text-text-secondary mb-1 truncate">{label}</p>
      <p className="font-mono-number text-xl text-text-primary leading-tight">
        {formattedValue}
      </p>
      <p className={`font-mono-number text-xs mt-1 ${changeColor}`}>
        {formattedChange}
      </p>
    </div>
  );
}

function formatNumber(value: number, prefix: string, suffix: string): string {
  if (suffix === "%") {
    return `${value.toFixed(2)}%`;
  }
  if (prefix === "$") {
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  if (value >= 10000) {
    return `${prefix}${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}${suffix}`;
  }
  return `${prefix}${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}${suffix}`;
}
