import { useQuery } from "@tanstack/react-query";
import type { RiskIndicator } from "@/types";

// 資産クラスフローデータ取得フック
export function useAssetClassFlows(period: string = "1m") {
  return useQuery({
    queryKey: ["asset-class-flows", period],
    queryFn: async () => {
      const res = await fetch(`/api/flows/asset-classes?period=${period}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data;
    },
  });
}

// リスク指標データ取得フック
// 資産クラスAPIからrisk_indicatorsフィールドを抽出
export function useRiskIndicators() {
  return useQuery<RiskIndicator>({
    queryKey: ["risk-indicators"],
    queryFn: async () => {
      const res = await fetch("/api/flows/asset-classes?period=1d");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data.risk_indicator;
    },
  });
}
