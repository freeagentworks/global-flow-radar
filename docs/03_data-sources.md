# 03. データソース仕様書 - Global Flow Radar

## 1. データソース一覧

### 1.1 プライマリソース（MVP必須）

---

#### DS-001: Yahoo Finance API (yfinance)

| 項目 | 内容 |
|---|---|
| 用途 | ETF資金フロー、株価、出来高、セクターETFデータ |
| アクセス方法 | Python `yfinance` ライブラリ |
| 更新頻度 | 日次（市場クローズ後） |
| レートリミット | 約2,000リクエスト/時間（非公式） |
| コスト | 無料 |
| データ取得可能期間 | 最大20年 |

**取得対象ティッカー:**

```python
# 地域別ETF
REGIONAL_ETFS = {
    "US": ["SPY", "IVV", "VOO", "QQQ", "DIA", "IWM"],
    "JP": ["EWJ", "DXJ", "BBJP"],
    "EU": ["VGK", "IEV", "FEZ"],
    "CN": ["FXI", "MCHI", "KWEB"],
    "EM": ["EEM", "VWO", "IEMG"],
    "IN": ["INDA", "EPI"],
    "BR": ["EWZ"],
    "KR": ["EWY"],
    "TW": ["EWT"],
    "AU": ["EWA"],
    "UK": ["EWU"],
    "DE": ["EWG"],
    "FRONTIER": ["FM", "FRN"],
}

# セクターETF (GICS 11セクター)
SECTOR_ETFS = {
    "technology": ["XLK", "VGT", "IGV"],
    "healthcare": ["XLV", "VHT", "IBB"],
    "financials": ["XLF", "VFH", "KBE"],
    "energy": ["XLE", "VDE", "OIH"],
    "consumer_disc": ["XLY", "VCR"],
    "consumer_staples": ["XLP", "VDC"],
    "industrials": ["XLI", "VIS"],
    "materials": ["XLB", "VAW"],
    "utilities": ["XLU", "VPU"],
    "real_estate": ["XLRE", "VNQ"],
    "communication": ["XLC", "VOX"],
}

# 資産クラスETF
ASSET_CLASS_ETFS = {
    "us_equity": ["SPY", "QQQ"],
    "intl_equity": ["EFA", "EEM"],
    "us_bond": ["TLT", "IEF", "SHY", "AGG", "BND"],
    "intl_bond": ["BWX", "EMB"],
    "gold": ["GLD", "IAU"],
    "silver": ["SLV"],
    "oil": ["USO", "BNO"],
    "commodity": ["DBC", "GSG"],
    "crypto": ["BITO", "IBIT", "FBTC"],
    "cash": ["SHV", "BIL"],  # 短期国債 = 現金代替
    "tips": ["TIP"],          # インフレ連動債
}

# ボラティリティ・リスク指標
RISK_INDICATORS = {
    "vix": "^VIX",
    "vvix": "^VVIX",
    "move": None,  # FRED経由で取得
}
```

**資金フロー推計方法:**
```python
# ETF資金フロー = AUM変化 - 価格変動分
# Flow = AUM(t) - AUM(t-1) * (Price(t) / Price(t-1))
# yfinanceではAUMは直接取得不可のため、以下で近似:
# Flow_proxy = Volume * Price * flow_direction_signal
```

---

#### DS-002: FRED API (Federal Reserve Economic Data)

| 項目 | 内容 |
|---|---|
| 用途 | 金利、為替、マクロ経済指標、マネーサプライ |
| アクセス方法 | REST API (`fredapi` Python ライブラリ) |
| APIキー | 無料登録で取得 (https://fred.stlouisfed.org/docs/api/) |
| 更新頻度 | 系列により日次〜月次 |
| レートリミット | 120リクエスト/60秒 |
| コスト | 無料 |

**取得対象系列:**

```python
FRED_SERIES = {
    # 米国金利
    "DFF": "FF金利（実効）",
    "DGS2": "米国2年債利回り",
    "DGS10": "米国10年債利回り",
    "DGS30": "米国30年債利回り",
    "T10Y2Y": "10年-2年スプレッド（逆イールド指標）",
    "T10Y3M": "10年-3ヶ月スプレッド",

    # 為替
    "DEXJPUS": "USD/JPY",
    "DEXUSEU": "EUR/USD",
    "DEXCHUS": "USD/CNY",
    "DEXUSUK": "GBP/USD",
    "DTWEXBGS": "ドルインデックス（広域）",

    # マネーサプライ・流動性
    "M2SL": "M2マネーサプライ（月次）",
    "WALCL": "FRBバランスシート総資産（週次）",

    # リスク指標
    "BAMLH0A0HYM2": "HYスプレッド（BBBクレジットスプレッド）",
    "VIXCLS": "VIX",

    # インフレ
    "CPIAUCSL": "CPI（月次）",
    "T5YIE": "5年BEI（期待インフレ率）",
    "T10YIE": "10年BEI",

    # 雇用
    "UNRATE": "失業率（月次）",
    "ICSA": "新規失業保険申請件数（週次）",
}
```

---

#### DS-003: CFTC COT レポート

| 項目 | 内容 |
|---|---|
| 用途 | 先物市場の投機筋/実需筋ポジション |
| アクセス方法 | CFTC公開CSVダウンロード or `cot_reports` ライブラリ |
| URL | https://www.cftc.gov/dea/futures/financial_lf.htm |
| 更新頻度 | 週次（火曜日時点、金曜日発表） |
| コスト | 無料 |

**取得対象契約:**

```python
COT_CONTRACTS = {
    # 通貨先物
    "JAPANESE YEN": "JPY先物",
    "EURO FX": "EUR先物",
    "BRITISH POUND": "GBP先物",
    "SWISS FRANC": "CHF先物",
    "CANADIAN DOLLAR": "CAD先物",
    "AUSTRALIAN DOLLAR": "AUD先物",
    "MEXICAN PESO": "MXN先物",

    # 金利先物
    "10-YEAR U.S. TREASURY NOTES": "米10年債先物",
    "2-YEAR U.S. TREASURY NOTES": "米2年債先物",
    "30-DAY FEDERAL FUNDS": "FF金利先物",

    # 株価指数先物
    "E-MINI S&P 500": "S&P 500先物",
    "NASDAQ-100": "NASDAQ先物",
    "NIKKEI 225": "日経225先物",

    # コモディティ先物
    "GOLD": "金先物",
    "SILVER": "銀先物",
    "CRUDE OIL, LIGHT SWEET": "WTI原油先物",
}
```

**フロー推計への活用:**
- Net Position Change（純ポジション変化）= 投機筋の資金移動方向
- Long/Short Ratio変化 = リスク選好度の変化
- 週次データを日次に線形補完して利用

---

### 1.2 セカンダリソース（MVP補助〜Phase 2）

---

#### DS-004: ETF資金フローデータ

| 項目 | 内容 |
|---|---|
| 用途 | ETFの正確な資金流出入額 |
| 候補ソース | etfdb.com, ETF.com (スクレイピング or API) |
| 代替手段 | yfinanceのAUM推計で近似 |
| 注意 | スクレイピングは利用規約を要確認 |

---

#### DS-005: ニュース API

| 項目 | 内容 |
|---|---|
| 用途 | 市場関連ニュースヘッドラインの取得 |
| アクセス方法 | NewsAPI.org REST API |
| 無料枠 | 100リクエスト/日（開発用） |
| 有料プラン | $449/月（本番用、必要に応じて） |
| 活用 | Phase 2: LLM感情分析の入力データ |

---

#### DS-006: SNSデータ

| 項目 | 内容 |
|---|---|
| 用途 | 投資家センチメント分析 |
| 候補 | Twitter/X API, Reddit API |
| 注意 | X API Basic: $100/月、Free: 読み取り制限あり |
| 活用 | Phase 2: 感情分析連動 |

---

## 2. データ収集スケジュール

```
JST 06:00  米国市場クローズ確認
JST 06:30  Yahoo Finance データ取得開始
             ├── 地域ETF価格・出来高
             ├── セクターETF価格・出来高
             └── 資産クラスETF価格・出来高
JST 06:45  FRED データ取得
             ├── 金利データ
             ├── 為替データ
             └── マクロ指標
JST 07:00  資金フロー推計エンジン実行
             ├── ETF資金フロー推計
             ├── 地域間フロースコア計算
             ├── セクターフロースコア計算
             └── 資産クラスフロースコア計算
JST 07:15  アラートエンジン実行
JST 07:20  Redis キャッシュ更新
JST 07:30  完了通知

金曜 JST 22:00  CFTC COTレポート取得（週次）
```

---

## 3. データ品質管理

### 3.1 バリデーションルール

```python
VALIDATION_RULES = {
    "price": {
        "min": 0,
        "max_daily_change_pct": 50,  # 50%超の変動は異常値
        "null_action": "previous_value",  # 欠損時は前日値
    },
    "volume": {
        "min": 0,
        "null_action": "zero",
    },
    "flow_score": {
        "min": -100,
        "max": 100,
        "null_action": "skip",
    },
}
```

### 3.2 欠損データ処理

| 状況 | 対処 |
|---|---|
| 市場休場日 | 前営業日のデータを維持、フロー=0 |
| API障害 | 3回リトライ → 失敗時は前日値で補完、フラグ付与 |
| 新規ETF（データ不足） | 最低30日分のデータが溜まるまで推計から除外 |
| COT週次→日次変換 | 線形補完（火曜→次の火曜を7分割） |

---

## 4. API利用制限管理

```python
RATE_LIMITS = {
    "yahoo_finance": {
        "max_per_hour": 2000,
        "strategy": "batch_download",  # 複数ティッカーを一括取得
        "estimated_daily_calls": 50,   # バッチで効率化
    },
    "fred": {
        "max_per_minute": 120,
        "strategy": "sequential_with_delay",
        "estimated_daily_calls": 30,
    },
    "cftc": {
        "max_per_day": None,  # 制限なし（CSV直接DL）
        "strategy": "weekly_bulk_download",
        "estimated_weekly_calls": 1,
    },
}
```
