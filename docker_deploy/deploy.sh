#!/bin/bash
# ═════════════════════════════════════════════════
# 部署启动脚本
# 从 config/config.yaml 提取 MySQL 配置，生成 .env，再启动 docker-compose
# 用法：bash deploy.sh [up|down|restart|logs|build]
# ═════════════════════════════════════════════════
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_DIR/config/config.yaml"

# ── 检查 config.yaml ──
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ 配置文件不存在: $CONFIG_FILE"
    echo "   请先复制: cp config/config.yaml.example config/config.yaml"
    exit 1
fi

# ── 从 config.yaml 提取 MySQL 配置 ──
echo "📖 读取 $CONFIG_FILE ..."

MYSQL_PASSWORD=$(python3 -c "
import yaml
with open('$CONFIG_FILE') as f:
    cfg = yaml.safe_load(f)
print(cfg['mysql']['system_default_db']['db_password'])
")

MYSQL_DATABASE=$(python3 -c "
import yaml
with open('$CONFIG_FILE') as f:
    cfg = yaml.safe_load(f)
print(cfg['mysql']['system_default_db']['db_name'])
")

# ── 生成 .env ──
ENV_FILE="$SCRIPT_DIR/.env"
cat > "$ENV_FILE" <<EOF
# 自动生成，请勿手动编辑，修改 config/config.yaml 后重新运行 deploy.sh
MYSQL_PASSWORD=$MYSQL_PASSWORD
MYSQL_DATABASE=$MYSQL_DATABASE
EOF
echo "✅ 已生成 .env (MYSQL_DATABASE=$MYSQL_DATABASE)"

# ── 执行 docker-compose 命令 ──
ACTION="${1:-up}"
cd "$SCRIPT_DIR"

case "$ACTION" in
    up)
        echo "🚀 启动服务..."
        docker compose up -d --build
        echo ""
        docker compose ps
        ;;
    down)
        echo "🛑 停止服务..."
        docker compose down
        ;;
    restart)
        echo "🔄 重启服务..."
        docker compose restart
        ;;
    build)
        echo "🔨 重新构建..."
        docker compose up -d --build
        ;;
    logs)
        docker compose logs -f
        ;;
    *)
        echo "用法: bash deploy.sh [up|down|restart|build|logs]"
        exit 1
        ;;
esac
