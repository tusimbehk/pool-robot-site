#!/bin/bash
# Docker 容器运行脚本

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}启动 PoolClean Pro 容器...${NC}"

# 检查容器是否已存在
if [ "$(docker ps -q -f name=poolclean-pro)" ]; then
    echo -e "${YELLOW}停止现有容器...${NC}"
    docker stop poolclean-pro
fi

if [ "$(docker ps -aq -f name=poolclean-pro)" ]; then
    echo -e "${YELLOW}删除现有容器...${NC}"
    docker rm poolclean-pro
fi

# 运行新容器
docker run -d \
  --name poolclean-pro \
  -p 3000:3000 \
  --restart unless-stopped \
  -e NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="${SHOPIFY_STORE_DOMAIN}" \
  -e NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN="${SHOPIFY_STOREFRONT_ACCESS_TOKEN}" \
  -e NEXT_PUBLIC_SEGMENT_WRITE_KEY="${SEGMENT_WRITE_KEY}" \
  -e NEXT_PUBLIC_GA4_MEASUREMENT_ID="${GA4_MEASUREMENT_ID}" \
  -e NEXT_PUBLIC_META_PIXEL_ID="${META_PIXEL_ID}" \
  -e NEXT_PUBLIC_SENTRY_DSN="${SENTRY_DSN}" \
  poolclean-pro:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 容器启动成功${NC}"
    echo -e "${GREEN}访问地址: http://localhost:3000${NC}"
    echo ""
    echo "查看日志:"
    echo "  docker logs -f poolclean-pro"
    echo ""
    echo "停止容器:"
    echo "  docker stop poolclean-pro"
    echo ""
    echo "重启容器:"
    echo "  docker restart poolclean-pro"
else
    echo -e "${RED}✗ 容器启动失败${NC}"
    exit 1
fi
