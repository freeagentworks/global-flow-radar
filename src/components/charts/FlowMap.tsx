"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { useGlobalFlows } from "@/lib/hooks/use-market-data";
import type { Period } from "@/types";

// グローバルフローマップ（タスク 1-5〜1-8）
// D3.js + SVGベースで世界地図上に資金フロー矢印を描画
// 表示モード: arrows / bubbles / heatmap

type DisplayMode = "arrows" | "bubbles" | "heatmap";

interface FlowMapProps {
  period: Period;
  displayMode: DisplayMode;
}

// 地域の座標（自然地球投影用の緯度経度）
const REGION_GEO: Record<string, { lat: number; lng: number; name_ja: string }> = {
  US: { lat: 39.83, lng: -98.58, name_ja: "米国" },
  JP: { lat: 36.20, lng: 138.25, name_ja: "日本" },
  EU: { lat: 50.11, lng: 9.84, name_ja: "欧州" },
  CN: { lat: 35.86, lng: 104.20, name_ja: "中国" },
  EM: { lat: 0.00, lng: 30.00, name_ja: "新興国" },
  IN: { lat: 20.59, lng: 78.96, name_ja: "インド" },
  BR: { lat: -14.24, lng: -51.93, name_ja: "ブラジル" },
  KR: { lat: 35.91, lng: 127.77, name_ja: "韓国" },
  TW: { lat: 23.70, lng: 120.96, name_ja: "台湾" },
  AU: { lat: -25.27, lng: 133.78, name_ja: "豪州" },
  UK: { lat: 55.38, lng: -3.44, name_ja: "英国" },
};

// 地域カラー
const REGION_COLORS: Record<string, string> = {
  US: "#448AFF", JP: "#FF1744", EU: "#00C853", CN: "#FFC107",
  EM: "#E91E63", IN: "#FF9800", BR: "#8BC34A", KR: "#7C4DFF",
  TW: "#00BCD4", AU: "#009688", UK: "#3F51B5",
};

export function FlowMap({ period, displayMode }: FlowMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);

  const { data, isLoading } = useGlobalFlows(period);

  // D3.js 描画
  const drawMap = useCallback(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    const width = containerRef.current?.clientWidth ?? 900;
    const height = 1000;
    const padX = 60;
    const padY = 50;

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    // 自然地球投影 — 全地域が収まるようにフィッティング
    // 対象地域の緯度経度範囲 + マージンからbboxを計算
    const regionCoords = Object.values(REGION_GEO).map((g) => [g.lng, g.lat] as [number, number]);
    const lngs = regionCoords.map((c) => c[0]);
    const lats = regionCoords.map((c) => c[1]);
    // bbox にマージンを追加して地図の端のノードが切れないようにする
    const latMargin = 10;
    const lngMargin = 15;
    const bbox: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[
          [Math.min(...lngs) - lngMargin, Math.min(...lats) - latMargin],
          [Math.max(...lngs) + lngMargin, Math.min(...lats) - latMargin],
          [Math.max(...lngs) + lngMargin, Math.max(...lats) + latMargin],
          [Math.min(...lngs) - lngMargin, Math.max(...lats) + latMargin],
          [Math.min(...lngs) - lngMargin, Math.min(...lats) - latMargin],
        ]],
      },
    };

    const projection = d3
      .geoNaturalEarth1()
      .fitExtent(
        [[padX, padY], [width - padX, height - padY]],
        bbox,
      );

    // 背景
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "var(--color-bg-primary)")
      .attr("rx", 8);

    // 世界の輪郭（グラティキュール）
    const graticule = d3.geoGraticule10();
    svg
      .append("path")
      .datum(graticule)
      .attr("d", d3.geoPath(projection))
      .attr("fill", "none")
      .attr("stroke", "var(--color-border)")
      .attr("stroke-width", 0.5);

    const regions = data.regions ?? [];
    const flows = data.flows ?? [];

    if (displayMode === "arrows") {
      drawArrows(svg, flows, regions, projection, width);
    } else if (displayMode === "bubbles") {
      drawBubbles(svg, regions, projection);
    } else {
      drawHeatmapMode(svg, regions, projection);
    }

    // 地域ノード（全モード共通）
    drawRegionNodes(svg, regions, projection, setSelectedRegion, setTooltip);
  }, [data, displayMode]);

  useEffect(() => {
    drawMap();
    const handleResize = () => drawMap();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawMap]);

  if (isLoading) {
    return <div className="skeleton h-[1000px] w-full rounded-lg" />;
  }

  // 選択された地域の詳細パネル
  const selectedData = selectedRegion
    ? data?.regions?.find((r: { id: string }) => r.id === selectedRegion)
    : null;
  const relatedFlows = selectedRegion
    ? data?.flows?.filter(
        (f: { source: string; target: string }) =>
          f.source === selectedRegion || f.target === selectedRegion
      ) ?? []
    : [];

  return (
    <div ref={containerRef} className="relative">
      <svg
        ref={svgRef}
        className="w-full rounded-lg"
        aria-label="グローバル資金フローマップ"
      />

      {/* ツールチップ */}
      {tooltip && (
        <div
          className="absolute pointer-events-none rounded-md bg-bg-card border border-border px-3 py-2 text-xs text-text-primary shadow-lg z-10"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      )}

      {/* 地域詳細パネル */}
      {selectedData && (
        <div className="mt-4 rounded-lg border border-border bg-bg-card p-4 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-text-primary">
              {selectedData.name_ja} ({selectedData.id})
            </h3>
            <button
              onClick={() => setSelectedRegion(null)}
              className="text-text-muted hover:text-text-primary text-sm"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-text-secondary">純フロースコア</p>
              <p
                className={`font-mono-number font-semibold ${
                  selectedData.net_flow_score > 0
                    ? "text-inflow"
                    : selectedData.net_flow_score < 0
                      ? "text-outflow"
                      : "text-text-muted"
                }`}
              >
                {selectedData.net_flow_score > 0 ? "+" : ""}
                {selectedData.net_flow_score.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">純フロー額</p>
              <p className="font-mono-number font-semibold text-text-primary">
                ${Math.abs(selectedData.net_flow_usd_mm).toLocaleString()}M
              </p>
            </div>
            <div>
              <p className="text-text-secondary">市場ウェイト</p>
              <p className="font-mono-number text-text-primary">
                {(selectedData.market_weight * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          {relatedFlows.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-text-secondary mb-2">関連フロー</p>
              <div className="space-y-1">
                {relatedFlows.slice(0, 4).map((f: { source: string; target: string; amount_usd_mm: number; flow_score: number }, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">
                      {f.source} → {f.target}
                    </span>
                    <span
                      className={`font-mono-number ${
                        f.flow_score > 0 ? "text-inflow" : "text-outflow"
                      }`}
                    >
                      ${Math.abs(f.amount_usd_mm).toLocaleString()}M
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- D3.js 描画関数 ---

function drawArrows(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  flows: Array<{ source: string; target: string; flow_score: number; amount_usd_mm: number; confidence: number }>,
  regions: Array<{ id: string }>,
  projection: d3.GeoProjection,
  width: number,
) {
  // 矢印マーカー定義
  const defs = svg.append("defs");

  flows.forEach((flow, i) => {
    const color = flow.flow_score > 0 ? "#00C853" : "#FF1744";
    defs
      .append("marker")
      .attr("id", `arrowhead-${i}`)
      .attr("markerWidth", 10)
      .attr("markerHeight", 7)
      .attr("refX", 10)
      .attr("refY", 3.5)
      .attr("orient", "auto")
      .append("polygon")
      .attr("points", "0 0, 10 3.5, 0 7")
      .attr("fill", color)
      .attr("opacity", 0.8);
  });

  // 矢印描画
  const arrowGroup = svg.append("g").attr("class", "arrows");

  flows.forEach((flow, i) => {
    const sourceGeo = REGION_GEO[flow.source];
    const targetGeo = REGION_GEO[flow.target];
    if (!sourceGeo || !targetGeo) return;

    const sourcePos = projection([sourceGeo.lng, sourceGeo.lat]);
    const targetPos = projection([targetGeo.lng, targetGeo.lat]);
    if (!sourcePos || !targetPos) return;

    const strokeWidth = Math.max(2, Math.min(8, Math.abs(flow.flow_score) / 10));
    const color = flow.flow_score > 0 ? "#00C853" : "#FF1744";
    const opacity = Math.max(0.3, Math.min(1.0, flow.confidence));

    // カーブのある線
    const midX = (sourcePos[0] + targetPos[0]) / 2;
    const midY = (sourcePos[1] + targetPos[1]) / 2 - 30;
    const path = `M ${sourcePos[0]} ${sourcePos[1]} Q ${midX} ${midY} ${targetPos[0]} ${targetPos[1]}`;

    arrowGroup
      .append("path")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", strokeWidth)
      .attr("opacity", opacity)
      .attr("marker-end", `url(#arrowhead-${i})`)
      .attr("stroke-dasharray", "6 3")
      .append("animate")
      .attr("attributeName", "stroke-dashoffset")
      .attr("from", "18")
      .attr("to", "0")
      .attr("dur", "1.5s")
      .attr("repeatCount", "indefinite");
  });
}

function drawBubbles(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  regions: Array<{ id: string; net_flow_score: number; net_flow_usd_mm: number }>,
  projection: d3.GeoProjection,
) {
  const bubbleGroup = svg.append("g").attr("class", "bubbles");

  regions.forEach((region) => {
    const geo = REGION_GEO[region.id];
    if (!geo) return;
    const pos = projection([geo.lng, geo.lat]);
    if (!pos) return;

    const radius = Math.max(10, Math.min(40, Math.abs(region.net_flow_usd_mm) / 500));
    const color = region.net_flow_score > 0 ? "#00C853" : "#FF1744";

    // パルスリング
    bubbleGroup
      .append("circle")
      .attr("cx", pos[0])
      .attr("cy", pos[1])
      .attr("r", radius + 4)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1)
      .attr("opacity", 0.3);

    // メインバブル
    bubbleGroup
      .append("circle")
      .attr("cx", pos[0])
      .attr("cy", pos[1])
      .attr("r", radius)
      .attr("fill", color)
      .attr("opacity", 0.4)
      .attr("stroke", color)
      .attr("stroke-width", 1.5);
  });
}

function drawHeatmapMode(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  regions: Array<{ id: string; net_flow_score: number }>,
  projection: d3.GeoProjection,
) {
  const heatGroup = svg.append("g").attr("class", "heatmap");

  regions.forEach((region) => {
    const geo = REGION_GEO[region.id];
    if (!geo) return;
    const pos = projection([geo.lng, geo.lat]);
    if (!pos) return;

    const intensity = Math.abs(region.net_flow_score) / 100;
    const color = region.net_flow_score > 0 ? "#00C853" : "#FF1744";

    // 放射状グラデーション
    const gradId = `heat-${region.id}`;
    const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");
    const gradient = defs
      .append("radialGradient")
      .attr("id", gradId);
    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", color)
      .attr("stop-opacity", intensity * 0.6);
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", color)
      .attr("stop-opacity", 0);

    heatGroup
      .append("circle")
      .attr("cx", pos[0])
      .attr("cy", pos[1])
      .attr("r", 60)
      .attr("fill", `url(#${gradId})`);
  });
}

function drawRegionNodes(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  regions: Array<{ id: string; name_ja: string; net_flow_score: number }>,
  projection: d3.GeoProjection,
  onSelect: (id: string) => void,
  onTooltip: (t: { x: number; y: number; content: string } | null) => void,
) {
  const nodeGroup = svg.append("g").attr("class", "nodes");

  Object.entries(REGION_GEO).forEach(([id, geo]) => {
    const pos = projection([geo.lng, geo.lat]);
    if (!pos) return;

    const region = regions.find((r) => r.id === id);
    const color = REGION_COLORS[id] ?? "#9E9E9E";

    const g = nodeGroup
      .append("g")
      .attr("cursor", "pointer")
      .on("click", () => onSelect(id))
      .on("mouseenter", (event) => {
        const score = region?.net_flow_score ?? 0;
        onTooltip({
          x: event.offsetX + 10,
          y: event.offsetY - 30,
          content: `${geo.name_ja} (${id}): ${score > 0 ? "+" : ""}${score.toFixed(1)}`,
        });
      })
      .on("mouseleave", () => onTooltip(null));

    g.append("circle")
      .attr("cx", pos[0])
      .attr("cy", pos[1])
      .attr("r", 12)
      .attr("fill", color)
      .attr("stroke", "var(--color-text-primary)")
      .attr("stroke-width", 2)
      .attr("opacity", 0.9);

    g.append("text")
      .attr("x", pos[0])
      .attr("y", pos[1] + 28)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--color-text-primary)")
      .attr("font-size", "14px")
      .attr("font-weight", "700")
      .text(id);
  });
}
