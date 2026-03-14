FROM python:3.12-slim

WORKDIR /app

# 依存パッケージインストール
COPY pipeline/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# パイプラインコードコピー
COPY pipeline/ ./pipeline/

# 環境変数（Railway で設定）
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

CMD ["python", "-m", "pipeline.main"]
