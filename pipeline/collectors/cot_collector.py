"""
CFTC COT レポートコレクター（DS-003）
先物市場のポジションデータを取得・解析
"""

import logging
from datetime import datetime, timedelta
from io import StringIO

import pandas as pd
import requests

from pipeline.config import COT_CONTRACTS

logger = logging.getLogger(__name__)

# CFTC COTレポートのURL（金融先物）
COT_FINANCIAL_URL = (
    "https://www.cftc.gov/dea/newcot/FinFutWk.txt"
)
# CFTC COTレポートのURL（コモディティ先物）
COT_COMMODITY_URL = (
    "https://www.cftc.gov/dea/newcot/deacom.txt"
)


def fetch_cot_data() -> pd.DataFrame:
    """
    CFTC COTレポートをダウンロード・パース

    Returns:
        DataFrame: contract, category, long_positions, short_positions,
                   net_position, change_long, change_short, report_date
    """
    records = []

    # 金融先物COTレポート
    fin_records = _fetch_and_parse(COT_FINANCIAL_URL, is_financial=True)
    records.extend(fin_records)

    # コモディティ先物COTレポート
    com_records = _fetch_and_parse(COT_COMMODITY_URL, is_financial=False)
    records.extend(com_records)

    df = pd.DataFrame(records)
    if not df.empty:
        logger.info(f"COT: {len(df)}レコード取得完了")
    else:
        logger.warning("COTデータが取得できませんでした")

    return df


def _fetch_and_parse(url: str, is_financial: bool) -> list[dict]:
    """COTレポートCSVをダウンロードしてパース"""
    records = []

    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()

        # CSVを解析
        df = pd.read_csv(StringIO(response.text))

        # 対象契約のみフィルタ
        target_contracts = set(COT_CONTRACTS.keys())

        for _, row in df.iterrows():
            contract_name = str(row.get("Market_and_Exchange_Names", ""))

            # 契約名でマッチング（部分一致）
            matched_contract = None
            for target in target_contracts:
                if target.upper() in contract_name.upper():
                    matched_contract = target
                    break

            if not matched_contract:
                continue

            try:
                report_date = pd.to_datetime(row.get("Report_Date_as_YYYY-MM-DD", row.get("As_of_Date_In_Form_YYMMDD")))
            except Exception:
                continue

            # 非商業（投機筋）ポジション
            records.append({
                "contract": matched_contract,
                "category": "non_commercial",
                "long_positions": int(row.get("NonComm_Positions_Long_All", 0) or 0),
                "short_positions": int(row.get("NonComm_Positions_Short_All", 0) or 0),
                "net_position": int(row.get("NonComm_Positions_Long_All", 0) or 0) - int(row.get("NonComm_Positions_Short_All", 0) or 0),
                "change_long": int(row.get("Change_in_NonComm_Long_All", 0) or 0),
                "change_short": int(row.get("Change_in_NonComm_Short_All", 0) or 0),
                "report_date": report_date,
            })

            # 商業（実需筋）ポジション
            records.append({
                "contract": matched_contract,
                "category": "commercial",
                "long_positions": int(row.get("Comm_Positions_Long_All", 0) or 0),
                "short_positions": int(row.get("Comm_Positions_Short_All", 0) or 0),
                "net_position": int(row.get("Comm_Positions_Long_All", 0) or 0) - int(row.get("Comm_Positions_Short_All", 0) or 0),
                "change_long": int(row.get("Change_in_Comm_Long_All", 0) or 0),
                "change_short": int(row.get("Change_in_Comm_Short_All", 0) or 0),
                "report_date": report_date,
            })

    except requests.RequestException as e:
        logger.error(f"COTデータのダウンロード失敗 ({url}): {e}")
    except Exception as e:
        logger.error(f"COTデータのパース失敗: {e}")

    return records


def interpolate_weekly_to_daily(df: pd.DataFrame) -> pd.DataFrame:
    """
    週次COTデータを日次に線形補完（03_data-sources.md 3.2節）
    火曜→次の火曜を7分割

    Args:
        df: COTデータ（report_date列を含む）

    Returns:
        DataFrame: 日次に展開されたCOTデータ
    """
    if df.empty:
        return df

    daily_records = []

    for contract in df["contract"].unique():
        for category in df["category"].unique():
            subset = df[
                (df["contract"] == contract) & (df["category"] == category)
            ].sort_values("report_date")

            if len(subset) < 2:
                continue

            for i in range(len(subset) - 1):
                curr = subset.iloc[i]
                next_row = subset.iloc[i + 1]

                start_date = pd.to_datetime(curr["report_date"])
                end_date = pd.to_datetime(next_row["report_date"])
                days = (end_date - start_date).days

                if days <= 0:
                    continue

                for day in range(days):
                    ratio = day / days
                    interpolated_date = start_date + timedelta(days=day)

                    daily_records.append({
                        "contract": contract,
                        "category": category,
                        "long_positions": int(
                            curr["long_positions"]
                            + (next_row["long_positions"] - curr["long_positions"]) * ratio
                        ),
                        "short_positions": int(
                            curr["short_positions"]
                            + (next_row["short_positions"] - curr["short_positions"]) * ratio
                        ),
                        "net_position": int(
                            curr["net_position"]
                            + (next_row["net_position"] - curr["net_position"]) * ratio
                        ),
                        "date": interpolated_date,
                    })

    return pd.DataFrame(daily_records)
