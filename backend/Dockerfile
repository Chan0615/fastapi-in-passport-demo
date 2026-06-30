# 后端 Python 3.12 运行时
FROM python:3.12-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖（如有需要可扩展）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 先复制依赖，利用缓存层
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
# 启动配置 bootstrap.yaml 含数据库密码，不打进镜像，
# 运行时通过 docker-compose 挂载到 /app/bootstrap.yaml 或环境变量 DATABASE_URL 注入
COPY ./app ./app

# 暴露端口
EXPOSE 8000

# 启动 FastAPI（生产环境建议用 gunicorn + uvicorn worker）
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
