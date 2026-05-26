# AI Try-On MVP

Web/H5 版 AI 服装试衣 MVP 平台。用户上传服装图，上传本人照片或选择内置 AI 模特，选择服装类型和图片比例后创建试衣任务。当前支持 mock AI 和 FASHN AI provider，图片上传支持 local 和腾讯云 COS。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- 腾讯云 COS / 本地图片存储
- FASHN AI / Mock AI provider

## 本地运行

```bash
cd /d D:\aiTryClothes
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

访问：

```text
http://localhost:3000
```

如果 PostgreSQL 没有启动：

```powershell
Start-Service postgresql-x64-16
```

## 环境变量

项目根目录创建 `.env`：

```env
DATABASE_URL=
STORAGE_PROVIDER=cos

# Tencent Cloud COS
COS_SECRET_ID=
COS_SECRET_KEY=
COS_BUCKET=
COS_REGION=
COS_PUBLIC_BASE_URL=

# FASHN AI
AI_PROVIDER=fashn
FASHN_API_KEY=
FASHN_API_BASE_URL=https://api.fashn.ai
FASHN_MODEL_NAME=
FASHN_POLL_INTERVAL_MS=
FASHN_POLL_TIMEOUT_MS=

# Single Admin Login
ADMIN_USERNAME=
ADMIN_PASSWORD=
SESSION_SECRET=

# Public app URL
NEXT_PUBLIC_APP_URL=
```

不要把 `.env`、`COS_SECRET_ID`、`COS_SECRET_KEY` 或 `FASHN_API_KEY` 提交到 Git。
也不要提交 `ADMIN_PASSWORD` 或 `SESSION_SECRET`。

## 数据库

生成 Prisma Client：

```bash
npm run prisma:generate
```

执行迁移：

```bash
npm run prisma:migrate -- --name init
```

生产环境不要使用 `prisma migrate dev`。生产或测试环境应使用已有迁移：

```bash
npx prisma migrate deploy
```

本次 FASHN 产品化加固新增了任务排查字段：

- `externalPredictionId`
- `rawResponse`
- `startedAt`
- `quality`

迁移命令：

```bash
npm run prisma:migrate -- --name add_fashn_task_metadata
```

质量模式字段迁移：

```bash
npm run prisma:migrate -- --name add_tryon_quality
```

初始化内置 AI 模特：

```bash
npm run prisma:seed
```

## 项目目录

```text
app/api/upload/             图片上传 API
app/api/try-on/             创建试衣任务 API
app/api/tasks/              任务列表与详情 API
app/api/models/             内置 AI 模特 API
app/api/dev/fashn-health/   FASHN 开发环境配置自检
app/try-on/                 上传试衣页
app/tasks/[id]/             任务详情页
app/history/                历史记录页
app/admin/                  后台任务管理页
components/                 通用 UI 组件
lib/ai/                     AI provider 架构
lib/storage/                图片存储 provider 架构
lib/url/                    URL 校验工具
prisma/                     Prisma schema 和 seed
```

## API 返回格式

成功：

```json
{
  "success": true,
  "data": {}
}
```

失败：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "用户可读的错误提示"
  }
}
```

## 管理员登录

当前阶段只支持单管理员账号，不开放普通用户注册，不做多用户系统。

`.env` 需要配置：

```env
ADMIN_USERNAME=你的管理员账号
ADMIN_PASSWORD=你的管理员密码
SESSION_SECRET=一段足够长的随机字符串
```

访问登录页：

```text
http://localhost:3000/login
```

登录成功后跳转 `/try-on`。未登录时无法访问：

- `/try-on`
- `/history`
- `/admin`
- `/tasks/[id]`

未登录调用上传、生成、任务、模特等 API 会返回：

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "请先登录"
  }
}
```

导航栏的“退出登录”会调用 `POST /api/auth/logout` 并清除 httpOnly session cookie。

## AI Provider

mock 模式：

```env
AI_PROVIDER=mock
```

mock 模式不调用真实 AI，等待 2-3 秒后返回 `/mock/result-placeholder.jpg`，适合本地开发和页面联调。

FASHN 模式：

```env
AI_PROVIDER=fashn
FASHN_API_KEY=你的 FASHN API Key
FASHN_API_BASE_URL=https://api.fashn.ai
FASHN_MODEL_NAME=tryon-v1.6
FASHN_POLL_INTERVAL_MS=3000
FASHN_POLL_TIMEOUT_MS=120000
```

FASHN provider 使用官方 TypeScript SDK 的 `predictions.subscribe`，会自动提交任务、轮询状态并返回最终结果。任务会保存：

- `provider = fashn`
- `externalPredictionId`
- `rawResponse`
- `errorMessage`
- `startedAt`
- `finishedAt`
- `quality`

当前 FASHN 参数映射：

- T恤、衬衫、卫衣、外套 -> `category=tops`
- 裤子、裙子 -> `category=bottoms`
- 连衣裙 -> `category=one-pieces`
- 1:1、3:4、4:5、9:16 -> `aspect_ratio`
- 速度优先 -> `mode=performance`
- 质量优先 -> `mode=quality`

FASHN 返回结果图后，后端会下载 FASHN output URL，并通过 storage provider 上传到 `results/` 目录。`TryOnTask.resultImageUrl` 优先保存我们自己的 COS URL，`rawResponse` 中保留 FASHN 原始 output URL，便于排查。

如果结果图回存 COS 失败，任务不会被判定为 FASHN 生成失败。系统会暂时保存 FASHN 原始结果 URL，并在 `errorMessage` / `rawResponse.persistResultError` 中记录“结果图回存 COS 失败”。

## 图片 URL 要求

真实 FASHN API 需要公网可访问图片 URL。以下 URL 不能用于 FASHN：

- `/uploads/xxx`
- `localhost`
- `127.0.0.1`
- `0.0.0.0`
- `file://`
- `blob:`
- `data:`

如果使用 `AI_PROVIDER=fashn`，请同时使用腾讯云 COS：

```env
STORAGE_PROVIDER=cos
```

## 腾讯云 COS

COS 配置示例：

```env
STORAGE_PROVIDER=cos
COS_SECRET_ID=your-secret-id
COS_SECRET_KEY=your-secret-key
COS_BUCKET=ai-tryon-1250000000
COS_REGION=ap-guangzhou
COS_PUBLIC_BASE_URL=https://ai-tryon-1250000000.cos.ap-guangzhou.myqcloud.com
```

测试上传：

```bash
curl -X POST ^
  -F "folder=garment" ^
  -F "file=@D:\aiTryClothes\public\mock\result-placeholder.jpg;type=image/jpeg" ^
  http://localhost:3000/api/upload
```

如果返回的 `data.url` 是 `https://xxx-1250000000.cos.ap-guangzhou.myqcloud.com/...`，说明已切到 COS。把 URL 放到无痕浏览器打开，或执行：

```bash
curl -I "https://xxx-1250000000.cos.ap-guangzhou.myqcloud.com/garments/2026/05/example.jpg"
```

如果返回 `200` 且 `Content-Type` 是图片类型，说明公网可访问。如果是 `403` 或 `AccessDenied`，通常是存储桶或对象权限不是公有读。如果 URL 仍是 `localhost` 或 `/uploads/xxx`，说明还在 local 模式，不能用于真实 FASHN API。

## 测试真实 FASHN 流程

1. `.env` 设置：

```env
STORAGE_PROVIDER=cos
AI_PROVIDER=fashn
FASHN_API_KEY=你的 FASHN API Key
```

2. 重启服务：

```bash
npm run dev
```

3. 打开 `/try-on`。
4. 上传服装图和人物图，确认上传接口返回 COS 公网 URL。
5. 点击生成。
6. 成功后会跳转 `/tasks/[id]` 并显示 FASHN 结果图。
7. 如果失败，打开 `/tasks/[id]`、`/history` 或 `/admin` 查看任务状态；失败原因保存在 `TryOnTask.errorMessage`。

## FASHN 配置自检

仅开发环境可访问：

```bash
curl http://localhost:3000/api/dev/fashn-health
```

返回示例：

```json
{
  "success": true,
  "data": {
    "hasApiKey": true,
    "baseUrlConfigured": true,
    "modelName": "tryon-v1.6"
  }
}
```

接口不会返回 API Key 明文。

## 公网部署

推荐部署方式：

- Vercel 部署 Next.js 页面和 API Route。
- PostgreSQL 使用云数据库，例如 Railway PostgreSQL、Render PostgreSQL、Supabase、Neon 或云厂商 RDS。
- 图片存储使用腾讯云 COS，并确保上传对象可以通过公网 HTTPS URL 访问。

生产环境必须配置：

```env
DATABASE_URL=
STORAGE_PROVIDER=cos
COS_SECRET_ID=
COS_SECRET_KEY=
COS_BUCKET=
COS_REGION=
COS_PUBLIC_BASE_URL=
AI_PROVIDER=fashn
FASHN_API_KEY=
FASHN_API_BASE_URL=https://api.fashn.ai
FASHN_MODEL_NAME=tryon-v1.6
FASHN_POLL_INTERVAL_MS=3000
FASHN_POLL_TIMEOUT_MS=120000
ADMIN_USERNAME=
ADMIN_PASSWORD=
SESSION_SECRET=
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

服务端密钥不要使用 `NEXT_PUBLIC_` 前缀。当前只有 `NEXT_PUBLIC_APP_URL` 是公开变量，用于记录应用公网地址。

Vercel 配置方式：

1. 推送代码到 Git 仓库。
2. 在 Vercel 导入项目。
3. 在 Project Settings -> Environment Variables 添加上述环境变量。
4. Build Command 使用默认 `npm run build`，该脚本会先执行 `prisma generate`。
5. 部署前或部署后在可访问数据库的环境运行：

```bash
npx prisma migrate deploy
```

如果使用 Vercel，建议在本地或 CI 中对生产数据库执行 `npx prisma migrate deploy`，不要在生产上运行 `prisma migrate dev`。

部署后验证：

1. 打开 `NEXT_PUBLIC_APP_URL`，确认首页能访问。
2. 打开 `/login`，使用 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 登录。
3. 未登录打开 `/try-on` 应跳转 `/login`。
4. 登录后进入 `/try-on` 上传图片，确认返回 COS URL。
5. 创建 FASHN 任务，确认 `/tasks/[id]` 显示结果图。
6. 打开 `/admin`，确认 provider、状态、错误信息可排查。

其他设备访问：

- 使用部署平台提供的 HTTPS 域名或你绑定的自定义域名。
- 确保该域名已经写入 `NEXT_PUBLIC_APP_URL`。
- 用手机或另一台电脑访问同一个公网 URL，不要访问 `localhost`。

常见部署错误：

- `DATABASE_URL` 不可访问：检查云数据库公网访问、SSL 参数、用户名密码和防火墙。
- COS URL 返回 `403` 或 `AccessDenied`：检查 Bucket 或对象读权限，确保无痕浏览器可直接打开图片 URL。
- FASHN 无法访问图片：确认上传结果是 COS HTTPS URL，不是 `/uploads/xxx`、`localhost` 或内网地址。
- Cookie 登录失效：确认生产环境使用 HTTPS，`SESSION_SECRET` 已配置且部署后没有频繁变化。
- `npm run build` 失败：先执行 `npm install`，确认 `DATABASE_URL`、Prisma Client 和 TypeScript 类型正常；生产迁移使用 `npx prisma migrate deploy`。
- 生产环境本地存储不可用：生产必须设置 `STORAGE_PROVIDER=cos`，不要依赖 `public/uploads`。

## 常见错误

- 图片无法被 FASHN 访问：确认 COS URL 能在无痕浏览器直接打开。
- 图片格式不支持：上传 JPG、PNG 或 WEBP。
- 人物图不符合要求：上传清晰正面人物图。
- 服装图不符合要求：上传清晰、无遮挡的服装正面图。
- FASHN 配置错误：检查 `FASHN_API_KEY` 是否正确。
- 生成时间过长：稍后重试，或调大 `FASHN_POLL_TIMEOUT_MS`。

排查失败任务：

1. 打开 `/admin`。
2. 按 `provider=fashn` 或 `status=FAILED` 筛选。
3. 查看 `externalPredictionId`、`errorMessage`、`createdAt`、`finishedAt`。
4. 普通用户页面只显示用户可读失败原因；原始响应保存在数据库 `rawResponse` 中。

## 当前功能

- 首页产品介绍和使用流程
- 上传服装图、人物图
- 选择内置 AI 模特
- 图片类型、大小、最低宽高校验
- 腾讯云 COS 上传
- mock / FASHN AI provider 切换
- 创建试衣任务
- FASHN prediction id 和 raw response 落库
- 任务详情页 PROCESSING 自动刷新
- 历史记录状态筛选
- 后台状态和 provider 筛选
- 成功、失败、加载、空状态处理

## 后续 TODO

- 异步任务队列
- 云端结果图转存
- 用户登录
- 支付
- 商家批量生成
- 后台审核
- 多角度生成
