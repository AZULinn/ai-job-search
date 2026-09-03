#!/bin/bash
cd "$(dirname "$0")"

echo "========================================="
echo "   Ai Job Search - 智能求职平台"
echo "========================================="
echo ""

if [ ! -d "node_modules" ]; then
  echo "正在安装依赖，请稍候..."
  npm install
  echo ""
fi

echo "正在启动服务..."
echo "浏览器将自动打开 http://localhost:3000"
echo "按 Ctrl+C 可停止服务"
echo ""

open http://localhost:3000
npm run dev
