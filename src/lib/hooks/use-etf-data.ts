import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

// ETFリスト項目型
interface EtfListItem {
  symbol: string;
  name: string;
  category: "regional" | "sector" | "asset_class";
  sub_category: string;
  issuer: string;
  aum_usd_mm: number;
  expense_ratio: number;
}

// ETFフロータイムシリーズ型
interface EtfFlowTimeseries {
  date: string;
  flow_usd_mm: number;
  cumulative_flow_usd_mm: number;
  price: number;
  volume: number;
}

// ETF詳細レスポンス型
interface EtfDetailResponse {
  symbol: string;
  name: string;
  category: string;
  issuer: string;
  expense_ratio: number;
  inception_date: string;
  fund_flow_usd_mm: number;
  fund_flow_pct_aum: number;
  aum_usd_mm: number;
  volume_avg: number;
  price: number;
  price_change_pct: number;
  nav: number;
  premium_discount: number;
  holdings_count: number;
  timeseries: EtfFlowTimeseries[];
}

// デバウンス用カスタムフック
function useDebouncedValue(value: string, delay: number = 300): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// ETF検索フック（デバウンス付き）
// クエリ文字列でETFリストをフィルタリング
export function useEtfSearch(query: string) {
  const debouncedQuery = useDebouncedValue(query, 300);

  return useQuery<EtfListItem[]>({
    queryKey: ["etf-search", debouncedQuery],
    queryFn: async () => {
      const res = await fetch("/api/meta/etf-list");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);

      const etfs: EtfListItem[] = json.data.etfs;

      // クエリが空の場合は全件返却
      if (!debouncedQuery.trim()) return etfs;

      // シンボル名・ETF名でフィルタリング
      const lowerQuery = debouncedQuery.toLowerCase();
      return etfs.filter(
        (etf) =>
          etf.symbol.toLowerCase().includes(lowerQuery) ||
          etf.name.toLowerCase().includes(lowerQuery)
      );
    },
    // クエリが空でも取得する（全件表示用）
    enabled: true,
  });
}

// ETF個別詳細データ取得フック
export function useEtfDetail(symbol: string) {
  return useQuery<EtfDetailResponse>({
    queryKey: ["etf-detail", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/flows/etf/${symbol}?period=1y`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data;
    },
    // シンボルが空の場合は取得しない
    enabled: !!symbol,
  });
}

// ETFフロー履歴タイムシリーズ取得フック
export function useEtfFlowHistory(symbol: string, period: string) {
  return useQuery<EtfFlowTimeseries[]>({
    queryKey: ["etf-flow-history", symbol, period],
    queryFn: async () => {
      const res = await fetch(
        `/api/flows/etf/${symbol}?period=${period}&format=timeseries`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data.timeseries;
    },
    // シンボルが空の場合は取得しない
    enabled: !!symbol,
  });
}
