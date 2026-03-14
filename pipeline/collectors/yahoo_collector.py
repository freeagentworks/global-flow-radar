"""
Yahoo Finance データコレクター（DS-001）
ETF価格・出来高・AUMデータの取得
"""

import logging
from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf

from pipeline.config import (
    REGIONAL_ETFS,
    SECTOR_ETFS,
    ASSET_CLASS_ETFS,
    RISK_TICKERS,
    get_all_tickers,
)

logger = logging.getLogger(__name__)


def fetch_etf_data(period: str = "5d") -> pd.DataFrame:
    """
    全ETFの価格・出来高データを一括取得

    Args:
        period: 取得期間（yfinance形式: 1d, 5d, 1mo, 3mo, 1y等）

    Returns:
        DataFrame: symbol, date, open, high, low, close, volume, adj_close
    """
    tickers = get_all_tickers()
    logger.info(f"{len(tickers)}銘柄のデータを取得開始 (期間: {period})")

    try:
        # バッチで一括取得（API呼び出し数を削減）
        data = yf.download(
            tickers=tickers,
            period=period,
            group_by="ticker",
            auto_adjust=True,
            threads=True,
        )

        if data.empty:
            logger.warning("Yahoo Financeからデータが取得できませんでした")
            return pd.DataFrame()

        # 長形式に変換
        records = []
        for ticker in tickers:
            try:
                if len(tickers) == 1:
                    ticker_data = data
                else:
                    ticker_data = data[ticker]

                if ticker_data.empty:
                    continue

                for date, row in ticker_data.iterrows():
                    records.append({
                        "symbol": ticker,
                        "date": date,
                        "open": float(row.get("Open", 0) or 0),
                        "high": float(row.get("High", 0) or 0),
                        "low": float(row.get("Low", 0) or 0),
                        "close": float(row.get("Close", 0) or 0),
                        "volume": int(row.get("Volume", 0) or 0),
                    })
            except (KeyError, TypeError) as e:
                logger.warning(f"{ticker}のデータ解析失敗: {e}")
                continue

        df = pd.DataFrame(records)
        logger.info(f"{len(df)}レコード取得完了")
        return df

    except Exception as e:
        logger.error(f"Yahoo Financeデータ取得エラー: {e}")
        return pd.DataFrame()


def fetch_etf_info(symbols: list[str]) -> list[dict]:
    """
    ETFの基本情報（名前、AUM、経費率等）を取得

    Args:
        symbols: ティッカーシンボルのリスト

    Returns:
        list[dict]: ETF情報のリスト
    """
    results = []
    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            results.append({
                "symbol": symbol,
                "name": info.get("longName", info.get("shortName", symbol)),
                "aum": info.get("totalAssets"),
                "expense_ratio": info.get("annualReportExpenseRatio"),
                "category": info.get("category", ""),
                "nav": info.get("navPrice"),
            })
        except Exception as e:
            logger.warning(f"{symbol}の情報取得失敗: {e}")
            results.append({"symbol": symbol, "name": symbol})

    return results


def estimate_fund_flow(df: pd.DataFrame) -> pd.DataFrame:
    """
    ETF資金フローを推計

    推計ロジック（03_data-sources.md）:
    Flow_proxy = Volume * Price * flow_direction_signal
    flow_direction = sign(price_change) を考慮した近似

    実際のフロー = AUM(t) - AUM(t-1) * (Price(t) / Price(t-1))
    AUM不明のため出来高ベースの近似を使用

    Args:
        df: fetch_etf_dataの戻り値

    Returns:
        DataFrame: symbol, date, fund_flow (百万USD推計), price, volume
    """
    if df.empty:
        return pd.DataFrame()

    results = []
    for symbol in df["symbol"].unique():
        sdf = df[df["symbol"] == symbol].sort_values("date").copy()

        if len(sdf) < 2:
            continue

        # 前日比リターン
        sdf["return"] = sdf["close"].pct_change()
        # 出来高の変化率
        sdf["vol_change"] = sdf["volume"].pct_change()

        for i in range(1, len(sdf)):
            row = sdf.iloc[i]
            prev = sdf.iloc[i - 1]

            price = row["close"]
            volume = row["volume"]
            ret = row["return"] if pd.notna(row["return"]) else 0
            vol_change = row["vol_change"] if pd.notna(row["vol_change"]) else 0

            # フロー推計: 出来高増加 + 価格上昇 = 流入サイン
            # 出来高はドル換算し百万USD単位に変換
            dollar_volume = price * volume / 1_000_000

            # フロー方向シグナル: 価格上昇時に出来高増加なら流入
            if vol_change > 0.1 and ret > 0:
                flow_signal = 1.0
            elif vol_change > 0.1 and ret < 0:
                flow_signal = -0.5  # 出来高増+下落 = 売り圧力
            elif vol_change < -0.1 and ret > 0:
                flow_signal = 0.3  # 出来高減+上昇 = 限定的買い
            elif vol_change < -0.1 and ret < 0:
                flow_signal = -0.3  # 出来高減+下落 = 限定的売り
            else:
                flow_signal = ret * 10  # 小さな変動はリターンに比例

            # 推計フロー（百万USD）
            estimated_flow = dollar_volume * flow_signal * 0.01

            results.append({
                "symbol": symbol,
                "date": row["date"],
                "fund_flow": round(estimated_flow, 2),
                "price": price,
                "volume": volume,
                "price_change_pct": round(ret * 100, 4) if pd.notna(ret) else 0,
            })

    return pd.DataFrame(results)


def get_region_for_etf(symbol: str) -> str | None:
    """ETFティッカーから地域コードを取得"""
    for region, etfs in REGIONAL_ETFS.items():
        if symbol in etfs:
            return region
    return None


def get_sector_for_etf(symbol: str) -> str | None:
    """ETFティッカーからセクターIDを取得"""
    for sector, etfs in SECTOR_ETFS.items():
        if symbol in etfs:
            return sector
    return None


def get_asset_class_for_etf(symbol: str) -> str | None:
    """ETFティッカーから資産クラスIDを取得"""
    for asset_class, etfs in ASSET_CLASS_ETFS.items():
        if symbol in etfs:
            return asset_class
    return None
