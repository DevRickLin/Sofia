#!/bin/bash
# A2A Client 构建和打包脚本

# 输出彩色文本的函数
print_green() {
  echo -e "\033[0;32m$1\033[0m"
}

print_yellow() {
  echo -e "\033[0;33m$1\033[0m" 
}

print_red() {
  echo -e "\033[0;31m$1\033[0m"
}

# 确保脚本在 common/js 目录下执行
if [ ! -f "./client.ts" ]; then
  print_red "错误: 未找到 client.ts 文件"
  print_yellow "请在 common/js 目录下运行此脚本"
  exit 1
fi

# 创建 dist 目录（如果不存在）
print_yellow "创建 dist 目录..."
mkdir -p dist

# 创建 release 目录（如果不存在）
print_yellow "创建 release 目录..."
mkdir -p release

# 安装依赖
print_yellow "安装依赖..."
npm install

# 检查是否有 TypeScript 错误
print_yellow "检查 TypeScript 错误..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  print_red "TypeScript 错误，请修复后再构建"
  exit 1
fi

# 清理目标目录
print_yellow "清理 dist 目录..."
npm run clean

# 运行构建
print_yellow "执行完整构建..."
npm run build:all

# 检查构建结果
if [ -f "./dist/client.js" ] && [ -f "./dist/client.d.ts" ]; then
  print_green "✓ CommonJS 版本构建成功"
else
  print_red "× CommonJS 版本构建失败"
  exit 1
fi

if [ -f "./dist/client.esm.js" ]; then
  print_green "✓ ESM 版本构建成功"
else
  print_red "× ESM 版本构建失败"
  exit 1
fi

if [ -f "./dist/client.browser.js" ]; then
  print_green "✓ 浏览器版本构建成功"
else
  print_red "× 浏览器版本构建失败"
  exit 1
fi

# 列出构建结果
print_yellow "构建输出:"
ls -la dist/

# 移除任何已有的测试或示例文件
print_yellow "移除示例文件..."
rm -rf examples

# 清理 release 目录中的旧包
print_yellow "清理 release 目录中的旧包..."
rm -f release/*.tgz

# 创建包
print_yellow "创建 npm 包..."
npm pack

# 移动包到 release 目录
PACKAGE_FILE=$(ls *.tgz 2>/dev/null | head -n 1)
if [ -n "$PACKAGE_FILE" ]; then
  print_yellow "移动包到 release 目录..."
  mv "$PACKAGE_FILE" release/
  PACKAGE_FILE="release/$PACKAGE_FILE"
else
  print_red "未找到生成的 npm 包"
  exit 1
fi

# 显示结果
if [ -f "$PACKAGE_FILE" ]; then
  print_green "✓ 成功创建 npm 包: $PACKAGE_FILE"
  print_yellow "你可以使用以下命令安装此包:"
  print_yellow "  npm install $PACKAGE_FILE"
else
  print_red "× 创建 npm 包失败"
  exit 1
fi

print_green "构建完成!" 