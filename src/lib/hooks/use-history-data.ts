import { useQuery } from "@tanstack/react-query";

// ヒストリカルフローポイント型
interface FlowDataPoint {
  date: string;
  flow_score: number;
  flow_usd_mm: number;
  cumulative_usd_mm: number;
  volume_usd_mm: number;
}

// ヒストリカルフローレスポンス型
interface HistoricalFlowResponse {
  flow_type: string;
  target_id: string;
  interval: string;
  timeseries: FlowDataPoint[];
}

// マーケットイベント型
export interface MarketEvent {
  id: string;
  name_en: string;
  name_ja: string;
  date_start: string;
  date_end: string | null;
  category: "crisis" | "policy" | "geopolitical" | "pandemic" | "structural";
  severity: "high" | "medium" | "low";
  description_ja: string;
  sp500_impact_pct: number;
  flow_impact_summary: string;
}

// ヒストリカルフローデータ取得フック
// period: 期間指定（from/toを計算）、flowType: region/sector/asset_class
export function useHistoricalFlows(period: string, flowType: string) {
  return useQuery<HistoricalFlowResponse>({
    queryKey: ["historical-flows", period, flowType],
    queryFn: async () => {
      // periodからfrom/toを計算
      const to = new Date();
      const from = new Date();
      const periodMap: Record<string, number> = {
        "1m": 30,
        "3m": 90,
        "6m": 180,
        "1y": 365,
        "5y": 1825,
      };
      const days = periodMap[period] ?? 365;
      from.setDate(from.getDate() - days);

      // flowTypeに応じたデフォルトのtarget_idを設定
      const defaultTargets: Record<string, string> = {
        region: "US",
        sector: "tech",
        asset_class: "us_equity",
      };
      const targetId = defaultTargets[flowType] ?? "US";

      const params = new URLSearchParams({
        flow_type: flowType,
        target_id: targetId,
        from: from.toISOString().split("T")[0],
        to: to.toISOString().split("T")[0],
        interval: "1d",
      });

      const res = await fetch(`/api/history/flows?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data;
    },
  });
}

// ヒストリカルイベント一覧取得フック
export function useHistoricalEvents() {
  return useQuery<MarketEvent[]>({
    queryKey: ["historical-events"],
    queryFn: async () => {
      const res = await fetch("/api/history/events");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data.events;
    },
  });
}
