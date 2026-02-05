#!/bin/bash
# Docker 镜像构建脚本

echo "构建 PoolClean Pro Docker 镜像..."

docker build -t poolclean-pro:latest .

if [ $? -eq 0 ]; then
    echo "✓ 镜像构建成功"
    echo "镜像信息:"
    docker images poolclean-pro:latest
else
    echo "✗ 镜像构建失败"
    exit 1
fi
