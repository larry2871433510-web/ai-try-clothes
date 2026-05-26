# AI 服装试衣 Web 平台长期产品需求

## 1. 产品定位

AI 服装试衣 Web 平台面向服装电商、独立设计师、内容运营团队和品牌商家，提供低门槛的线上服装试穿图片生成能力。

平台核心价值：

- 快速把服装平铺图或正面图生成模特上身效果；
- 降低商家拍摄模特图的时间和成本；
- 为商品详情页、社媒投放、直播预热和选品测试提供视觉素材；
- 逐步沉淀任务管理、素材管理、审核和批量生成能力。

第一阶段定位为 MVP 验证版本，重点验证上传、建任务、生成、结果查看和历史管理链路。

## 2. 目标用户

- 服装电商商家：需要快速生成商品上身图，提高上新效率。
- 独立服装设计师：需要低成本展示设计稿或样衣效果。
- 品牌运营人员：需要为广告、社媒、小红书/抖音内容生成不同风格素材。
- 摄影与视觉团队：需要辅助生成参考图、初稿图或补充素材。
- 平台管理员：需要查看任务、筛选状态、处理失败任务和审核图片内容。

## 3. MVP 范围

MVP 只覆盖最小可用闭环：

- 上传服装正面图；
- 上传人物照片或选择系统内置 AI 模特；
- 选择服装类型；
- 选择图片比例；
- 创建试衣任务；
- 使用 Mock AI 服务模拟生成；
- 展示任务状态；
- 展示服装图、人物/模特图和结果图；
- 支持下载结果图；
- 支持重新生成；
- 支持历史记录；
- 支持后台任务查看和状态筛选。

MVP 不接真实 AI API，不做商业化能力，不做复杂权限系统。

## 4. 页面清单

- `/`
  - 首页；
  - 产品介绍；
  - 使用步骤；
  - 当前实现节点说明；
  - 进入试衣页入口。

- `/try-on`
  - 上传服装正面图；
  - 上传人物照片；
  - 从数据库驱动的内置 AI 模特库中选择模特；
  - 选择服装类型；
  - 选择图片比例；
  - 创建试衣任务。

- `/tasks/[id]`
  - 查看任务详情；
  - 展示任务状态；
  - 展示服装原图；
  - 展示人物图或 AI 模特图；
  - 成功时展示结果图；
  - 失败时展示错误信息；
  - 支持重新生成；
  - 支持下载结果图；
  - 支持返回历史记录。

- `/history`
  - 历史任务卡片网格；
  - 展示服装图、结果图、服装类型、图片比例、状态、创建时间；
  - 支持进入详情页；
  - 支持空状态。

- `/admin`
  - 后台任务管理；
  - 展示所有 TryOnTask；
  - 支持按状态筛选；
  - 点击任务行进入详情页；
  - 为管理员登录、用户管理、成本统计和图片审核预留结构。

## 5. 数据库设计

当前使用 Prisma + PostgreSQL。

### User

用于后续登录和任务归属。

- `id`
- `name`
- `email`
- `tasks`
- `garments`
- `createdAt`
- `updatedAt`

### Garment

用于后续服装素材库。

- `id`
- `userId`
- `imageUrl`
- `type`
- `user`
- `createdAt`
- `updatedAt`

### AiModel

用于系统内置 AI 模特和后续用户自定义模特。

- `id`
- `name`
- `gender`
- `bodyType`
- `imageUrl`
- `style`
- `isActive`
- `tasks`
- `createdAt`
- `updatedAt`

### TryOnTask

核心试衣任务表。

- `id`
- `userId`
- `garmentImageUrl`
- `personImageUrl`
- `aiModelId`
- `garmentType`
- `aspectRatio`
- `status`
- `resultImageUrl`
- `errorMessage`
- `provider`
- `createdAt`
- `updatedAt`
- `finishedAt`

### 枚举

- `GarmentType`
  - `T_SHIRT`
  - `SHIRT`
  - `HOODIE`
  - `COAT`
  - `PANTS`
  - `SKIRT`
  - `DRESS`

- `AspectRatio`
  - `RATIO_1_1`
  - `RATIO_3_4`
  - `RATIO_4_5`
  - `RATIO_9_16`

- `TryOnTaskStatus`
  - `PENDING`
  - `PROCESSING`
  - `SUCCESS`
  - `FAILED`

## 6. API 清单

### `POST /api/upload`

上传图片。

功能要求：

- 接收 multipart 图片文件；
- 只允许 `jpg`、`jpeg`、`png`、`webp`；
- 限制大小 10MB；
- 保存到 `public/uploads`；
- 返回 `imageUrl`。

### `POST /api/try-on`

创建试衣任务。

请求参数：

- `garmentImageUrl`
- `personImageUrl`
- `aiModelId`
- `garmentType`
- `aspectRatio`

功能要求：

- 校验必要参数；
- 创建 `TryOnTask`；
- 状态设为 `PROCESSING`；
- 调用 `lib/ai/tryonService.ts`；
- 第一版使用 `mockTryOnGeneration`；
- 成功后写入 `resultImageUrl` 并更新为 `SUCCESS`；
- 失败后写入 `errorMessage` 并更新为 `FAILED`；
- 返回 `taskId`。

### `GET /api/tasks/[id]`

获取单个任务详情。

返回内容：

- TryOnTask 全量信息；
- 关联的 AiModel 信息。

### `GET /api/tasks`

获取任务列表。

功能要求：

- 按 `createdAt` 倒序；
- 支持 `status` 查询参数筛选；
- 返回任务列表和关联 AiModel。

### `GET /api/models`

获取系统内置 AI 模特列表。

功能要求：

- 只返回 `isActive=true` 的模特；
- 返回模特 `id`、`name`、`gender`、`bodyType`、`style`、`imageUrl`；
- 供 `/try-on` 页面选择 AI 模特使用。

## 7. 后续版本规划

### V1：真实 AI 生成

- 接入真实 AI 试衣 API；
- 支持异步任务轮询；
- 支持生成失败重试；
- 保存 provider request/response 日志；
- 增加生成质量提示。

### V2：用户和素材管理

- 增加用户注册登录；
- 用户任务归属；
- 用户上传素材库；
- AI 模特库管理；
- 历史任务搜索和删除。

### V3：云存储和生产化

- 接入对象存储，如腾讯云 COS、S3 或其他兼容服务；
- 图片 CDN 加速；
- 上传签名；
- 图片生命周期管理；
- 日志和错误监控。

### V4：商业化

- 增加套餐、额度和支付；
- 生成次数计费；
- 商家团队空间；
- 发票和订单管理。

### V5：商家批量工作流

- 批量上传服装图；
- 批量选择模特；
- 批量生成；
- 批量下载；
- 商品维度管理；
- 电商平台导出。

### V6：审核和风控

- 图片内容审核；
- 敏感内容拦截；
- 人脸和隐私风险提示；
- 后台人工审核；
- 操作审计日志。

### V7：多角度和高级生成

- 正面、侧面、背面多角度生成；
- 不同场景背景；
- 多模特、多姿态；
- 服装细节增强；
- 视频或动态展示。

## 8. 明确暂不开发的功能

当前 MVP 暂不开发：

- 真实 AI API 接入；
- 3D 试衣；
- 视频生成；
- 背面和侧面生成；
- 真实尺码推荐；
- 支付；
- 复杂登录权限；
- 商家团队管理；
- 批量生成；
- 云存储；
- 图片审核；
- 用户积分或额度系统；
- 电商平台发布插件。

## 9. AI 服务替换说明

AI 生成逻辑集中在：

```text
lib/ai/tryonService.ts
```

当前函数：

```ts
mockTryOnGeneration(input)
```

当前行为：

- 校验 `garmentImageUrl`；
- 校验 `personImageUrl` 或 `aiModelImageUrl` 至少存在一个；
- 校验 `garmentType`；
- 校验 `aspectRatio`；
- 模拟等待 2-3 秒；
- 返回 `/mock/result-placeholder.jpg`。

后续替换真实 AI API 时建议：

- 保留 `createTryOnTask` 的数据库状态流；
- 将 `mockTryOnGeneration` 替换为真实 provider 函数；
- provider 函数统一返回 `{ resultImageUrl }`；
- 如果真实 API 是异步任务，应新增 provider task id 字段；
- 如果真实 API 需要轮询，应把生成逻辑拆成队列或后台任务；
- 如果真实 API 返回远程图片，应先落到云存储，再写入 `resultImageUrl`；
- 失败时抛出带可读信息的 Error，写入 `TryOnTask.errorMessage`。

推荐后续抽象：

```text
lib/ai/providers/mockProvider.ts
lib/ai/providers/realProvider.ts
lib/ai/tryonService.ts
```

## 10. 隐私和图片安全要求

图片和人物照片属于敏感数据，后续生产化必须满足以下要求：

- 上传前明确告知用户图片用途；
- 用户必须拥有图片使用权；
- 人物照片不得用于未授权训练；
- 结果图和原图需要设置访问权限；
- 生产环境不应长期保留临时图片；
- 支持用户删除上传图片和生成记录；
- 对公开访问的图片 URL 设置过期策略；
- 接入图片内容审核，拦截违法、色情、暴力、侵权内容；
- 对未成年人、人脸、身份证件等敏感内容做额外保护；
- 后台管理员访问图片需要审计；
- 日志中不得记录完整图片二进制或敏感个人信息；
- 第三方 AI provider 的数据保留政策需要在隐私协议中说明；
- 传输过程必须使用 HTTPS；
- 云存储 bucket 不允许公共写入；
- 对上传文件做类型、大小和扩展名校验，防止恶意文件上传。
