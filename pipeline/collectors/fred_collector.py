"""
FRED データコレクター（DS-002）
金利・為替・マクロ経済指標データの取得
"""

import logging
from datetime import datetime, timedelta

import pandas as pd

from pipeline.config import FRED_API_KEY, FRED_SERIES

logger = logging.getLogger(__name__)


def fetch_fred_data(
    lookback_days: int = 30,
) -> pd.DataFrame:
    """
    FRED APIから全系列のデータを取得

    Args:
        lookback_days: 遡る日数

    Returns:
        DataFrame: indicator_id, date, value, description
    """
    if not FRED_API_KEY:
        logger.warning("FRED_API_KEYが設定されていません。スキップします。")
        return pd.DataFrame()

    try:
        from fredapi import Fred
        fred = Fred(api_key=FRED_API_KEY)
    except ImportError:
        logger.error("fredapiパッケージがインストールされていません")
        return pd.DataFrame()

    end_date = datetime.now()
    start_date = end_date - timedelta(days=lookback_days)

    records = []
    for series_id, description in FRED_SERIES.items():
        try:
            data = fred.get_series(
                series_id,
                observation_start=start_date,
                observation_end=end_date,
            )

            if data is None or data.empty:
                logger.debug(f"{series_id}: データなし")
                continue

            for date, value in data.items():
                if pd.notna(value):
                    records.append({
                        "indicator_id": series_id,
                        "date": date,
                        "value": float(value),
                        "description": description,
                    })

            logger.debug(f"{series_id}: {len(data)}レコード取得")

        except Exception as e:
            logger.warning(f"FRED系列 {series_id} 取得失敗: {e}")
            continue

    df = pd.DataFrame(records)
    logger.info(f"FRED: {len(df)}レコード取得完了 ({len(FRED_SERIES)}系列)")
    return df


def get_latest_indicators() -> dict[str, float]:
    """
    各FRED系列の最新値を取得

    Returns:
        dict: {series_id: latest_value}
    """
    if not FRED_API_KEY:
        return {}

    try:
        from fredapi import Fred
        fred = Fred(api_key=FRED_API_KEY)
    except ImportError:
        return {}

    latest = {}
    for series_id in FRED_SERIES:
        try:
            data = fred.get_series(series_id, observation_start=datetime.now() - timedelta(days=7))
            if data is not None and not data.empty:
                # 最新の非NaN値を取得
                valid = data.dropna()
                if not valid.empty:
                    latest[series_id] = float(valid.iloc[-1])
        except Exception:
            continue

    return latest


def get_yield_spread(df: pd.DataFrame) -> pd.DataFrame:
    """
    利回りスプレッドを計算

    Args:
        df: fetch_fred_dataの戻り値

    Returns:
        DataFrame: date, spread_10y2y, spread_10y3m
    """
    if df.empty:
        return pd.DataFrame()

    # 10年-2年スプレッド（T10Y2Y）は直接取得済み
    spreads = df[df["indicator_id"].isin(["T10Y2Y", "T10Y3M", "DGS10", "DGS2"])]
    return spreads


def get_fx_data(df: pd.DataFrame) -> pd.DataFrame:
    """為替データを抽出"""
    fx_ids = ["DEXJPUS", "DEXUSEU", "DEXCHUS", "DEXUSUK", "DTWEXBGS"]
    return df[df["indicator_id"].isin(fx_ids)] if not df.empty else pd.DataFrame()
