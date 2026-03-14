"""
データ正規化パイプライン（タスク 0-4）
通貨統一、欠損値補完、バリデーション
03_data-sources.md 3.1-3.2節 準拠
"""

import logging

import numpy as np
import pandas as pd

from pipeline.config import VALIDATION_RULES

logger = logging.getLogger(__name__)


def validate_prices(df: pd.DataFrame) -> pd.DataFrame:
    """
    価格データのバリデーション

    - 負の値を除外
    - 前日比50%超の変動は異常値としてフラグ
    - 欠損値は前日値で補完
    """
    if df.empty or "close" not in df.columns:
        return df

    rules = VALIDATION_RULES["price"]
    result = df.copy()

    # 負の価格を除外
    result.loc[result["close"] < rules["min"], "close"] = np.nan

    # 前日比変動率チェック（シンボル単位）
    for symbol in result["symbol"].unique():
        mask = result["symbol"] == symbol
        sdf = result.loc[mask].sort_values("date")
        pct_change = sdf["close"].pct_change().abs() * 100

        # 50%超の変動は異常値
        anomaly_mask = pct_change > rules["max_daily_change_pct"]
        if anomaly_mask.any():
            anomaly_dates = sdf.loc[anomaly_mask.values, "date"].tolist()
            logger.warning(
                f"{symbol}: 異常値検出 ({len(anomaly_dates)}件) - 前日値で補完"
            )
            result.loc[
                mask & result["date"].isin(anomaly_dates), "close"
            ] = np.nan

    # 欠損値を前日値で補完（forward fill）
    for symbol in result["symbol"].unique():
        mask = result["symbol"] == symbol
        result.loc[mask, "close"] = result.loc[mask, "close"].ffill()

    return result


def validate_volume(df: pd.DataFrame) -> pd.DataFrame:
    """出来高データのバリデーション（負の値→0、欠損→0）"""
    if df.empty or "volume" not in df.columns:
        return df

    result = df.copy()
    result["volume"] = result["volume"].clip(lower=0).fillna(0).astype(int)
    return result


def validate_flow_scores(df: pd.DataFrame) -> pd.DataFrame:
    """フロースコアのバリデーション（-100〜100の範囲内にクリップ）"""
    if df.empty or "flow_score" not in df.columns:
        return df

    rules = VALIDATION_RULES["flow_score"]
    result = df.copy()
    result["flow_score"] = result["flow_score"].clip(
        lower=rules["min"], upper=rules["max"]
    )
    return result


def handle_market_holidays(df: pd.DataFrame) -> pd.DataFrame:
    """
    市場休場日の処理
    - 前営業日のデータを維持
    - フロー値は0に設定
    """
    if df.empty:
        return df

    result = df.copy()

    # 日付の欠落（休場日）を検出して補完
    for symbol in result["symbol"].unique():
        mask = result["symbol"] == symbol
        sdf = result.loc[mask].sort_values("date")

        if len(sdf) < 2:
            continue

        # 営業日の範囲を生成
        date_range = pd.bdate_range(
            start=sdf["date"].min(), end=sdf["date"].max()
        )

        # 欠落日を特定
        existing_dates = set(sdf["date"].dt.normalize())
        missing_dates = [d for d in date_range if d not in existing_dates]

        if missing_dates:
            logger.debug(f"{symbol}: {len(missing_dates)}営業日分のデータを補完")
            # 前日値で補完、フロー系は0
            for missing_date in missing_dates:
                prev = sdf[sdf["date"] < missing_date]
                if prev.empty:
                    continue
                last_row = prev.iloc[-1].copy()
                last_row["date"] = missing_date
                if "fund_flow" in last_row:
                    last_row["fund_flow"] = 0
                if "volume" in last_row:
                    last_row["volume"] = 0
                result = pd.concat(
                    [result, pd.DataFrame([last_row])], ignore_index=True
                )

    return result.sort_values(["symbol", "date"]).reset_index(drop=True)


def normalize_to_usd(df: pd.DataFrame, fx_rates: dict[str, float] | None = None) -> pd.DataFrame:
    """
    通貨をUSDに統一（現在は全データがUSD建てのため、将来の拡張用）
    """
    # 現在のMVPでは全ETFがUSD建てのため変換不要
    return df


def run_full_validation(
    etf_df: pd.DataFrame,
    flow_df: pd.DataFrame | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame | None]:
    """
    全バリデーションパイプラインを実行

    Returns:
        (validated_etf_df, validated_flow_df)
    """
    logger.info("データバリデーション開始")

    # ETFデータのバリデーション
    validated_etf = validate_prices(etf_df)
    validated_etf = validate_volume(validated_etf)

    removed_count = len(etf_df) - len(validated_etf)
    if removed_count > 0:
        logger.info(f"ETFデータ: {removed_count}レコード除外/修正")

    # フローデータのバリデーション
    validated_flow = None
    if flow_df is not None and not flow_df.empty:
        if "flow_score" in flow_df.columns:
            validated_flow = validate_flow_scores(flow_df)
        else:
            validated_flow = flow_df

    logger.info("データバリデーション完了")
    return validated_etf, validated_flow
