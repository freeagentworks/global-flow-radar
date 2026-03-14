"""
データベース書き込みモジュール
パイプライン結果をTimescaleDB hypertableに格納
"""

import logging
from datetime import datetime

import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def write_etf_flows(engine: Engine, df: pd.DataFrame) -> int:
    """ETFフローデータをetf_flowsテーブルに書き込み"""
    if df.empty:
        return 0

    records = []
    for _, row in df.iterrows():
        records.append({
            "time": row["date"],
            "symbol": row["symbol"],
            "fund_flow": row.get("fund_flow", 0),
            "aum": row.get("aum"),
            "volume": row.get("volume", 0),
            "price": row.get("price", 0),
            "nav": row.get("nav"),
            "premium_discount": row.get("premium_discount"),
        })

    return _bulk_insert(engine, "etf_flows", records)


def write_daily_flows(engine: Engine, df: pd.DataFrame) -> int:
    """日次フローデータをdaily_flowsテーブルに書き込み"""
    if df.empty:
        return 0

    records = []
    for _, row in df.iterrows():
        records.append({
            "time": row["date"],
            "flow_type": row["flow_type"],
            "source_id": row["source_id"],
            "target_id": row["target_id"],
            "flow_amount": row.get("flow_amount", 0),
            "flow_pct_change": row.get("pct_change"),
            "confidence": row.get("confidence", 0.5),
            "metadata": None,
        })

    return _bulk_insert(engine, "daily_flows", records)


def write_macro_indicators(engine: Engine, df: pd.DataFrame) -> int:
    """マクロ指標データをmacro_indicatorsテーブルに書き込み"""
    if df.empty:
        return 0

    records = []
    for _, row in df.iterrows():
        records.append({
            "time": row["date"],
            "indicator_id": row["indicator_id"],
            "value": row["value"],
            "region": row.get("region", "US"),
        })

    return _bulk_insert(engine, "macro_indicators", records)


def write_cot_positions(engine: Engine, df: pd.DataFrame) -> int:
    """COTポジションデータをcot_positionsテーブルに書き込み"""
    if df.empty:
        return 0

    date_col = "date" if "date" in df.columns else "report_date"
    records = []
    for _, row in df.iterrows():
        records.append({
            "time": row[date_col],
            "contract": row["contract"],
            "category": row["category"],
            "long_positions": row.get("long_positions", 0),
            "short_positions": row.get("short_positions", 0),
            "net_position": row.get("net_position", 0),
            "change_long": row.get("change_long", 0),
            "change_short": row.get("change_short", 0),
        })

    return _bulk_insert(engine, "cot_positions", records)


def _bulk_insert(engine: Engine, table: str, records: list[dict]) -> int:
    """バルクインサート（重複は無視）"""
    if not records:
        return 0

    columns = list(records[0].keys())
    placeholders = ", ".join(f":{col}" for col in columns)
    col_names = ", ".join(columns)

    sql = f"""
        INSERT INTO {table} ({col_names})
        VALUES ({placeholders})
        ON CONFLICT DO NOTHING
    """

    try:
        with engine.connect() as conn:
            conn.execute(text(sql), records)
            conn.commit()
        logger.info(f"{table}: {len(records)}レコード書き込み完了")
        return len(records)
    except Exception as e:
        logger.error(f"{table}への書き込み失敗: {e}")
        return 0
