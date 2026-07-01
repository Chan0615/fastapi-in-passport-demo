#!/bin/bash
# ═════════════════════════════════════════════════
# 部署启动脚本（自动拉取代码 + 部署）
# 用法：bash deploy.sh [up|down|restart|logs]
# ═════════════════════════════════════════════════
set -e

GIT_REPO="http://gitlab.ops.com/chenan02/fastapi-ant-demo.git"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_DIR/config/config.yaml"

ACTION="${1:-up}"

# ── Git 拉取 ──
pull_code() {
    echo "📦 拉取最新代码..."
    cd "$PROJECT_DIR"

    # 首次部署：clone
    if [ ! -d ".git" ]; then
        git clone "$GIT_REPO" "$PROJECT_DIR" 2>/dev/null || true
        if [ ! -d ".git" ]; then
            git clone "$GIT_REPO" "$PROJECT_DIR"
        fi
        echo "✅ 代码已克隆"
        return
    fi

    # 后续更新：pull
    git pull origin main
    echo "✅ 代码已更新"
}

# ── 检查 config.yaml ──
if [ ! -f "$CONFIG_FILE" ]; then
    if [ -f "$PROJECT_DIR/config/config.yaml.example" ]; then
        echo "📋 首次部署，创建 config.yaml ..."
        cp "$PROJECT_DIR/config/config.yaml.example" "$CONFIG_FILE"
        echo "⚠️  请编辑 $CONFIG_FILE 填入真实配置后重新运行"
        exit 1
    else
        echo "❌ 配置文件不存在: $CONFIG_FILE"
        exit 1
    fi
fi

# ── 从 config.yaml 提取 MySQL 配置 ──
echo "📖 读取 $CONFIG_FILE ..."

MYSQL_PASSWORD=$(grep 'db_password:' "$CONFIG_FILE" | head -1 | sed 's/.*db_password:\s*//; s/#.*//; s/^[[:space:]]*//; s/[[:space:]]*$//')
MYSQL_DATABASE=$(grep 'db_name:' "$CONFIG_FILE" | head -1 | sed 's/.*db_name:\s*//; s/#.*//; s/^[[:space:]]*//; s/[[:space:]]*$//')

if [ -z "$MYSQL_PASSWORD" ] || [ -z "$MYSQL_DATABASE" ]; then
    echo "❌ 无法从 config.yaml 提取 MySQL 配置，请检查文件格式"
    exit 1
fi

# ── 生成 .env ──
ENV_FILE="$SCRIPT_DIR/.env"
cat > "$ENV_FILE" <<EOF
# 自动生成，请勿手动编辑
MYSQL_PASSWORD=$MYSQL_PASSWORD
MYSQL_DATABASE=$MYSQL_DATABASE
EOF
echo "✅ 已生成 .env (MYSQL_DATABASE=$MYSQL_DATABASE)"

# ── 执行 ──
cd "$SCRIPT_DIR"

case "$ACTION" in
    up)
        pull_code
        echo "🚀 构建并启动服务..."
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
    logs)
        docker compose logs -f
        ;;
    *)
        echo "用法: bash deploy.sh [up|down|restart|logs]"
        exit 1
        ;;
esac
