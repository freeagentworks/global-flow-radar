# 06. API設計書 - Global Flow Radar

## 1. API設計方針

- RESTful API（Next.js App Router API Routes）
- レスポンス形式: JSON
- 日付形式: ISO 8601（UTC）
- 金額単位: 百万USD
- キャッシュ: Redis（TTL: 1時間、日次更新後にinvalidate）
- エラーレスポンス: 統一フォーマット

---

## 2. 共通仕様

### 2.1 レスポンス共通フォーマット

```typescript
// 成功時
{
  "success": true,
  "data": { ... },
  "meta": {
    "updated_at": "2026-03-13T07:30:00Z",
    "period": { "from": "2026-03-12", "to": "2026-03-12" },
    "data_quality": "full" | "partial" | "estimated"
  }
}

// エラー時
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 60
  }
}
```

### 2.2 共通クエリパラメータ

| パラメータ | 型 | 説明 | デフォルト |
|---|---|---|---|
| `period` | string | `1d`, `1w`, `1m`, `3m`, `6m`, `1y`, `5y` | `1m` |
| `from` | string | 開始日 (YYYY-MM-DD) | - |
| `to` | string | 終了日 (YYYY-MM-DD) | - |
| `format` | string | `summary` or `timeseries` | `summary` |

---

## 3. エンドポイント詳細

### 3.1 グローバルフロー API

#### `GET /api/flows/global`
地域間の資金フロー概要を取得

**クエリパラメータ:**
- `period`: 集計期間
- `format`: `summary`（最新スナップショット）or `timeseries`（時系列）

**レスポンス（summary）:**
```json
{
  "success": true,
  "data": {
    "flows": [
      {
        "source": "US",
        "target": "JP",
        "flow_score": 72.5,
        "flow_amount_usd_mm": 1250.3,
        "change_pct": 15.2,
        "confidence": 0.85
      },
      {
        "source": "EU",
        "target": "EM",
        "flow_score": -34.2,
        "flow_amount_usd_mm": -580.1,
        "change_pct": -8.7,
        "confidence": 0.72
      }
    ],
    "regions": [
      {
        "id": "US",
        "name": "United States",
        "net_flow_score": -45.3,
        "net_flow_usd_mm": -2340.5,
        "status": "outflow"
      },
      {
        "id": "JP",
        "name": "Japan",
        "net_flow_score": 68.1,
        "net_flow_usd_mm": 1890.2,
        "status": "inflow"
      }
    ]
  }
}
```

---

#### `GET /api/flows/global/detail/:regionId`
特定地域の詳細フロー（流入元/流出先の内訳）

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "region": { "id": "JP", "name": "Japan" },
    "net_flow_score": 68.1,
    "inflows": [
      { "from": "US", "flow_score": 72.5, "amount_usd_mm": 1250.3 },
      { "from": "EU", "flow_score": 23.1, "amount_usd_mm": 420.0 }
    ],
    "outflows": [
      { "to": "CN", "flow_score": -12.3, "amount_usd_mm": -180.5 }
    ],
    "drivers": [
      "JPY weakness attracting foreign equity investment",
      "BOJ policy divergence with Fed"
    ]
  }
}
```

---

### 3.2 セクターフロー API

#### `GET /api/flows/sectors`
GICS 11セクター間のフローデータ

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "sectors": [
      {
        "id": "technology",
        "name": "Technology",
        "flow_score": 85.2,
        "flow_usd_mm": 3420.1,
        "performance_pct": 2.3,
        "representative_etf": "XLK",
        "etf_price": 245.67,
        "etf_volume": 12500000
      }
    ],
    "rotation": {
      "estimated_cycle_phase": "late_expansion",
      "leading_sectors": ["energy", "materials"],
      "lagging_sectors": ["technology", "consumer_disc"]
    },
    "flows": [
      {
        "source": "technology",
        "target": "energy",
        "flow_score": 34.5,
        "amount_usd_mm": 890.2
      }
    ]
  }
}
```

---

### 3.3 資産クラスフロー API

#### `GET /api/flows/asset-classes`

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "asset_classes": [
      {
        "id": "us_equity",
        "name": "US Equity",
        "flow_score": -23.4,
        "flow_usd_mm": -1560.0,
        "etfs": ["SPY", "QQQ", "IWM"]
      },
      {
        "id": "gold",
        "name": "Gold",
        "flow_score": 67.8,
        "flow_usd_mm": 890.3,
        "etfs": ["GLD", "IAU"]
      }
    ],
    "risk_indicator": {
      "risk_on_off_score": -32.5,
      "label": "Risk Off",
      "components": {
        "vix": 24.5,
        "credit_spread": 4.2,
        "flow_direction": "defensive"
      }
    },
    "flows": [
      {
        "source": "us_equity",
        "target": "gold",
        "flow_score": 45.2,
        "amount_usd_mm": 670.1
      }
    ]
  }
}
```

---

### 3.4 ETFトラッカー API

#### `GET /api/flows/etf/:symbol`
個別ETFの資金フロー詳細

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "symbol": "SPY",
    "name": "SPDR S&P 500 ETF Trust",
    "category": "us_equity",
    "latest": {
      "price": 582.34,
      "change_pct": 0.32,
      "volume": 48200000,
      "estimated_flow_usd_mm": 234.5,
      "flow_direction": "inflow"
    },
    "summary": {
      "flow_1w_usd_mm": 1250.3,
      "flow_1m_usd_mm": 4560.2,
      "flow_3m_usd_mm": 12340.5,
      "aum_usd_mm": 523400
    },
    "timeseries": [
      {
        "date": "2026-03-12",
        "price": 582.34,
        "volume": 48200000,
        "estimated_flow_usd_mm": 234.5
      }
    ]
  }
}
```

#### `GET /api/flows/rankings`
ETF資金フローランキング

**クエリパラメータ:**
- `direction`: `inflow` or `outflow`
- `limit`: 件数（デフォルト20）
- `category`: フィルタ（`regional`, `sector`, `asset_class`, `all`）

---

### 3.5 ヒストリカル API

#### `GET /api/history/flows`
過去の資金フロー時系列データ

**クエリパラメータ:**
- `flow_type`: `global`, `sector`, `asset_class`, `etf`
- `target_id`: 対象ID
- `from`, `to`: 期間指定
- `interval`: `daily`, `weekly`, `monthly`

#### `GET /api/history/events`
マーケットイベント一覧

---

### 3.6 アラート API

#### `GET /api/alerts/rules`
アラートルール一覧

#### `POST /api/alerts/rules`
アラートルール作成

**リクエストBody:**
```json
{
  "rule_name": "US equity massive outflow",
  "flow_type": "asset_class",
  "target_id": "us_equity",
  "condition": "flow_score_lt",
  "threshold": -80,
  "is_active": true
}
```

#### `DELETE /api/alerts/rules/:id`
アラートルール削除

#### `GET /api/alerts/triggered`
トリガー済みアラート一覧

---

### 3.7 メタデータ API

#### `GET /api/meta/regions`
地域マスタ一覧（地図描画用座標含む）

#### `GET /api/meta/sectors`
セクターマスタ一覧

#### `GET /api/meta/etf-list`
追跡対象ETF一覧（カテゴリ別）

---

## 4. TypeScript型定義

```typescript
// types/api.ts

export interface FlowData {
  source: string;
  target: string;
  flow_score: number;        // -100 〜 +100
  flow_amount_usd_mm: number;
  change_pct: number;
  confidence: number;        // 0 〜 1
}

export interface RegionSummary {
  id: string;
  name: string;
  net_flow_score: number;
  net_flow_usd_mm: number;
  status: "inflow" | "outflow" | "neutral";
  latitude: number;
  longitude: number;
}

export interface SectorData {
  id: string;
  name: string;
  flow_score: number;
  flow_usd_mm: number;
  performance_pct: number;
  representative_etf: string;
}

export interface EtfDetail {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change_pct: number;
  volume: number;
  estimated_flow_usd_mm: number;
  flow_direction: "inflow" | "outflow" | "neutral";
}

export interface AlertRule {
  id: string;
  rule_name: string;
  flow_type: "global" | "sector" | "asset_class" | "etf";
  target_id: string;
  condition: "flow_score_gt" | "flow_score_lt" | "abs_change_gt" | "pct_change_gt";
  threshold: number;
  is_active: boolean;
  created_at: string;
}

export interface RiskIndicator {
  risk_on_off_score: number;  // -100(Risk Off) 〜 +100(Risk On)
  label: "Risk On" | "Risk Off" | "Neutral";
  components: {
    vix: number;
    credit_spread: number;
    flow_direction: "aggressive" | "defensive" | "neutral";
  };
}

export type Period = "1d" | "1w" | "1m" | "3m" | "6m" | "1y" | "5y";
export type FlowType = "global" | "sector" | "asset_class" | "etf";
```
