"""
Global Flow Radar - パイプライン設定
03_data-sources.md 準拠のティッカー定義・API設定
"""

import os
from dotenv import load_dotenv

load_dotenv()

# --- データベース ---
DATABASE_URL = os.getenv("DATABASE_URL", "")

# --- Redis ---
REDIS_URL = os.getenv("UPSTASH_REDIS_REST_URL", "")
REDIS_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")

# --- FRED API ---
FRED_API_KEY = os.getenv("FRED_API_KEY", "")

# ============================================
# ティッカー定義（03_data-sources.md 準拠）
# ============================================

# 地域別ETF
REGIONAL_ETFS: dict[str, list[str]] = {
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
    "FR": ["FM", "FRN"],
}

# セクターETF（GICS 11セクター）
SECTOR_ETFS: dict[str, list[str]] = {
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
ASSET_CLASS_ETFS: dict[str, list[str]] = {
    "us_equity": ["SPY", "QQQ"],
    "intl_equity": ["EFA", "EEM"],
    "us_bond": ["TLT", "IEF", "SHY", "AGG", "BND"],
    "intl_bond": ["BWX", "EMB"],
    "gold": ["GLD", "IAU"],
    "silver": ["SLV"],
    "oil": ["USO", "BNO"],
    "commodity": ["DBC", "GSG"],
    "crypto": ["BITO", "IBIT", "FBTC"],
    "cash": ["SHV", "BIL"],
    "tips": ["TIP"],
}

# FRED系列（DS-002）
FRED_SERIES: dict[str, str] = {
    "DFF": "FF金利（実効）",
    "DGS2": "米国2年債利回り",
    "DGS10": "米国10年債利回り",
    "DGS30": "米国30年債利回り",
    "T10Y2Y": "10年-2年スプレッド",
    "T10Y3M": "10年-3ヶ月スプレッド",
    "DEXJPUS": "USD/JPY",
    "DEXUSEU": "EUR/USD",
    "DEXCHUS": "USD/CNY",
    "DEXUSUK": "GBP/USD",
    "DTWEXBGS": "ドルインデックス",
    "M2SL": "M2マネーサプライ",
    "WALCL": "FRBバランスシート",
    "BAMLH0A0HYM2": "HYスプレッド",
    "VIXCLS": "VIX",
    "CPIAUCSL": "CPI",
    "T5YIE": "5年BEI",
    "T10YIE": "10年BEI",
    "UNRATE": "失業率",
    "ICSA": "新規失業保険申請件数",
}

# COT契約（DS-003）
COT_CONTRACTS: dict[str, str] = {
    "JAPANESE YEN": "JPY先物",
    "EURO FX": "EUR先物",
    "BRITISH POUND": "GBP先物",
    "SWISS FRANC": "CHF先物",
    "CANADIAN DOLLAR": "CAD先物",
    "AUSTRALIAN DOLLAR": "AUD先物",
    "MEXICAN PESO": "MXN先物",
    "10-YEAR U.S. TREASURY NOTES": "米10年債先物",
    "2-YEAR U.S. TREASURY NOTES": "米2年債先物",
    "30-DAY FEDERAL FUNDS": "FF金利先物",
    "E-MINI S&P 500": "S&P 500先物",
    "NASDAQ-100": "NASDAQ先物",
    "NIKKEI 225": "日経225先物",
    "GOLD": "金先物",
    "SILVER": "銀先物",
    "CRUDE OIL, LIGHT SWEET": "WTI原油先物",
}

# ボラティリティ・リスク指標
RISK_TICKERS: dict[str, str] = {
    "vix": "^VIX",
    "vvix": "^VVIX",
}

# バリデーションルール（03_data-sources.md 3.1節）
VALIDATION_RULES = {
    "price": {
        "min": 0,
        "max_daily_change_pct": 50,
        "null_action": "previous_value",
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

# フロースコア推計の重み（02_architecture.md 4.2節）
FLOW_WEIGHTS = {
    "regional": {
        "etf_flow": 0.40,
        "fx_flow": 0.25,
        "yield_spread": 0.20,
        "cot_position": 0.15,
    },
    "sector": {
        "etf_flow": 0.50,
        "relative_performance": 0.30,
        "volume_change": 0.20,
    },
    "asset_class": {
        "etf_flow": 0.50,
        "risk_indicator": 0.30,
        "flow_direction": 0.20,
    },
}

# 全ETFティッカーのフラットリスト（一括取得用）
def get_all_tickers() -> list[str]:
    """全ETFティッカーの重複なしリストを返す"""
    tickers: set[str] = set()
    for etfs in REGIONAL_ETFS.values():
        tickers.update(etfs)
    for etfs in SECTOR_ETFS.values():
        tickers.update(etfs)
    for etfs in ASSET_CLASS_ETFS.values():
        tickers.update(etfs)
    tickers.update(RISK_TICKERS.values())
    return sorted(tickers)
