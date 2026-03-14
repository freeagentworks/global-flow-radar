// ============================================
// Global Flow Radar - 共通型定義
// 06_api-design.md 準拠
// ============================================

/** 期間指定 */
export type Period = "1d" | "1w" | "1m" | "3m" | "6m" | "1y" | "5y";

/** フロータイプ */
export type FlowType = "region" | "sector" | "asset_class" | "etf";

/** データ品質 */
export type DataQuality = "full" | "partial" | "estimated";

/** API共通レスポンス */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    updated_at: string;
    period: {
      from: string;
      to: string;
    };
    data_quality: DataQuality;
  };
}

/** フローデータ */
export interface FlowData {
  source: string;
  target: string;
  flow_score: number;
  amount: number;
  pct_change: number;
  confidence: number;
}

/** 地域サマリー */
export interface RegionSummary {
  id: string;
  name_en: string;
  name_ja: string;
  latitude: number;
  longitude: number;
  net_flow_score: number;
  net_flow_amount: number;
  market_weight: number;
}

/** セクターデータ */
export interface SectorData {
  id: string;
  name_en: string;
  name_ja: string;
  representative_etf: string;
  flow_score: number;
  flow_amount: number;
  performance_1d: number;
  performance_1w: number;
  performance_1m: number;
}

/** ETF詳細データ */
export interface EtfDetail {
  symbol: string;
  name: string;
  category: string;
  fund_flow: number;
  aum: number;
  volume: number;
  price: number;
  price_change_pct: number;
  nav: number;
  premium_discount: number;
}

/** アラートルール */
export interface AlertRule {
  id: string;
  rule_name: string;
  flow_type: FlowType;
  target_id: string;
  condition: "gt" | "lt" | "abs_gt" | "pct_change_gt";
  threshold: number;
  is_active: boolean;
  created_at: string;
}

/** トリガー済みアラート */
export interface TriggeredAlert {
  id: string;
  rule_id: string;
  rule_name: string;
  triggered_at: string;
  flow_value: number;
  message: string;
  is_read: boolean;
}

/** リスク指標 */
export interface RiskIndicator {
  vix: number;
  vix_change: number;
  credit_spread: number;
  risk_score: number;
  risk_label: "risk_on" | "neutral" | "risk_off";
}

/** マーケットサマリーカード */
export interface MarketMetric {
  label: string;
  value: number;
  change: number;
  prefix: string;
  suffix: string;
}

/** テーマ */
export type Theme = "dark" | "light";

/** ロケール */
export type Locale = "ja" | "en";
