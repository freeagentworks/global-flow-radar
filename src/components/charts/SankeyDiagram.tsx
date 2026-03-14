"use client";

import { useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";

// Sankeyダイアグラム（D3.js手動レイアウト版）
// d3-sankeyパッケージに依存せず、基本的なD3でSankeyレイアウトを実装

interface SankeyNode {
  id: string;
  name: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

interface SankeyDiagramProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  width?: number;
  height?: number;
}

// レイアウト計算用の内部型
interface LayoutNode {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  totalValue: number;
}

interface LayoutLink {
  source: LayoutNode;
  target: LayoutNode;
  value: number;
  sy: number; // ソース側のY開始位置
  ty: number; // ターゲット側のY開始位置
  thickness: number;
  color: string;
}

// ノードカラーパレット
const NODE_COLORS = [
  "#448AFF", "#00C853", "#FF9800", "#E91E63", "#7C4DFF",
  "#00BCD4", "#FFC107", "#8BC34A", "#FF5722", "#9C27B0",
  "#009688", "#3F51B5", "#CDDC39",
];

// 手動Sankeyレイアウトを計算
function computeSankeyLayout(
  nodes: SankeyNode[],
  links: SankeyLink[],
  chartWidth: number,
  chartHeight: number,
): { layoutNodes: LayoutNode[]; layoutLinks: LayoutLink[] } {
  const padding = { top: 20, right: 40, bottom: 20, left: 40 };
  const nodeWidth = 20;
  const nodePadding = 12;
  const innerWidth = chartWidth - padding.left - padding.right - nodeWidth;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // ノードをソース側とターゲット側に分類
  const sourceIds = new Set(links.map((l) => l.source));
  const targetIds = new Set(links.map((l) => l.target));

  // 左側: ソースのみ、右側: ターゲットのみ、両方にあるものは中央
  const leftNodes: string[] = [];
  const rightNodes: string[] = [];
  const middleNodes: string[] = [];

  nodes.forEach((n) => {
    const isSource = sourceIds.has(n.id);
    const isTarget = targetIds.has(n.id);
    if (isSource && !isTarget) leftNodes.push(n.id);
    else if (!isSource && isTarget) rightNodes.push(n.id);
    else if (isSource && isTarget) middleNodes.push(n.id);
    else leftNodes.push(n.id); // どちらでもない場合は左側
  });

  // 各ノードの合計値を計算
  const nodeValues: Record<string, number> = {};
  nodes.forEach((n) => {
    const outgoing = links
      .filter((l) => l.source === n.id)
      .reduce((sum, l) => sum + l.value, 0);
    const incoming = links
      .filter((l) => l.target === n.id)
      .reduce((sum, l) => sum + l.value, 0);
    nodeValues[n.id] = Math.max(outgoing, incoming, 1);
  });

  // カラム分け（左・中・右）
  const columns: string[][] = [];
  if (leftNodes.length > 0) columns.push(leftNodes);
  if (middleNodes.length > 0) columns.push(middleNodes);
  if (rightNodes.length > 0) columns.push(rightNodes);

  // カラムが1つしかない場合、ソースとターゲットを分離
  if (columns.length <= 1) {
    const allSourceIds = [...new Set(links.map((l) => l.source))];
    const allTargetIds = [...new Set(links.map((l) => l.target))].filter(
      (id) => !allSourceIds.includes(id)
    );
    if (allTargetIds.length > 0) {
      columns.length = 0;
      columns.push(allSourceIds);
      columns.push(allTargetIds);
    }
  }

  // レイアウトノードの配置
  const layoutNodes: LayoutNode[] = [];
  const nodeMap: Record<string, LayoutNode> = {};

  columns.forEach((col, colIdx) => {
    const x = padding.left + (columns.length > 1 ? (colIdx / (columns.length - 1)) * innerWidth : 0);
    const totalValue = col.reduce((sum, id) => sum + nodeValues[id], 0);
    const totalPadding = (col.length - 1) * nodePadding;
    const availableHeight = innerHeight - totalPadding;
    const scale = availableHeight / Math.max(totalValue, 1);

    let currentY = padding.top;

    col.forEach((id, i) => {
      const node = nodes.find((n) => n.id === id)!;
      const nodeHeight = Math.max(8, nodeValues[id] * scale);
      const layoutNode: LayoutNode = {
        id,
        name: node.name,
        x,
        y: currentY,
        width: nodeWidth,
        height: nodeHeight,
        color: NODE_COLORS[i % NODE_COLORS.length],
        totalValue: nodeValues[id],
      };
      layoutNodes.push(layoutNode);
      nodeMap[id] = layoutNode;
      currentY += nodeHeight + nodePadding;
    });
  });

  // リンクの配置計算
  // 各ノードのソース側・ターゲット側のオフセットを追跡
  const sourceOffsets: Record<string, number> = {};
  const targetOffsets: Record<string, number> = {};
  nodes.forEach((n) => {
    sourceOffsets[n.id] = 0;
    targetOffsets[n.id] = 0;
  });

  // リンクを値の大きい順にソート（見た目の安定性のため）
  const sortedLinks = [...links].sort((a, b) => b.value - a.value);

  const layoutLinks: LayoutLink[] = sortedLinks
    .map((link) => {
      const source = nodeMap[link.source];
      const target = nodeMap[link.target];
      if (!source || !target) return null;

      const sourceScale = source.height / Math.max(source.totalValue, 1);
      const targetScale = target.height / Math.max(target.totalValue, 1);

      const thickness = Math.max(2, link.value * Math.min(sourceScale, targetScale));
      const sy = source.y + sourceOffsets[link.source];
      const ty = target.y + targetOffsets[link.target];

      sourceOffsets[link.source] += thickness;
      targetOffsets[link.target] += thickness;

      // リンクの色（フロー値に応じて流入/流出カラー）
      const color = link.value > 0 ? source.color : "#FF1744";

      return {
        source,
        target,
        value: link.value,
        sy,
        ty,
        thickness,
        color,
      } as LayoutLink;
    })
    .filter((l): l is LayoutLink => l !== null);

  return { layoutNodes, layoutLinks };
}

export function SankeyDiagram({
  nodes,
  links,
  width: propWidth,
  height: propHeight,
}: SankeyDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    if (!svgRef.current) return;
    if (nodes.length === 0 || links.length === 0) return;

    const chartWidth = propWidth ?? containerRef.current?.clientWidth ?? 600;
    const chartHeight = propHeight ?? 400;

    const svg = d3.select(svgRef.current);
    svg.attr("viewBox", `0 0 ${chartWidth} ${chartHeight}`);
    svg.selectAll("*").remove();

    // 背景
    svg
      .append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("fill", "transparent");

    const { layoutNodes, layoutLinks } = computeSankeyLayout(
      nodes,
      links,
      chartWidth,
      chartHeight,
    );

    // リンク描画
    const linkGroup = svg.append("g").attr("class", "links");

    layoutLinks.forEach((link) => {
      const sx = link.source.x + link.source.width;
      const tx = link.target.x;

      // ベジエ曲線でリンクを描画
      const curvature = 0.5;
      const xi = d3.interpolateNumber(sx, tx);
      const x2 = xi(curvature);
      const x3 = xi(1 - curvature);

      const pathData = `
        M ${sx} ${link.sy}
        C ${x2} ${link.sy}, ${x3} ${link.ty}, ${tx} ${link.ty}
        L ${tx} ${link.ty + link.thickness}
        C ${x3} ${link.ty + link.thickness}, ${x2} ${link.sy + link.thickness}, ${sx} ${link.sy + link.thickness}
        Z
      `;

      linkGroup
        .append("path")
        .attr("d", pathData)
        .attr("fill", link.color)
        .attr("opacity", 0.35)
        .attr("stroke", "none")
        .on("mouseenter", function () {
          d3.select(this).attr("opacity", 0.6);
        })
        .on("mouseleave", function () {
          d3.select(this).attr("opacity", 0.35);
        })
        .append("title")
        .text(
          `${link.source.name} → ${link.target.name}: ${link.value.toLocaleString()}`
        );
    });

    // ノード描画
    const nodeGroup = svg.append("g").attr("class", "nodes");

    layoutNodes.forEach((node) => {
      const g = nodeGroup.append("g").attr("cursor", "pointer");

      // ノードの矩形
      g.append("rect")
        .attr("x", node.x)
        .attr("y", node.y)
        .attr("width", node.width)
        .attr("height", node.height)
        .attr("fill", node.color)
        .attr("rx", 3)
        .attr("opacity", 0.9)
        .on("mouseenter", function () {
          d3.select(this).attr("opacity", 1);
        })
        .on("mouseleave", function () {
          d3.select(this).attr("opacity", 0.9);
        });

      // ノードラベル
      const labelX =
        node.x < chartWidth / 2
          ? node.x - 4
          : node.x + node.width + 4;
      const textAnchor = node.x < chartWidth / 2 ? "end" : "start";

      g.append("text")
        .attr("x", labelX)
        .attr("y", node.y + node.height / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", textAnchor)
        .attr("fill", "var(--color-text-secondary)")
        .attr("font-size", "11px")
        .attr("font-weight", "500")
        .text(node.name);

      // ツールチップ
      g.append("title").text(
        `${node.name}: ${node.totalValue.toLocaleString()}`
      );
    });
  }, [nodes, links, propWidth, propHeight]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  // データが空の場合
  if (nodes.length === 0 || links.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] rounded-lg border border-border bg-bg-card text-text-muted text-sm">
        Sankeyデータがありません
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <svg
        ref={svgRef}
        className="w-full rounded-lg"
        aria-label="Sankeyダイアグラム"
      />
    </div>
  );
}
