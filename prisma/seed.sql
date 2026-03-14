-- Global Flow Radar - シードデータ
-- 地域マスタ・セクターマスタの初期データ

-- ============================================
-- 地域マスタ（03_data-sources.md 準拠）
-- ============================================
INSERT INTO regions (id, name_en, name_ja, latitude, longitude, market_weight) VALUES
    ('US', 'United States', 'アメリカ', 39.8283, -98.5795, 0.4200),
    ('JP', 'Japan', '日本', 36.2048, 138.2529, 0.0550),
    ('EU', 'Europe', '欧州', 50.1109, 9.8428, 0.1500),
    ('CN', 'China', '中国', 35.8617, 104.1954, 0.1000),
    ('EM', 'Emerging Markets', '新興国', 0.0000, 30.0000, 0.1200),
    ('IN', 'India', 'インド', 20.5937, 78.9629, 0.0350),
    ('BR', 'Brazil', 'ブラジル', -14.2350, -51.9253, 0.0150),
    ('KR', 'South Korea', '韓国', 35.9078, 127.7669, 0.0180),
    ('TW', 'Taiwan', '台湾', 23.6978, 120.9605, 0.0200),
    ('AU', 'Australia', 'オーストラリア', -25.2744, 133.7751, 0.0200),
    ('UK', 'United Kingdom', 'イギリス', 55.3781, -3.4360, 0.0350),
    ('FR', 'Frontier Markets', 'フロンティア', 5.0000, 20.0000, 0.0100)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- セクターマスタ（GICS 11セクター）
-- ============================================
INSERT INTO sectors (id, name_en, name_ja, representative_etf) VALUES
    ('technology', 'Technology', 'テクノロジー', 'XLK'),
    ('healthcare', 'Healthcare', 'ヘルスケア', 'XLV'),
    ('financials', 'Financials', '金融', 'XLF'),
    ('energy', 'Energy', 'エネルギー', 'XLE'),
    ('consumer_disc', 'Consumer Discretionary', '一般消費財', 'XLY'),
    ('consumer_staples', 'Consumer Staples', '生活必需品', 'XLP'),
    ('industrials', 'Industrials', '資本財', 'XLI'),
    ('materials', 'Materials', '素材', 'XLB'),
    ('utilities', 'Utilities', '公益事業', 'XLU'),
    ('real_estate', 'Real Estate', '不動産', 'XLRE'),
    ('communication', 'Communication Services', 'コミュニケーション', 'XLC')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- デフォルトのプリセットアラートルール
-- ============================================
INSERT INTO alert_rules (rule_name, flow_type, target_id, condition, threshold, is_active) VALUES
    ('地域フロー2σ超過', 'region', '*', 'abs_gt', 2.0, true),
    ('セクター3日連続加速', 'sector', '*', 'pct_change_gt', 50.0, true),
    ('VIX 20%急騰', 'asset_class', 'VIX', 'pct_change_gt', 20.0, true)
ON CONFLICT DO NOTHING;
