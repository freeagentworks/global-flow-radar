-- Global Flow Radar - 初期マイグレーション
-- 02_architecture.md 3.2節 データベース設計準拠
-- TimescaleDB hypertable + Prisma管理テーブル

-- TimescaleDB拡張を有効化
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================
-- マスターテーブル（Prisma管理）
-- ============================================

-- 地域マスタ
CREATE TABLE IF NOT EXISTS regions (
    id              VARCHAR(10) PRIMARY KEY,
    name_en         VARCHAR(100) NOT NULL,
    name_ja         VARCHAR(100) NOT NULL,
    latitude        DECIMAL(10,6) NOT NULL,
    longitude       DECIMAL(10,6) NOT NULL,
    market_weight   DECIMAL(6,4) NOT NULL DEFAULT 0
);

-- セクターマスタ（GICS 11セクター）
CREATE TABLE IF NOT EXISTS sectors (
    id                  VARCHAR(30) PRIMARY KEY,
    name_en             VARCHAR(100) NOT NULL,
    name_ja             VARCHAR(100) NOT NULL,
    representative_etf  VARCHAR(10) NOT NULL
);

-- アラートルール
CREATE TABLE IF NOT EXISTS alert_rules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     VARCHAR(100),
    rule_name   VARCHAR(200) NOT NULL,
    flow_type   VARCHAR(20) NOT NULL,
    target_id   VARCHAR(50) NOT NULL,
    condition   VARCHAR(20) NOT NULL,
    threshold   DECIMAL(12,4) NOT NULL,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- アラート履歴
CREATE TABLE IF NOT EXISTS alert_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id         UUID REFERENCES alert_rules(id),
    triggered_at    TIMESTAMPTZ NOT NULL,
    flow_value      DECIMAL(18,2) NOT NULL,
    message         TEXT,
    is_read         BOOLEAN DEFAULT false
);

-- ============================================
-- 時系列テーブル（TimescaleDB hypertable）
-- ============================================

-- 日次資金フローデータ
CREATE TABLE IF NOT EXISTS daily_flows (
    time            TIMESTAMPTZ NOT NULL,
    flow_type       VARCHAR(20) NOT NULL,
    source_id       VARCHAR(50) NOT NULL,
    target_id       VARCHAR(50) NOT NULL,
    flow_amount     DECIMAL(18,2),
    flow_pct_change DECIMAL(8,4),
    confidence      DECIMAL(4,2),
    metadata        JSONB
);
SELECT create_hypertable('daily_flows', 'time', if_not_exists => TRUE);

-- ETF個別フローデータ
CREATE TABLE IF NOT EXISTS etf_flows (
    time                TIMESTAMPTZ NOT NULL,
    symbol              VARCHAR(20) NOT NULL,
    fund_flow           DECIMAL(18,2),
    aum                 DECIMAL(18,2),
    volume              BIGINT,
    price               DECIMAL(12,4),
    nav                 DECIMAL(12,4),
    premium_discount    DECIMAL(8,4)
);
SELECT create_hypertable('etf_flows', 'time', if_not_exists => TRUE);

-- COTポジションデータ
CREATE TABLE IF NOT EXISTS cot_positions (
    time            TIMESTAMPTZ NOT NULL,
    contract        VARCHAR(50) NOT NULL,
    category        VARCHAR(30) NOT NULL,
    long_positions  BIGINT,
    short_positions BIGINT,
    net_position    BIGINT,
    change_long     BIGINT,
    change_short    BIGINT
);
SELECT create_hypertable('cot_positions', 'time', if_not_exists => TRUE);

-- マクロ経済指標
CREATE TABLE IF NOT EXISTS macro_indicators (
    time            TIMESTAMPTZ NOT NULL,
    indicator_id    VARCHAR(50) NOT NULL,
    value           DECIMAL(18,4),
    region          VARCHAR(10)
);
SELECT create_hypertable('macro_indicators', 'time', if_not_exists => TRUE);

-- ============================================
-- インデックス
-- ============================================
CREATE INDEX IF NOT EXISTS idx_daily_flows_type ON daily_flows (flow_type, time DESC);
CREATE INDEX IF NOT EXISTS idx_daily_flows_source ON daily_flows (source_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_daily_flows_target ON daily_flows (target_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_etf_flows_symbol ON etf_flows (symbol, time DESC);
CREATE INDEX IF NOT EXISTS idx_cot_positions_contract ON cot_positions (contract, time DESC);
CREATE INDEX IF NOT EXISTS idx_macro_indicators_id ON macro_indicators (indicator_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alert_history_rule ON alert_history (rule_id, triggered_at DESC);
