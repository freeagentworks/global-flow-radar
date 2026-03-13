# 02. システムアーキテクチャ - Global Flow Radar

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  Next.js App (TypeScript + React)                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Map View │ │Dashboard │ │ Alerts   │ │ History  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│       ↕ D3.js / Mapbox       ↕ Recharts    ↕ React Query       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST API / Server Actions
┌──────────────────────────────┴──────────────────────────────────┐
│                      API Layer (Next.js)                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐        │
│  │ Flow API     │ │ Alert API    │ │ Historical API   │        │
│  │ /api/flows/* │ │ /api/alerts/*│ │ /api/history/*   │        │
│  └──────────────┘ └──────────────┘ └──────────────────┘        │
│              ↕ Prisma ORM / Data Access Layer                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐        │
│  │ PostgreSQL   │ │ Redis Cache  │ │ TimescaleDB      │        │
│  │ (メタデータ)  │ │ (キャッシュ)  │ │ (時系列データ)    │        │
│  └──────────────┘ └──────────────┘ └──────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                               ↑
┌──────────────────────────────┴──────────────────────────────────┐
│                  Data Collection Layer (Python)                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐        │
│  │ ETF Fetcher  │ │ COT Parser   │ │ Market Fetcher   │        │
│  │ (Yahoo/ETF)  │ │ (CFTC)       │ │ (FRED/FX)        │        │
│  └──────────────┘ └──────────────┘ └──────────────────┘        │
│  ┌──────────────┐ ┌──────────────┐                              │
│  │ News Fetcher │ │ Flow Calc    │  ← 資金フロー推計エンジン    │
│  │ (NewsAPI)    │ │ Engine       │                              │
│  └──────────────┘ └──────────────┘                              │
│              Cron: 毎日 JST 07:00 (市場データ確定後)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. フロントエンド設計

### 2.1 技術選定

| 技術 | 用途 | 選定理由 |
|---|---|---|
| Next.js 14+ (App Router) | フレームワーク | SSR/SSG対応、API Routes統合 |
| TypeScript | 言語 | 型安全性、大規模開発対応 |
| D3.js | 世界地図・サンキー図 | カスタム可視化の柔軟性 |
| Mapbox GL JS | 地図ベースマップ | 高性能・カスタムスタイル |
| Recharts | チャート全般 | React統合、宣言的API |
| TanStack Query | データフェッチ | キャッシュ・再検証管理 |
| Tailwind CSS | スタイリング | 高速開発・一貫性 |
| Zustand | 状態管理 | 軽量・シンプル |
| next-intl | 多言語対応 | App Router対応i18n、デフォルト日本語 + 英語切替 |

### 2.2 ページ構成

```
/                          → ランディング / 概要ダッシュボード
/map                       → グローバル資金フローマップ
/sectors                   → セクターローテーション
/asset-classes             → 資産クラス間フロー
/etf-tracker               → ETF / 個別銘柄トラッカー
/history                   → ヒストリカル分析
/alerts                    → アラート設定・履歴
/about                     → プロジェクト概要・免責事項
```

### 2.3 コンポーネント設計方針

```
src/
├── app/                   # Next.js App Router
│   ├── (dashboard)/       # ダッシュボードレイアウトグループ
│   │   ├── map/
│   │   ├── sectors/
│   │   ├── asset-classes/
│   │   ├── etf-tracker/
│   │   ├── history/
│   │   └── alerts/
│   ├── api/               # API Routes
│   └── layout.tsx
├── components/
│   ├── charts/            # チャートコンポーネント
│   │   ├── FlowMap.tsx           # 世界地図フローマップ
│   │   ├── SankeyDiagram.tsx     # サンキー図
│   │   ├── SectorHeatmap.tsx     # セクターヒートマップ
│   │   ├── AssetFlowChart.tsx    # 資産クラスフローチャート
│   │   └── TimeSeriesChart.tsx   # 時系列チャート
│   ├── dashboard/         # ダッシュボードウィジェット
│   ├── layout/            # レイアウト部品
│   └── ui/                # 汎用UIコンポーネント
├── lib/
│   ├── api/               # APIクライアント
│   ├── hooks/             # カスタムフック
│   ├── utils/             # ユーティリティ
│   └── constants/         # 定数定義
├── types/                 # TypeScript型定義
└── styles/                # グローバルスタイル
```

---

## 3. バックエンド設計

### 3.1 API設計概要（詳細は06_api-design.md参照）

```
GET /api/flows/global            # グローバル資金フロー（国・地域間）
GET /api/flows/sectors           # セクター間フロー
GET /api/flows/asset-classes     # 資産クラス間フロー
GET /api/flows/etf/:symbol       # 個別ETF/銘柄フロー
GET /api/flows/rankings          # 資金流入/流出ランキング

GET /api/history/flows           # ヒストリカルフローデータ
GET /api/history/compare         # 期間比較データ
GET /api/history/events          # イベントマーカー

GET /api/alerts/rules            # アラートルール一覧
POST /api/alerts/rules           # アラートルール作成
GET /api/alerts/triggered        # トリガー済みアラート

GET /api/meta/sectors            # セクター一覧
GET /api/meta/regions            # 地域一覧
GET /api/meta/etf-list           # 追跡対象ETF一覧
```

### 3.2 データベース設計

```sql
-- 日次資金フローデータ（TimescaleDB hypertable）
CREATE TABLE daily_flows (
    time            TIMESTAMPTZ NOT NULL,
    flow_type       VARCHAR(20) NOT NULL,  -- 'region', 'sector', 'asset_class', 'etf'
    source_id       VARCHAR(50) NOT NULL,  -- 流出元
    target_id       VARCHAR(50) NOT NULL,  -- 流入先
    flow_amount     DECIMAL(18,2),         -- 推計資金量（百万USD）
    flow_pct_change DECIMAL(8,4),          -- 前日比変化率
    confidence      DECIMAL(4,2),          -- 推計信頼度
    metadata        JSONB                  -- 追加情報
);
SELECT create_hypertable('daily_flows', 'time');

-- ETF個別フローデータ
CREATE TABLE etf_flows (
    time            TIMESTAMPTZ NOT NULL,
    symbol          VARCHAR(20) NOT NULL,
    fund_flow       DECIMAL(18,2),         -- 資金フロー（百万USD）
    aum             DECIMAL(18,2),         -- 運用資産総額
    volume          BIGINT,                -- 出来高
    price           DECIMAL(12,4),         -- 終値
    nav             DECIMAL(12,4),         -- 基準価額
    premium_discount DECIMAL(8,4)          -- プレミアム/ディスカウント
);
SELECT create_hypertable('etf_flows', 'time');

-- COTポジションデータ
CREATE TABLE cot_positions (
    time            TIMESTAMPTZ NOT NULL,
    contract        VARCHAR(50) NOT NULL,  -- 先物契約名
    category        VARCHAR(30) NOT NULL,  -- 'commercial', 'non_commercial', 'non_reportable'
    long_positions  BIGINT,
    short_positions BIGINT,
    net_position    BIGINT,
    change_long     BIGINT,
    change_short    BIGINT
);
SELECT create_hypertable('cot_positions', 'time');

-- マクロ経済指標
CREATE TABLE macro_indicators (
    time            TIMESTAMPTZ NOT NULL,
    indicator_id    VARCHAR(50) NOT NULL,  -- FREDシリーズID
    value           DECIMAL(18,4),
    region          VARCHAR(10)            -- 地域コード
);
SELECT create_hypertable('macro_indicators', 'time');

-- アラートルール
CREATE TABLE alert_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         VARCHAR(100),          -- Phase 2: ユーザーID
    rule_name       VARCHAR(200),
    flow_type       VARCHAR(20),
    target_id       VARCHAR(50),
    condition       VARCHAR(20),           -- 'gt', 'lt', 'abs_gt', 'pct_change_gt'
    threshold       DECIMAL(12,4),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- アラート履歴
CREATE TABLE alert_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id         UUID REFERENCES alert_rules(id),
    triggered_at    TIMESTAMPTZ NOT NULL,
    flow_value      DECIMAL(18,2),
    message         TEXT,
    is_read         BOOLEAN DEFAULT false
);

-- 地域マスタ
CREATE TABLE regions (
    id              VARCHAR(10) PRIMARY KEY,  -- 'US', 'JP', 'EU', 'CN' etc.
    name_en         VARCHAR(100),
    name_ja         VARCHAR(100),
    latitude        DECIMAL(10,6),
    longitude       DECIMAL(10,6),
    market_weight   DECIMAL(6,4)              -- 世界市場に占めるウェイト
);

-- セクターマスタ
CREATE TABLE sectors (
    id              VARCHAR(30) PRIMARY KEY,  -- GICS準拠
    name_en         VARCHAR(100),
    name_ja         VARCHAR(100),
    representative_etf VARCHAR(10)            -- 代表ETF（XLK, XLF等）
);
```

---

## 4. データ収集パイプライン

### 4.1 概要

```
[Cron Job: 毎日 07:00 JST]
        │
        ▼
┌──────────────────┐
│  1. Raw Fetch    │ → Yahoo Finance, FRED, CFTC, NewsAPI
│     (並列実行)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  2. Normalize    │ → 通貨統一(USD)、欠損値補完、データ型統一
│     & Clean      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  3. Flow Calc    │ → 資金フロー推計エンジン（下記参照）
│     Engine       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  4. Store        │ → TimescaleDB / PostgreSQL
│     & Aggregate  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  5. Alert Check  │ → ルールエンジンでアラート判定
│     & Notify     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  6. Cache Warm   │ → Redis キャッシュ更新
└──────────────────┘
```

### 4.2 資金フロー推計エンジン

「資金フロー」を直接観測できるデータは限られるため、以下のプロキシ指標を組み合わせて推計する：

#### 地域間フロー推計
1. **ETF資金フロー**: 地域別ETF（SPY, EWJ, FXI, VGK等）の資金流出入
2. **為替フロー**: 主要通貨ペアの出来高・変動方向
3. **国債利回り差**: 利回りスプレッドの変化方向
4. **CFTC通貨先物ポジション**: 投機筋の通貨ポジション変化

```python
# 推計ロジック概念
regional_flow_score = (
    w1 * etf_flow_normalized +      # ETF資金フロー（権重: 0.40）
    w2 * fx_flow_signal +            # 為替フロー信号（権重: 0.25）
    w3 * yield_spread_signal +       # 利回り差信号（権重: 0.20）
    w4 * cot_position_change         # COTポジション変化（権重: 0.15）
)
```

#### セクターフロー推計
1. **セクターETF資金フロー**: XLK, XLF, XLE等のフロー
2. **セクター相対パフォーマンス**: セクターETFのリターン比較
3. **出来高変化**: セクター内銘柄の出来高急増/急減

#### 資産クラスフロー推計
1. **資産クラスETF**: SPY(株式), TLT(債券), GLD(金), USO(原油)等
2. **VIX / MOVE指数**: リスク選好度の変化
3. **資金フロー方向**: 各ETFのフロー方向性

---

## 5. インフラ・デプロイ

### 5.1 MVP構成

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Vercel    │────▶│   Railway    │────▶│  Supabase       │
│ (Next.js)   │     │ (Python Cron)│     │ (PostgreSQL +   │
│             │     │              │     │  TimescaleDB)   │
└─────────────┘     └─────────────┘     └─────────────────┘
                                               │
                                         ┌─────┴─────┐
                                         │  Upstash  │
                                         │  (Redis)  │
                                         └───────────┘
```

### 5.2 コスト見積もり（月額）

| サービス | プラン | 月額 |
|---|---|---|
| Vercel | Hobby → Pro | $0〜$20 |
| Railway | Starter | $5〜$10 |
| Supabase | Free → Pro | $0〜$25 |
| Upstash Redis | Free | $0 |
| Mapbox | Free tier (50K loads) | $0 |
| **合計** | | **$5〜$55** |

---

## 6. セキュリティ考慮事項

- 全APIキーは環境変数管理（.env.local / Railway Secrets）
- CORS設定: 自ドメインのみ許可
- API Rate Limiting: 100 req/min per IP
- データベース接続: SSL必須、接続プール使用
- 入力値バリデーション: Zodスキーマ
- 免責表示: 全ページフッターに投資助言ではない旨を表示
