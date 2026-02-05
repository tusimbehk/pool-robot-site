#!/bin/bash
# PoolClean Pro 部署脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# 项目路径
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$PROJECT_DIR/packages/web"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PoolClean Pro 部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查环境变量
if [ ! -f "$WEB_DIR/.env.local" ]; then
    echo -e "${RED}✗ 未找到 .env.local 文件${NC}"
    echo -e "${YELLOW}请先创建 .env.local 并填写配置${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 环境变量文件存在${NC}"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}正在安装 pnpm...${NC}"
    npm install -g pnpm
fi

echo -e "${GREEN}✓ pnpm 已安装${NC}"

# 选择部署方式
echo ""
echo "请选择部署方式:"
echo "  1) Vercel (推荐)"
echo "  2) Docker"
echo "  3) 本地开发"
echo ""
read -p "请输入选项 [1-3]: " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}部署到 Vercel...${NC}"
        
        if ! command -v vercel &> /dev/null; then
            pnpm add -g vercel
        fi
        
        cd "$WEB_DIR"
        vercel login
        vercel
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}使用 Docker 部署...${NC}"
        
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}✗ Docker 未安装${NC}"
            exit 1
        fi
        
        cd "$WEB_DIR"
        docker build -t poolclean-pro:latest .
        ;;
        
    3)
        echo ""
        echo -e "${BLUE}启动本地开发服务器...${NC}"
        cd "$PROJECT_DIR"
        pnpm install
        cd "$WEB_DIR"
        pnpm dev
        ;;
        
    *)
        echo -e "${RED}✗ 无效选项${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}部署完成！${NC}"
