import { LinkButton } from "@/components/Button";

const valueProps = [
  {
    title: "上传服装图",
    description: "支持服装正面图上传，适合快速验证商品上身效果。"
  },
  {
    title: "选择 AI 模特或上传自己照片",
    description: "可以使用系统内置模特，也可以上传真实人物照片做试穿。"
  },
  {
    title: "生成试穿效果图",
    description: "提交后创建试衣任务，当前使用 Mock AI 返回结果图。"
  }
];

const steps = [
  {
    title: "准备素材",
    description: "上传服装正面图，再上传人物照片或选择一个内置 AI 模特。"
  },
  {
    title: "选择参数",
    description: "选择服装类型和图片比例，让结果更贴近商品展示场景。"
  },
  {
    title: "查看结果",
    description: "生成后进入任务详情页，下载结果图，也可以回到历史记录查看。"
  }
];

const implementationNodes = [
  {
    title: "上传节点",
    flow: "POST /api/upload 接收图片，校验 jpg、jpeg、png、webp 和 10MB 限制，保存到 public/uploads。",
    visible: "上传页会显示图片预览和上传状态。"
  },
  {
    title: "任务节点",
    flow: "POST /api/try-on 校验服装图、人物图或 AI 模特、服装类型和图片比例，创建 PROCESSING 任务。",
    visible: "提交后进入任务详情页，可看到状态、输入图和结果图。"
  },
  {
    title: "AI 生成节点",
    flow: "lib/ai/tryonService.ts 会根据 AI_PROVIDER 选择 mockProvider 或 fashnProvider。",
    visible: "mock 模式展示占位结果图，FASHN 模式展示真实生成图。"
  },
  {
    title: "历史与管理节点",
    flow: "GET /api/tasks 按 createdAt 倒序返回任务列表，GET /api/tasks/[id] 返回单个任务详情。",
    visible: "历史页展示任务卡片，后台页展示可筛选的任务表格。"
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-20">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/55">AI Fashion Try-On MVP</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">AI 服装试衣，快速生成商品上身图</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/70">
              面向服装商家的 Web/H5 试衣工具。上传服装图，选择 AI 模特或上传自己照片，即可生成试穿效果图，用于淘宝、小红书、抖音商品图和内容素材验证。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/try-on" className="bg-white !text-black hover:bg-white/90">
                立即体验
              </LinkButton>
              <LinkButton href="/history" variant="secondary" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                查看历史
              </LinkButton>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <img src="/mock/result-placeholder.jpg" alt="AI 试衣生成示例" className="h-full rounded-lg object-cover shadow-soft" />
            <div className="space-y-3 pt-8">
              <img src="/models/editorial-female.svg" alt="AI 模特" className="rounded-lg bg-white object-cover shadow-soft" />
              <img src="/mock/result-1-1.svg" alt="服装试穿示例" className="rounded-lg object-cover shadow-soft" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-7">
          <p className="text-sm font-medium text-sage">Product Value</p>
          <h2 className="mt-2 text-2xl font-semibold">为商家准备的 AI 试衣闭环</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {valueProps.map((item) => (
            <div key={item.title} className="rounded-lg border border-black/10 bg-white p-5">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-black/60">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-7">
            <p className="text-sm font-medium text-sage">Workflow</p>
            <h2 className="mt-2 text-2xl font-semibold">3 步生成试穿效果图</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-lg border border-black/10 bg-silk p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-5 font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-black/60">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-lg border border-black/10 bg-ink p-6 text-white md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <h2 className="text-2xl font-semibold">适合服装商家的内容生产场景</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
              可用于淘宝商品主图、详情页、小红书种草图、抖音短视频封面和直播预热素材。当前结果为 Mock 占位图，链路已为后续真实 AI API 接入预留。
            </p>
          </div>
          <LinkButton href="/try-on" className="mt-5 bg-white !text-black hover:bg-white/90 md:mt-0">
            立即体验
          </LinkButton>
        </div>
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-7">
            <p className="text-sm font-medium text-sage">Implementation Notes</p>
            <h2 className="mt-2 text-2xl font-semibold">当前网页可见的实现节点</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {implementationNodes.map((node) => (
              <div key={node.title} className="rounded-lg border border-black/10 bg-silk p-5">
                <h3 className="font-semibold">{node.title}</h3>
                <p className="mt-3 text-sm leading-6 text-black/65">{node.flow}</p>
                <p className="mt-3 border-t border-black/10 pt-3 text-sm leading-6 text-black/55">{node.visible}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
