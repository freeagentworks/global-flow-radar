"use client";

import Link from "next/link";
import { useGlobalFlows } from "@/lib/hooks/use-market-data";
import { useTranslations } from "next-intl";

// ミニ世界地図（ダッシュボード用）（タスク 1-4）
// SVGベースの簡易版。クリックでフルマップへ遷移

// 地域のSVG上の位置（簡易マッピング）
const REGION_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  US: { x: 120, y: 120, label: "US" },
  JP: { x: 420, y: 130, label: "JP" },
  EU: { x: 270, y: 100, label: "EU" },
  CN: { x: 380, y: 140, label: "CN" },
  EM: { x: 330, y: 190, label: "EM" },
  IN: { x: 350, y: 170, label: "IN" },
  BR: { x: 170, y: 210, label: "BR" },
  KR: { x: 410, y: 125, label: "KR" },
  AU: { x: 430, y: 230, label: "AU" },
};

// 地域カラー
const REGION_COLORS: Record<string, string> = {
  US: "#448AFF",
  JP: "#FF1744",
  EU: "#00C853",
  CN: "#FFC107",
  EM: "#E91E63",
  IN: "#FF9800",
  BR: "#8BC34A",
  KR: "#7C4DFF",
  AU: "#00BCD4",
};

export function MiniFlowMap() {
  const t = useTranslations("dashboard");
  const { data, isLoading } = useGlobalFlows("1m");

  if (isLoading) {
    return (
      <section className="rounded-lg border border-border bg-bg-card p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          {t("miniMap")}
        </h2>
        <div className="skeleton h-48 w-full" />
      </section>
    );
  }

  const flows = data?.flows ?? [];
  const regions = data?.regions ?? [];

  return (
    <section className="rounded-lg border border-border bg-bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("miniMap")}
        </h2>
        <Link
          href="/map"
          className="text-xs text-neutral hover:text-neutral/80 transition-colors"
        >
          {t("viewFullMap")} →
        </Link>
      </div>

      <svg
        viewBox="0 0 500 280"
        className="w-full h-auto"
        aria-label="ミニ世界地図 - 資金フロー概要"
      >
        {/* 背景 */}
        <rect width="500" height="280" fill="var(--color-bg-secondary)" rx="4" />

        {/* フロー矢印 */}
        {flows.slice(0, 6).map((flow: { source: string; target: string; flow_score: number; amount_usd_mm: number }, i: number) => {
          const source = REGION_POSITIONS[flow.source];
          const target = REGION_POSITIONS[flow.target];
          if (!source || !target) return null;

          const strokeWidth = Math.max(1, Math.min(4, Math.abs(flow.flow_score) / 20));
          const color = flow.flow_score > 0 ? "#00C853" : "#FF1744";

          return (
            <g key={`flow-${i}`}>
              <defs>
                <marker
                  id={`arrow-${i}`}
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill={color} opacity={0.8} />
                </marker>
              </defs>
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={color}
                strokeWidth={strokeWidth}
                opacity={0.6}
                markerEnd={`url(#arrow-${i})`}
                strokeDasharray="4 2"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="12"
                  to="0"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </line>
            </g>
          );
        })}

        {/* 地域ノード */}
        {Object.entries(REGION_POSITIONS).map(([id, pos]) => {
          const region = regions.find((r: { id: string }) => r.id === id);
          const score = region?.net_flow_score ?? 0;
          const radius = Math.max(8, Math.min(16, 8 + Math.abs(score) / 10));
          const color = REGION_COLORS[id] ?? "#9E9E9E";

          return (
            <g key={id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={color}
                opacity={0.8}
                className="hover:opacity-100 transition-opacity cursor-pointer"
              />
              <text
                x={pos.x}
                y={pos.y + radius + 12}
                textAnchor="middle"
                fill="var(--color-text-secondary)"
                fontSize="10"
                fontWeight="600"
              >
                {pos.label}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
