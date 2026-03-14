"""
アラートエンジン（タスク 2-2 / 2-10）
日次バッチ内でアラートルールをチェックし、閾値超過時に通知を生成

ルールの条件タイプ:
  - gt: フロー値が閾値を超過
  - lt: フロー値が閾値を下回る
  - abs_gt: フロー値の絶対値が閾値を超過（2σ検知等）
  - pct_change_gt: 前日比変化率が閾値を超過
"""

import logging
from datetime import datetime
from uuid import uuid4

import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def check_alert_rules(
    engine: Engine,
    regional_flows: pd.DataFrame,
    sector_flows: pd.DataFrame,
    asset_class_flows: pd.DataFrame,
) -> list[dict]:
    """
    全アクティブなアラートルールをチェックし、トリガーされたアラートを返す

    Returns:
        list[dict]: トリガーされたアラートのリスト
    """
    # アクティブなルールを取得
    rules = _get_active_rules(engine)
    if not rules:
        logger.info("アクティブなアラートルールなし")
        return []

    logger.info(f"アラートチェック: {len(rules)}ルール")

    # フローデータを統合
    all_flows = pd.concat(
        [regional_flows, sector_flows, asset_class_flows],
        ignore_index=True,
    )

    triggered: list[dict] = []

    for rule in rules:
        try:
            result = _evaluate_rule(rule, all_flows)
            if result:
                triggered.append(result)
        except Exception as e:
            logger.warning(f"ルール {rule['rule_name']} の評価エラー: {e}")

    # トリガーされたアラートをDBに書き込み
    if triggered:
        _write_triggered_alerts(engine, triggered)
        logger.info(f"アラート発火: {len(triggered)}件")
    else:
        logger.info("アラート発火なし")

    return triggered


def _get_active_rules(engine: Engine) -> list[dict]:
    """アクティブなアラートルールをDBから取得"""
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM alert_rules WHERE is_active = true")
            )
            return [dict(row._mapping) for row in result]
    except Exception as e:
        logger.error(f"アラートルール取得エラー: {e}")
        return []


def _evaluate_rule(rule: dict, flows: pd.DataFrame) -> dict | None:
    """
    個別ルールを評価
    条件を満たした場合にトリガーアラートを返す
    """
    if flows.empty:
        return None

    flow_type = rule["flow_type"]
    target_id = rule["target_id"]
    condition = rule["condition"]
    threshold = float(rule["threshold"])

    # 対象フローをフィルタ
    if target_id == "*":
        # ワイルドカード: 全対象をチェック
        target_flows = flows[flows["flow_type"] == flow_type]
    else:
        target_flows = flows[
            (flows["flow_type"] == flow_type) & (flows["target_id"] == target_id)
        ]

    if target_flows.empty:
        return None

    # 各対象に対してチェック
    for _, row in target_flows.iterrows():
        flow_value = row.get("flow_amount", 0) or 0
        flow_score = row.get("flow_score", 0) or 0

        is_triggered = False
        check_value = flow_score  # デフォルトはスコアで判定

        if condition == "gt":
            is_triggered = check_value > threshold
        elif condition == "lt":
            is_triggered = check_value < threshold
        elif condition == "abs_gt":
            is_triggered = abs(check_value) > threshold * 30  # σ換算
        elif condition == "pct_change_gt":
            pct = row.get("pct_change", row.get("flow_pct_change", 0)) or 0
            check_value = abs(float(pct))
            is_triggered = check_value > threshold

        if is_triggered:
            target = row.get("target_id", target_id)
            message = _generate_alert_message(
                rule["rule_name"], target, condition, threshold, check_value
            )

            return {
                "rule_id": rule["id"],
                "triggered_at": datetime.utcnow().isoformat(),
                "flow_value": float(check_value),
                "message": message,
            }

    return None


def _generate_alert_message(
    rule_name: str,
    target: str,
    condition: str,
    threshold: float,
    actual_value: float,
) -> str:
    """アラートメッセージを生成"""
    condition_labels = {
        "gt": "超過",
        "lt": "下回り",
        "abs_gt": "の絶対値が超過",
        "pct_change_gt": "の変化率が超過",
    }
    cond_text = condition_labels.get(condition, condition)

    return (
        f"[{rule_name}] {target}: "
        f"閾値{threshold:.1f}{cond_text} "
        f"(実測値: {actual_value:.2f})"
    )


def _write_triggered_alerts(engine: Engine, alerts: list[dict]) -> None:
    """トリガーされたアラートをDBに書き込み"""
    try:
        with engine.connect() as conn:
            for alert in alerts:
                conn.execute(
                    text("""
                        INSERT INTO alert_history (rule_id, triggered_at, flow_value, message)
                        VALUES (:rule_id, :triggered_at, :flow_value, :message)
                    """),
                    alert,
                )
            conn.commit()
    except Exception as e:
        logger.error(f"アラート書き込みエラー: {e}")
