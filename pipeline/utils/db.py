"""
データベース接続ユーティリティ
"""

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from pipeline.config import DATABASE_URL

logger = logging.getLogger(__name__)


def get_engine() -> Engine:
    """SQLAlchemy エンジンを取得"""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL が設定されていません")
    return create_engine(DATABASE_URL, pool_size=5, max_overflow=10)


def execute_sql(engine: Engine, sql: str, params: dict | None = None) -> None:
    """SQLを実行"""
    with engine.connect() as conn:
        conn.execute(text(sql), params or {})
        conn.commit()


def test_connection() -> bool:
    """DB接続テスト"""
    try:
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        logger.info("DB接続成功")
        return True
    except Exception as e:
        logger.error(f"DB接続失敗: {e}")
        return False
