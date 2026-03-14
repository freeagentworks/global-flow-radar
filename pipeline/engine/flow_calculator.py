"""
資金フロー推計エンジン（タスク 0-5）
02_architecture.md 4.2節 準拠

地域間・セクター間・資産クラス間のフロースコアを推計
"""

import logging

import numpy as np
import pandas as pd

from pipeline.config import (
    FLOW_WEIGHTS,
    REGIONAL_ETFS,
    SECTOR_ETFS,
    ASSET_CLASS_ETFS,
)
from pipeline.collectors.yahoo_collector import (
    get_region_for_etf,
    get_sector_for_etf,
    get_asset_class_for_etf,
)

logger = logging.getLogger(__name__)


def calculate_regional_flows(
    etf_flows: pd.DataFrame,
    fx_data: pd.DataFrame | None = None,
    yield_data: pd.DataFrame | None = None,
    cot_data: pd.DataFrame | None = None,
) -> pd.DataFrame:
    """
    地域間フロースコアを推計

    regional_flow_score = (
        w1 * etf_flow_normalized +      # ETF資金フロー（0.40）
        w2 * fx_flow_signal +            # 為替フロー信号（0.25）
        w3 * yield_spread_signal +       # 利回り差信号（0.20）
        w4 * cot_position_change         # COTポジション変化（0.15）
    )
    """
    weights = FLOW_WEIGHTS["regional"]
    records = []

    if etf_flows.empty:
        return pd.DataFrame()

    # ETF フロー集計（地域別）
    region_flows: dict[str, dict] = {}
    for _, row in etf_flows.iterrows():
        region = get_region_for_etf(row["symbol"])
        if not region:
            continue

        if region not in region_flows:
            region_flows[region] = {"total_flow": 0.0, "count": 0, "date": row["date"]}

        region_flows[region]["total_flow"] += row.get("fund_flow", 0)
        region_flows[region]["count"] += 1

    if not region_flows:
        return pd.DataFrame()

    # フロースコアの正規化（-100 〜 +100）
    flows = [v["total_flow"] for v in region_flows.values()]
    max_abs_flow = max(abs(f) for f in flows) if flows else 1
    if max_abs_flow == 0:
        max_abs_flow = 1

    for region_id, data in region_flows.items():
        # ETFフロー成分（正規化）
        etf_score = (data["total_flow"] / max_abs_flow) * 100

        # 為替フロー成分（利用可能な場合）
        fx_score = _get_fx_signal(region_id, fx_data) if fx_data is not None else 0

        # 利回りスプレッド成分
        yield_score = _get_yield_signal(region_id, yield_data) if yield_data is not None else 0

        # COTポジション成分
        cot_score = _get_cot_signal(region_id, cot_data) if cot_data is not None else 0

        # 加重平均フロースコア
        flow_score = (
            weights["etf_flow"] * etf_score
            + weights["fx_flow"] * fx_score
            + weights["yield_spread"] * yield_score
            + weights["cot_position"] * cot_score
        )

        # 信頼度（利用可能なデータソース数に基づく）
        available_sources = 1  # ETFは常にあり
        if fx_data is not None and not fx_data.empty:
            available_sources += 1
        if yield_data is not None and not yield_data.empty:
            available_sources += 1
        if cot_data is not None and not cot_data.empty:
            available_sources += 1
        confidence = available_sources / 4.0

        records.append({
            "date": data["date"],
            "flow_type": "region",
            "source_id": "GLOBAL",
            "target_id": region_id,
            "flow_score": round(np.clip(flow_score, -100, 100), 2),
            "flow_amount": round(data["total_flow"], 2),
            "confidence": round(confidence, 2),
        })

    # 地域間フローペアの生成（流出元→流入先）
    pair_records = _generate_region_pairs(records)

    return pd.DataFrame(records + pair_records)


def calculate_sector_flows(etf_flows: pd.DataFrame) -> pd.DataFrame:
    """
    セクター間フロースコアを推計

    sector_flow_score = (
        w1 * etf_flow +              # セクターETFフロー（0.50）
        w2 * relative_performance +   # 相対パフォーマンス（0.30）
        w3 * volume_change            # 出来高変化（0.20）
    )
    """
    weights = FLOW_WEIGHTS["sector"]
    records = []

    if etf_flows.empty:
        return pd.DataFrame()

    # セクター別の集計
    sector_data: dict[str, dict] = {}
    for _, row in etf_flows.iterrows():
        sector = get_sector_for_etf(row["symbol"])
        if not sector:
            continue

        if sector not in sector_data:
            sector_data[sector] = {
                "total_flow": 0.0,
                "total_return": 0.0,
                "total_volume_change": 0.0,
                "count": 0,
                "date": row["date"],
            }

        sector_data[sector]["total_flow"] += row.get("fund_flow", 0)
        sector_data[sector]["total_return"] += row.get("price_change_pct", 0)
        sector_data[sector]["count"] += 1

    if not sector_data:
        return pd.DataFrame()

    # 正規化用の最大値
    max_flow = max(abs(d["total_flow"]) for d in sector_data.values()) or 1
    avg_return = np.mean([d["total_return"] / max(d["count"], 1) for d in sector_data.values()])

    for sector_id, data in sector_data.items():
        count = max(data["count"], 1)

        # ETFフロースコア
        etf_score = (data["total_flow"] / max_flow) * 100

        # 相対パフォーマンス（市場平均との差）
        avg_sector_return = data["total_return"] / count
        perf_score = (avg_sector_return - avg_return) * 20  # スケーリング

        # フロースコア計算
        flow_score = (
            weights["etf_flow"] * etf_score
            + weights["relative_performance"] * perf_score
        )

        records.append({
            "date": data["date"],
            "flow_type": "sector",
            "source_id": "MARKET",
            "target_id": sector_id,
            "flow_score": round(np.clip(flow_score, -100, 100), 2),
            "flow_amount": round(data["total_flow"], 2),
            "confidence": 0.75,
        })

    return pd.DataFrame(records)


def calculate_asset_class_flows(
    etf_flows: pd.DataFrame,
    risk_data: dict[str, float] | None = None,
) -> pd.DataFrame:
    """
    資産クラス間フロースコアを推計

    asset_flow_score = (
        w1 * etf_flow +          # 資産クラスETFフロー（0.50）
        w2 * risk_indicator +     # リスク指標（0.30）
        w3 * flow_direction       # フロー方向性（0.20）
    )
    """
    weights = FLOW_WEIGHTS["asset_class"]
    records = []

    if etf_flows.empty:
        return pd.DataFrame()

    # 資産クラス別の集計
    ac_data: dict[str, dict] = {}
    for _, row in etf_flows.iterrows():
        ac = get_asset_class_for_etf(row["symbol"])
        if not ac:
            continue

        if ac not in ac_data:
            ac_data[ac] = {"total_flow": 0.0, "count": 0, "date": row["date"]}

        ac_data[ac]["total_flow"] += row.get("fund_flow", 0)
        ac_data[ac]["count"] += 1

    if not ac_data:
        return pd.DataFrame()

    max_flow = max(abs(d["total_flow"]) for d in ac_data.values()) or 1

    # リスクオン/オフスコア
    risk_score = 0
    if risk_data and "VIXCLS" in risk_data:
        vix = risk_data["VIXCLS"]
        # VIX 20以下=リスクオン(+), 30以上=リスクオフ(-)
        risk_score = np.clip((25 - vix) * 4, -100, 100)

    for ac_id, data in ac_data.items():
        etf_score = (data["total_flow"] / max_flow) * 100

        # 資産クラスごとのリスク感応度
        risk_sensitivity = {
            "us_equity": 1.0, "intl_equity": 0.8,
            "us_bond": -0.6, "intl_bond": -0.4,
            "gold": -0.8, "silver": -0.5,
            "oil": 0.3, "commodity": 0.2,
            "crypto": 1.2, "cash": -1.0,
            "tips": -0.3,
        }
        sensitivity = risk_sensitivity.get(ac_id, 0)

        flow_score = (
            weights["etf_flow"] * etf_score
            + weights["risk_indicator"] * risk_score * sensitivity
            + weights["flow_direction"] * np.sign(data["total_flow"]) * 30
        )

        records.append({
            "date": data["date"],
            "flow_type": "asset_class",
            "source_id": "MARKET",
            "target_id": ac_id,
            "flow_score": round(np.clip(flow_score, -100, 100), 2),
            "flow_amount": round(data["total_flow"], 2),
            "confidence": 0.70,
        })

    return pd.DataFrame(records)


def calculate_risk_indicators(risk_data: dict[str, float] | None = None) -> dict:
    """
    リスクオン/オフスコアを計算

    Returns:
        dict: vix, credit_spread, risk_score, risk_label
    """
    if not risk_data:
        return {"vix": 0, "credit_spread": 0, "risk_score": 0, "risk_label": "neutral"}

    vix = risk_data.get("VIXCLS", 20)
    hy_spread = risk_data.get("BAMLH0A0HYM2", 4)

    # VIXスコア: 12以下=強リスクオン, 30以上=強リスクオフ
    vix_score = np.clip((25 - vix) * 5, -100, 100)

    # HYスプレッドスコア: 3%以下=リスクオン, 6%以上=リスクオフ
    hy_score = np.clip((4.5 - hy_spread) * 25, -100, 100)

    # 総合リスクスコア
    risk_score = vix_score * 0.6 + hy_score * 0.4

    # ラベル
    if risk_score > 30:
        label = "risk_on"
    elif risk_score < -30:
        label = "risk_off"
    else:
        label = "neutral"

    return {
        "vix": round(vix, 2),
        "vix_change": 0,  # 前日比は後で計算
        "credit_spread": round(hy_spread, 4),
        "risk_score": round(risk_score, 2),
        "risk_label": label,
    }


def _get_fx_signal(region_id: str, fx_data: pd.DataFrame | None) -> float:
    """地域に対応する為替シグナルを取得"""
    if fx_data is None or fx_data.empty:
        return 0

    # 地域→為替ペアのマッピング
    region_fx = {
        "JP": "DEXJPUS",
        "EU": "DEXUSEU",
        "CN": "DEXCHUS",
        "UK": "DEXUSUK",
    }

    fx_id = region_fx.get(region_id)
    if not fx_id:
        return 0

    fx_series = fx_data[fx_data["indicator_id"] == fx_id].sort_values("date")
    if len(fx_series) < 2:
        return 0

    # 為替の変化率をシグナルに変換
    latest = fx_series.iloc[-1]["value"]
    prev = fx_series.iloc[-2]["value"]
    if prev == 0:
        return 0

    pct_change = (latest - prev) / prev * 100

    # 通貨高→資金流入、通貨安→資金流出（逆相関のものもある）
    if fx_id == "DEXJPUS":
        return -pct_change * 20  # 円安(数値上昇)→日本から流出
    else:
        return pct_change * 20  # 通貨高→流入

    return 0


def _get_yield_signal(region_id: str, yield_data: pd.DataFrame | None) -> float:
    """利回りスプレッドシグナル"""
    # MVPでは米国のイールドカーブのみ
    if yield_data is None or yield_data.empty or region_id != "US":
        return 0

    spread = yield_data[yield_data["indicator_id"] == "T10Y2Y"]
    if spread.empty:
        return 0

    latest = spread.iloc[-1]["value"]
    # 正のスプレッド→景気拡大期待→リスクオン、負→逆イールド→リスクオフ
    return float(np.clip(latest * 20, -100, 100))


def _get_cot_signal(region_id: str, cot_data: pd.DataFrame | None) -> float:
    """COTポジション変化シグナル"""
    if cot_data is None or cot_data.empty:
        return 0

    # 地域→COT契約のマッピング
    region_cot = {
        "JP": "JAPANESE YEN",
        "EU": "EURO FX",
        "UK": "BRITISH POUND",
        "US": "E-MINI S&P 500",
    }

    contract = region_cot.get(region_id)
    if not contract:
        return 0

    # 投機筋のネットポジション変化
    spec = cot_data[
        (cot_data["contract"] == contract) & (cot_data["category"] == "non_commercial")
    ]

    if spec.empty or "change_long" not in spec.columns:
        return 0

    latest = spec.iloc[-1]
    net_change = int(latest.get("change_long", 0)) - int(latest.get("change_short", 0))

    # 正規化（大きな契約は数万単位の変化）
    return float(np.clip(net_change / 1000, -100, 100))


def _generate_region_pairs(region_records: list[dict]) -> list[dict]:
    """
    地域間フローペアを生成
    流出地域→流入地域の組み合わせを作成
    """
    if len(region_records) < 2:
        return []

    # 流入/流出で分類
    inflows = [r for r in region_records if r["flow_score"] > 0]
    outflows = [r for r in region_records if r["flow_score"] < 0]

    pairs = []
    for outflow in outflows:
        for inflow in inflows:
            if outflow["target_id"] == inflow["target_id"]:
                continue

            # ペアのフロー量は小さい方に合わせる
            pair_amount = min(
                abs(outflow["flow_amount"]),
                abs(inflow["flow_amount"]),
            )
            pair_score = (inflow["flow_score"] - outflow["flow_score"]) / 2

            pairs.append({
                "date": outflow["date"],
                "flow_type": "region",
                "source_id": outflow["target_id"],
                "target_id": inflow["target_id"],
                "flow_score": round(np.clip(pair_score, -100, 100), 2),
                "flow_amount": round(pair_amount, 2),
                "confidence": min(outflow["confidence"], inflow["confidence"]),
            })

    return pairs
