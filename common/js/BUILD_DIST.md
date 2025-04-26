# 构建 npm 安装包指南

本文档说明如何构建一个可以通过 `npm install` 直接安装的 A2A Client 包。

## 准备环境

确保你已安装:
- Node.js 14+
- npm 6+

## 构建步骤

### 1. 使用自动化脚本 (推荐)

```bash
# 进入项目目录
cd common/js

# 给脚本执行权限
chmod +x ./build.sh

# 执行构建脚本
./build.sh
```

脚本将自动:
1. 安装所有依赖
2. 检查 TypeScript 错误
3. 清理构建目录
4. 构建所有格式的输出
5. 移除示例文件
6. 创建 .tgz 格式的 npm 包并存放在 release 目录中

### 2. 手动构建

```bash
# 进入项目目录
cd common/js

# 安装依赖
npm install

# 清理之前的构建
npm run clean

# 构建所有版本
npm run build:all

# 创建 release 目录
mkdir -p release

# 打包并移动到 release 目录
npm pack
mv *.tgz release/
```

## 输出文件

成功构建后，你将获得以下文件:
- `release/a2a-client-1.0.0.tgz` - 可通过 npm 安装的压缩包

## 安装和测试

可以通过以下方式安装和测试此包:

### 直接从文件安装

```bash
npm install ./release/a2a-client-1.0.0.tgz
```

### 作为本地依赖安装

在其他项目中:

```bash
npm install /path/to/a2a-client/release/a2a-client-1.0.0.tgz
```

### 发布到 npm (可选)

如果你想发布此包到 npm 仓库:

```bash
# 登录到 npm (如果尚未登录)
npm login

# 发布包
npm publish release/a2a-client-1.0.0.tgz
```

## 包含的文件

构建的包将包含:
- `dist/client.js` - CommonJS 版本
- `dist/client.esm.js` - ES 模块版本
- `dist/client.browser.js` - 浏览器 UMD 版本
- `dist/client.d.ts` - TypeScript 类型定义
- `README.md` - 使用说明
- `LICENSE` - MIT 许可证

## 故障排除

如果构建过程中出现问题:

1. 检查是否有 TypeScript 错误
   ```bash
   npx tsc --noEmit
   ```

2. 确保 package.json 中的依赖版本兼容
   ```bash
   npm ls
   ```

3. 尝试清理 npm 缓存
   ```bash
   npm cache clean --force
   ``` 