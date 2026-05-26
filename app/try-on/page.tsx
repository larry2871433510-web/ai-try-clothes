"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { ImageUpload } from "@/components/ImageUpload";
import { parseApiResponse } from "@/types/api";
import { aspectRatioOptions, garmentOptions, qualityOptions } from "@/types/tryon";

type AiModelOption = {
  id: string;
  name: string;
  gender: string;
  bodyType: string;
  style?: string | null;
  imageUrl: string;
};

type PersonMode = "upload" | "model";

export default function TryOnPage() {
  const router = useRouter();
  const [garmentImageUrl, setGarmentImageUrl] = useState("");
  const [personImageUrl, setPersonImageUrl] = useState("");
  const [personMode, setPersonMode] = useState<PersonMode>("model");
  const [models, setModels] = useState<AiModelOption[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState("");
  const [aiModelId, setAiModelId] = useState("");
  const [garmentType, setGarmentType] = useState("T_SHIRT");
  const [aspectRatio, setAspectRatio] = useState("RATIO_3_4");
  const [quality, setQuality] = useState("standard");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedModel = models.find((model) => model.id === aiModelId) || null;

  useEffect(() => {
    fetch("/api/models")
      .then(async (response) => {
        const data = await parseApiResponse<{ models: AiModelOption[] }>(response);
        setModels(data.models);
        if (data.models[0]) setAiModelId(data.models[0].id);
      })
      .catch((err) => setModelsError(err instanceof Error ? err.message : "模特库加载失败"))
      .finally(() => setModelsLoading(false));
  }, []);

  async function submit() {
    setError("");
    if (!garmentImageUrl) {
      setError("请先上传一张服装正面图，支持 jpg、png、webp，最大 10MB。");
      return;
    }

    if (personMode === "upload" && !personImageUrl) {
      setError("当前选择的是上传本人照片，请先上传人物照片。");
      return;
    }

    if (personMode === "model" && !aiModelId) {
      setError("当前选择的是 AI 模特，请先选择一个系统内置模特。");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garmentImageUrl,
          personImageUrl: personMode === "upload" ? personImageUrl : null,
          aiModelId: personMode === "model" ? aiModelId : null,
          garmentType,
          aspectRatio,
          quality
        })
      });
      const data = await parseApiResponse<{ taskId: string }>(response);
      router.push(`/tasks/${data.taskId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-sage">Create Task</p>
        <h1 className="mt-2 text-3xl font-semibold">上传试衣素材</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
          上传服装图后会立即显示预览。人物素材可以上传自己的照片，也可以选择系统内置 AI 模特。
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-5">
          <ImageUpload
            label="服装正面图"
            value={garmentImageUrl}
            onChange={setGarmentImageUrl}
            required
            folder="garments"
            helper={
              <UploadTips
                title="服装图上传建议"
                items={[
                  "建议上传清晰、正面、无遮挡的服装图。",
                  "避免严重褶皱、强反光、复杂背景。",
                  "深色衣服搭配深色背景时效果可能下降。",
                  "带文字或 Logo 的衣服需要上传高清图。"
                ]}
              />
            }
          />

          <div className="rounded-lg border border-black/10 bg-white p-4">
            <div className="mb-4 flex rounded-md border border-black/10 bg-zinc-50 p-1">
              <ModeButton active={personMode === "upload"} onClick={() => setPersonMode("upload")}>
                上传本人照片
              </ModeButton>
              <ModeButton active={personMode === "model"} onClick={() => setPersonMode("model")}>
                选择 AI 模特
              </ModeButton>
            </div>

            {personMode === "upload" ? (
              <ImageUpload
                label="人物照片"
                value={personImageUrl}
                onChange={setPersonImageUrl}
                required
                folder="persons"
                helper={
                  <UploadTips
                    title="人物图上传建议"
                    items={[
                      "建议上传正面全身或半身照。",
                      "光线充足，人物主体清晰。",
                      "身体不要被大面积遮挡，手臂不要严重遮挡衣服区域。"
                    ]}
                  />
                }
              />
            ) : (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">系统内置 AI 模特</span>
                  {modelsLoading ? <span className="text-xs text-black/45">加载中...</span> : null}
                </div>
                {modelsError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{modelsError}</p> : null}
                {!modelsLoading && !modelsError && models.length === 0 ? (
                  <p className="rounded-md bg-zinc-50 px-3 py-6 text-center text-sm text-black/55">暂无可用 AI 模特，请先执行 seed。</p>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setAiModelId(model.id)}
                      className={`overflow-hidden rounded-lg border bg-white text-left transition ${
                        aiModelId === model.id ? "border-ink shadow-soft" : "border-black/10 hover:border-black/25"
                      }`}
                    >
                      <img src={model.imageUrl} alt={model.name} className="image-checker aspect-[4/5] w-full object-cover" />
                      <div className="space-y-1 p-3">
                        <p className="font-medium">{model.name}</p>
                        <p className="text-xs leading-5 text-black/55">
                          {model.gender} / {model.bodyType} / {model.style}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-lg border border-black/10 bg-white p-5">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">服装类型</span>
              <select
                value={garmentType}
                onChange={(event) => setGarmentType(event.target.value)}
                className="h-11 w-full rounded-md border border-black/15 bg-white px-3"
              >
                {garmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-lg border border-black/10 bg-silk p-3">
              <span className="block text-sm font-medium">当前人物素材</span>
              <div className="mt-3 flex items-center gap-3">
                {personMode === "upload" && personImageUrl ? (
                  <img src={personImageUrl} alt="已上传人物照片" className="image-checker h-24 w-20 rounded-md object-cover" />
                ) : personMode === "model" && selectedModel ? (
                  <img src={selectedModel.imageUrl} alt={selectedModel.name} className="image-checker h-24 w-20 rounded-md object-cover" />
                ) : (
                  <div className="flex h-24 w-20 items-center justify-center rounded-md bg-zinc-100 text-xs text-black/45">待选择</div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {personMode === "upload" ? (personImageUrl ? "使用已上传人物照片" : "等待上传人物照片") : selectedModel?.name || "等待选择 AI 模特"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-black/55">
                    {personMode === "upload"
                      ? "上传本人照片后，将不会传入 aiModelId。"
                      : selectedModel
                      ? `${selectedModel.gender} / ${selectedModel.bodyType} / ${selectedModel.style}`
                      : "请从模特库中选择一个模特。"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium">图片比例</span>
              <div className="grid grid-cols-4 gap-2">
                {aspectRatioOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAspectRatio(option.value)}
                    className={`h-11 rounded-md border text-sm ${
                      aspectRatio === option.value ? "border-ink bg-ink text-white" : "border-black/15 bg-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium">质量模式</span>
              <div className="grid gap-2">
                {qualityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setQuality(option.value)}
                    className={`rounded-md border px-3 py-3 text-left transition ${
                      quality === option.value ? "border-ink bg-ink text-white" : "border-black/15 bg-white hover:bg-black/5"
                    }`}
                  >
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className={`mt-1 block text-xs ${quality === option.value ? "text-white/70" : "text-black/55"}`}>{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">{error}</p> : null}
            <Button onClick={submit} disabled={submitting || modelsLoading} className="w-full">
              {submitting ? "正在创建任务并生成..." : "生成试衣图"}
            </Button>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[40px] flex-1 rounded px-3 py-2 text-sm font-medium transition ${
        active ? "bg-ink text-white shadow-sm" : "text-black/60 hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function UploadTips({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md bg-silk px-3 py-3">
      <p className="text-xs font-medium text-ink">{title}</p>
      <ul className="mt-2 space-y-1 text-xs leading-5 text-black/55">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
