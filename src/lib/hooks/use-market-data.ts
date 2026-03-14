import { useQuery } from "@tanstack/react-query";
import type { MarketMetric } from "@/types";

// マーケットサマリーデータ取得フック
export function useMarketSummary() {
  return useQuery<MarketMetric[]>({
    queryKey: ["market-summary"],
    queryFn: async () => {
      const res = await fetch("/api/flows/global?period=1d");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);

      // APIデータからマーケットサマリーカード用のデータに変換
      // MVP段階ではモックデータを使用
      return [
        { label: "S&P 500", value: 5823, change: 0.3, prefix: "", suffix: "" },
        { label: "Nikkei 225", value: 39245, change: 1.2, prefix: "", suffix: "" },
        { label: "USD/JPY", value: 148.52, change: -0.4, prefix: "", suffix: "" },
        { label: "US 10Y", value: 4.25, change: -0.02, prefix: "", suffix: "%" },
        { label: "VIX", value: 18.32, change: -3.2, prefix: "", suffix: "" },
        { label: "Gold", value: 2340, change: 0.8, prefix: "$", suffix: "" },
        { label: "BTC", value: 67800, change: 2.1, prefix: "$", suffix: "" },
      ];
    },
  });
}

// ETFランキング項目型（APIレスポンスそのまま）
export interface EtfRankingItem {
  rank: number;
  symbol: string;
  name: string;
  category: string;
  flow_usd_mm: number;
  flow_pct_aum: number;
  aum_usd_mm: number;
  performance_pct: number;
  volume_avg_mm: number;
}

// ETFランキングデータ取得フック
export function useEtfRankings(direction: "inflow" | "outflow", limit: number = 5) {
  return useQuery<EtfRankingItem[]>({
    queryKey: ["etf-rankings", direction, limit],
    queryFn: async () => {
      const res = await fetch(
        `/api/flows/rankings?direction=${direction}&limit=${limit}&period=1d`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data.rankings;
    },
  });
}

// グローバルフローデータ取得フック
export function useGlobalFlows(period: string = "1m") {
  return useQuery({
    queryKey: ["global-flows", period],
    queryFn: async () => {
      const res = await fetch(`/api/flows/global?period=${period}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data;
    },
  });
}

// セクターフローデータ取得フック
export function useSectorFlows(period: string = "1m") {
  return useQuery({
    queryKey: ["sector-flows", period],
    queryFn: async () => {
      const res = await fetch(`/api/flows/sectors?period=${period}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data;
    },
  });
}

// アラートデータ取得フック
export function useLatestAlerts(limit: number = 5) {
  return useQuery({
    queryKey: ["latest-alerts", limit],
    queryFn: async () => {
      const res = await fetch(`/api/alerts/triggered?limit=${limit}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data.alerts;
    },
  });
}
