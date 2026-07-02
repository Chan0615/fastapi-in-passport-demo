#!/bin/bash
# ═════════════════════════════════════════════════
# 部署启动脚本
# 用法: bash deploy.sh [up|up-fast|down|restart|logs|clean]
#   up       - 完整构建+启动（依赖变更时用）
#   up-fast  - 代码变更后快速重启（跳过 docker build，10秒）
# ═════════════════════════════════════════════════
set -e

GIT_REPO="http://gitlab.ops.com/chenan02/fastapi-ant-demo.git"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_DIR/config/config.yaml"
BUILD_LOCK="$SCRIPT_DIR/.build_required"

ACTION="${1:-up-fast}"

export COMPOSE_PROJECT_NAME=fastapi-ant-demo

# ── Git 拉取 ──
pull_code() {
    echo "📦 拉取最新代码..."
    cd "$PROJECT_DIR"
    if [ ! -d ".git" ]; then
        echo "🆕 首次部署，克隆代码..."
        git clone "$GIT_REPO" "$PROJECT_DIR"
        echo "✅ 代码已克隆"
        touch "$BUILD_LOCK"
        return
    fi
    git pull origin main
    echo "✅ 代码已更新"
}

# ── 检查配置文件 ──
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

cd "$SCRIPT_DIR"

case "$ACTION" in
    up)
        pull_code
        echo "🚀 完整构建并启动..."
        docker compose up -d --build
        docker compose ps
        echo ""
        echo "💡 提示: 如果只是改代码没改依赖，下次用 bash deploy.sh up-fast 更快"
        ;;
    up-fast)
        pull_code
        echo "⚡ 快速重启（跳过 docker build）..."
        docker compose up -d
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
    clean)
        echo "🧹 清理旧镜像..."
        docker image prune -f
        docker builder prune -f
        ;;
    *)
        echo "用法: bash deploy.sh [up|up-fast|down|restart|logs|clean]"
        echo "  up       - 完整构建（改了 Dockerfile/package.json/requirements.txt 时用）"
        echo "  up-fast  - 快速重启（仅代码变更，默认）"
        exit 1
        ;;
esac
