"""
Global Flow Radar - データパイプライン メインオーケストレーター
日次バッチ処理の全工程を管理

実行スケジュール（03_data-sources.md 2節）:
  JST 06:30 Yahoo Finance データ取得
  JST 06:45 FRED データ取得
  JST 07:00 フロー推計エンジン実行
  JST 07:15 アラートエンジン実行
  JST 07:20 Redis キャッシュ更新
"""

import logging
import sys
from datetime import datetime

from pipeline.collectors.yahoo_collector import fetch_etf_data, estimate_fund_flow
from pipeline.collectors.fred_collector import fetch_fred_data, get_latest_indicators, get_fx_data
from pipeline.collectors.cot_collector import fetch_cot_data, interpolate_weekly_to_daily
from pipeline.processors.normalizer import run_full_validation
from pipeline.engine.flow_calculator import (
    calculate_regional_flows,
    calculate_sector_flows,
    calculate_asset_class_flows,
    calculate_risk_indicators,
)
from pipeline.processors.db_writer import (
    write_etf_flows,
    write_daily_flows,
    write_macro_indicators,
    write_cot_positions,
)
from pipeline.engine.alert_checker import check_alert_rules
from pipeline.utils.db import get_engine, test_connection

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def run_daily_pipeline() -> dict:
    """
    日次パイプラインを実行

    Returns:
        dict: 実行結果のサマリー
    """
    start_time = datetime.now()
    logger.info("=" * 60)
    logger.info("Global Flow Radar - 日次パイプライン開始")
    logger.info(f"実行時刻: {start_time.isoformat()}")
    logger.info("=" * 60)

    results = {
        "start_time": start_time.isoformat(),
        "steps": {},
        "errors": [],
    }

    # --- Step 1: データベース接続確認 ---
    logger.info("[Step 1/6] データベース接続確認")
    try:
        engine = get_engine()
        if not test_connection():
            results["errors"].append("DB接続失敗")
            logger.error("DB接続失敗。パイプラインを中断します。")
            return results
        results["steps"]["db_connection"] = "success"
    except Exception as e:
        logger.error(f"DB接続エラー: {e}")
        results["errors"].append(f"DB接続エラー: {e}")
        # DB接続なしでもデータ取得は進める
        engine = None

    # --- Step 2: Yahoo Finance データ取得 ---
    logger.info("[Step 2/6] Yahoo Finance データ取得")
    try:
        etf_data = fetch_etf_data(period="5d")
        etf_flows = estimate_fund_flow(etf_data)
        results["steps"]["yahoo_finance"] = {
            "raw_records": len(etf_data),
            "flow_records": len(etf_flows),
        }
        logger.info(f"  ETFデータ: {len(etf_data)}件, フロー推計: {len(etf_flows)}件")
    except Exception as e:
        logger.error(f"Yahoo Financeデータ取得エラー: {e}")
        results["errors"].append(f"Yahoo Finance: {e}")
        etf_data = __import__("pandas").DataFrame()
        etf_flows = __import__("pandas").DataFrame()

    # --- Step 3: FRED データ取得 ---
    logger.info("[Step 3/6] FRED データ取得")
    try:
        fred_data = fetch_fred_data(lookback_days=7)
        risk_data = get_latest_indicators()
        fx_data = get_fx_data(fred_data) if not fred_data.empty else None
        results["steps"]["fred"] = {
            "records": len(fred_data),
            "indicators": len(risk_data),
        }
        logger.info(f"  FREDデータ: {len(fred_data)}件, 指標: {len(risk_data)}件")
    except Exception as e:
        logger.error(f"FREDデータ取得エラー: {e}")
        results["errors"].append(f"FRED: {e}")
        fred_data = __import__("pandas").DataFrame()
        risk_data = {}
        fx_data = None

    # --- Step 4: COT データ取得（週次） ---
    logger.info("[Step 4/6] CFTC COT データ取得")
    try:
        cot_data = fetch_cot_data()
        cot_daily = interpolate_weekly_to_daily(cot_data) if not cot_data.empty else cot_data
        results["steps"]["cot"] = {
            "weekly_records": len(cot_data),
            "daily_records": len(cot_daily),
        }
        logger.info(f"  COTデータ: {len(cot_data)}件, 日次補完: {len(cot_daily)}件")
    except Exception as e:
        logger.error(f"COTデータ取得エラー: {e}")
        results["errors"].append(f"COT: {e}")
        cot_data = __import__("pandas").DataFrame()
        cot_daily = __import__("pandas").DataFrame()

    # --- Step 5: データバリデーション & フロー推計 ---
    logger.info("[Step 5/6] データバリデーション & フロー推計")
    try:
        # バリデーション
        validated_etf, validated_flows = run_full_validation(etf_data, etf_flows)

        # 地域間フロー推計
        regional_flows = calculate_regional_flows(
            validated_flows if validated_flows is not None else etf_flows,
            fx_data=fx_data,
            cot_data=cot_data,
        )

        # セクターフロー推計
        sector_flows = calculate_sector_flows(
            validated_flows if validated_flows is not None else etf_flows
        )

        # 資産クラスフロー推計
        asset_class_flows = calculate_asset_class_flows(
            validated_flows if validated_flows is not None else etf_flows,
            risk_data=risk_data,
        )

        # リスク指標
        risk_indicators = calculate_risk_indicators(risk_data)

        results["steps"]["flow_calculation"] = {
            "regional": len(regional_flows),
            "sector": len(sector_flows),
            "asset_class": len(asset_class_flows),
            "risk": risk_indicators.get("risk_label", "unknown"),
        }
        logger.info(
            f"  フロー推計: 地域{len(regional_flows)}件, "
            f"セクター{len(sector_flows)}件, "
            f"資産クラス{len(asset_class_flows)}件"
        )
    except Exception as e:
        logger.error(f"フロー推計エラー: {e}")
        results["errors"].append(f"フロー推計: {e}")
        regional_flows = __import__("pandas").DataFrame()
        sector_flows = __import__("pandas").DataFrame()
        asset_class_flows = __import__("pandas").DataFrame()

    # --- Step 6: データベース書き込み ---
    logger.info("[Step 6/7] データベース書き込み")
    if engine:
        try:
            import pandas as pd

            # ETFフロー書き込み
            etf_count = write_etf_flows(engine, etf_flows)

            # 日次フロー書き込み（地域 + セクター + 資産クラス）
            all_flows = pd.concat(
                [regional_flows, sector_flows, asset_class_flows],
                ignore_index=True,
            )
            flow_count = write_daily_flows(engine, all_flows)

            # マクロ指標書き込み
            macro_count = write_macro_indicators(engine, fred_data)

            # COTポジション書き込み
            cot_count = write_cot_positions(engine, cot_data)

            results["steps"]["db_write"] = {
                "etf_flows": etf_count,
                "daily_flows": flow_count,
                "macro_indicators": macro_count,
                "cot_positions": cot_count,
            }
        except Exception as e:
            logger.error(f"DB書き込みエラー: {e}")
            results["errors"].append(f"DB書き込み: {e}")
    else:
        logger.warning("DB接続なし。書き込みをスキップ。")
        results["steps"]["db_write"] = "skipped"

    # --- Step 7: アラートチェック ---
    logger.info("[Step 7/7] アラートルールチェック")
    if engine:
        try:
            triggered_alerts = check_alert_rules(
                engine, regional_flows, sector_flows, asset_class_flows
            )
            results["steps"]["alert_check"] = {
                "triggered": len(triggered_alerts),
            }
        except Exception as e:
            logger.error(f"アラートチェックエラー: {e}")
            results["errors"].append(f"アラートチェック: {e}")
    else:
        results["steps"]["alert_check"] = "skipped"

    # --- 完了 ---
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    results["end_time"] = end_time.isoformat()
    results["duration_seconds"] = round(duration, 2)
    results["status"] = "success" if not results["errors"] else "partial"

    logger.info("=" * 60)
    logger.info(f"パイプライン完了 (所要時間: {duration:.1f}秒)")
    if results["errors"]:
        logger.warning(f"エラー: {len(results['errors'])}件")
        for err in results["errors"]:
            logger.warning(f"  - {err}")
    logger.info("=" * 60)

    return results


if __name__ == "__main__":
    result = run_daily_pipeline()
    if result.get("errors"):
        sys.exit(1)
