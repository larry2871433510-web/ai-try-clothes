import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { aspectRatioOptions, garmentOptions } from "@/types/tryon";

export type TaskCardData = {
  id: string;
  garmentImageUrl: string;
  personImageUrl?: string | null;
  resultImageUrl?: string | null;
  garmentType: string;
  aspectRatio: string;
  quality?: string | null;
  status: string;
  provider?: string;
  createdAt: string;
  errorMessage?: string | null;
  aiModel?: { id: string; name: string; gender?: string; bodyType?: string; style?: string | null; imageUrl: string } | null;
};

export function TaskCard({ task }: { task: TaskCardData }) {
  const garmentLabel = garmentOptions.find((item) => item.value === task.garmentType)?.label || task.garmentType;
  const ratioLabel = aspectRatioOptions.find((item) => item.value === task.aspectRatio)?.label || task.aspectRatio;
  const resultImage = task.status === "SUCCESS" ? task.resultImageUrl : null;
  const createdAt = new Date(task.createdAt).toLocaleString("zh-CN");

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block overflow-hidden rounded-lg border border-black/10 bg-white transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="grid grid-cols-2 gap-px bg-black/10">
        <ImagePreview title="服装图" src={task.garmentImageUrl} />
        <ImagePreview title="结果图" src={resultImage} status={task.status} />
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium">{garmentLabel}</h2>
            <p className="mt-1 text-sm text-black/55">比例 {ratioLabel}</p>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {task.status === "FAILED" ? (
          <div className="rounded-md bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
            {task.errorMessage || "生成失败"}
          </div>
        ) : null}

        {task.status === "PROCESSING" ? (
          <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs leading-5 text-black/60">正在生成中，请稍候</div>
        ) : null}

        <div className="grid gap-2 text-sm text-black/60">
          <div className="flex items-center justify-between gap-3">
            <span>创建时间</span>
            <span className="text-right">{createdAt}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Provider</span>
            <span className="text-right">{task.provider || "-"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>任务 ID</span>
            <span className="max-w-[150px] truncate font-mono text-xs">{task.id}</span>
          </div>
        </div>

        <span className="inline-flex min-h-[40px] w-full items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition">
          查看详情
        </span>
      </div>
    </Link>
  );
}

function ImagePreview({ title, src, status }: { title: string; src?: string | null; status?: string }) {
  return (
    <div className="bg-white">
      <div className="flex items-center justify-between px-3 py-2 text-xs text-black/55">
        <span>{title}</span>
      </div>
      {src ? (
        <img src={src} alt={title} className="image-checker aspect-[4/5] w-full object-contain" />
      ) : (
        <div className="flex aspect-[4/5] items-center justify-center bg-zinc-100 px-3 text-center text-xs text-black/45">
          {status === "PROCESSING" ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/15 border-t-ink" />
              生成中
            </span>
          ) : status === "FAILED" ? (
            "生成失败"
          ) : (
            "暂无结果"
          )}
        </div>
      )}
    </div>
  );
}
