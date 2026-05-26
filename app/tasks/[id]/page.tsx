"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, LinkButton } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { parseApiResponse } from "@/types/api";
import { aspectRatioOptions, garmentOptions, qualityOptions } from "@/types/tryon";
import type { TaskCardData } from "@/components/TaskCard";

type TaskDetail = TaskCardData & {
  errorMessage?: string | null;
  provider: string;
  externalPredictionId?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  quality?: string | null;
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");

  const loadTask = useCallback(
    async (silent = false) => {
      if (!taskId) return;
      if (!silent) {
        setLoading(true);
        setError("");
      }

      try {
        const response = await fetch(`/api/tasks/${taskId}`, { cache: "no-store" });
        const data = await parseApiResponse<{ task: TaskDetail }>(response);
        setTask(data.task);
      } catch (err) {
        setError(err instanceof Error ? err.message : "任务加载失败");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [taskId]
  );

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  useEffect(() => {
    if (task?.status !== "PROCESSING") return;

    const timer = window.setInterval(() => {
      void loadTask(true);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [loadTask, task?.status]);

  const meta = useMemo(() => {
    if (!task) return null;

    return {
      garmentLabel: garmentOptions.find((item) => item.value === task.garmentType)?.label || task.garmentType,
      ratioLabel: aspectRatioOptions.find((item) => item.value === task.aspectRatio)?.label || task.aspectRatio,
      qualityLabel: qualityOptions.find((item) => item.value === task.quality)?.label || "速度优先",
      personImage: task.personImageUrl || task.aiModel?.imageUrl || null,
      personTitle: task.personImageUrl ? "人物图" : "AI 模特图",
      modelDescription: task.aiModel
        ? [task.aiModel.gender, task.aiModel.bodyType, task.aiModel.style].filter(Boolean).join(" / ")
        : ""
    };
  }, [task]);

  async function regenerate() {
    if (!task) return;

    setRegenerating(true);
    setRegenerateError("");

    try {
      const response = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garmentImageUrl: task.garmentImageUrl,
          personImageUrl: task.personImageUrl,
          aiModelId: task.personImageUrl ? null : task.aiModel?.id || null,
          garmentType: task.garmentType,
          aspectRatio: task.aspectRatio,
          quality: task.quality || "standard"
        })
      });

      const data = await parseApiResponse<{ taskId: string }>(response);
      router.push(`/tasks/${data.taskId}`);
    } catch (err) {
      setRegenerateError(err instanceof Error ? err.message : "重新生成失败");
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 h-9 w-48 animate-pulse rounded bg-black/10" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)]">
          <div className="grid gap-5 sm:grid-cols-2">
            <SkeletonImage />
            <SkeletonImage />
          </div>
          <SkeletonImage />
        </div>
      </main>
    );
  }

  if (error || !task || !meta) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <EmptyState title="没有找到任务" description={error || "任务可能已被删除"} actionHref="/history" actionLabel="返回历史记录" />
      </main>
    );
  }

  const isProcessing = task.status === "PROCESSING";
  const isSuccess = task.status === "SUCCESS";
  const isFailed = task.status === "FAILED";
  const canDownload = isSuccess && Boolean(task.resultImageUrl);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-sage">Task Detail</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold">试衣任务详情</h1>
            <StatusBadge status={task.status} />
          </div>
          {isProcessing ? <p className="mt-2 text-sm text-black/55">正在生成中，请稍候。页面会每 3 秒自动刷新。</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/history" variant="ghost">
            返回历史记录
          </LinkButton>
          {canDownload ? (
            <a
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-black/15 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-black/5"
              href={task.resultImageUrl || ""}
              download
            >
              下载结果图
            </a>
          ) : null}
          {(isFailed || isSuccess) && (
            <Button variant="secondary" onClick={regenerate} disabled={regenerating}>
              {regenerating ? "再次生成中..." : "再次生成"}
            </Button>
          )}
        </div>
      </div>

      <section className="mb-5 rounded-lg border border-black/10 bg-white p-5">
        <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-6">
          <MetaItem label="状态" value={<StatusBadge status={task.status} />} />
          <MetaItem label="服装类型" value={meta.garmentLabel} />
          <MetaItem label="图片比例" value={meta.ratioLabel} />
          <MetaItem label="质量模式" value={meta.qualityLabel} />
          <MetaItem label="Provider" value={task.provider} />
          <MetaItem label="完成时间" value={task.finishedAt ? new Date(task.finishedAt).toLocaleString("zh-CN") : "未完成"} />
        </div>
      </section>

      {isFailed ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {task.errorMessage || "生成失败，请重新生成或返回上传页创建新任务。"}
        </div>
      ) : null}

      {regenerateError ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {regenerateError}
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] lg:items-start">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">输入素材</h2>
            <span className="text-sm text-black/50">服装与人物对比</span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <ImagePanel title="服装原图" src={task.garmentImageUrl} />
            <ImagePanel title={meta.personTitle} src={meta.personImage} description={task.personImageUrl ? "用户上传人物照片" : meta.modelDescription} />
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">生成结果</h2>
            <span className="text-sm text-black/50">{isSuccess ? "已生成" : isFailed ? "生成失败" : "等待结果"}</span>
          </div>
          {isSuccess ? (
            <ImagePanel title="结果图" src={task.resultImageUrl} emphasis />
          ) : isFailed ? (
            <ResultState title="生成失败" description={task.errorMessage || "当前任务没有可展示的结果图。"} />
          ) : (
            <ResultState title="正在生成中" description="正在生成中，请稍候。页面会自动刷新任务状态。" loading />
          )}
        </div>
      </section>
    </main>
  );
}

function MetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <span className="text-black/50">{label}</span>
      <div className="mt-2 font-medium">{value}</div>
    </div>
  );
}

function ImagePanel({
  title,
  src,
  emphasis,
  description
}: {
  title: string;
  src?: string | null;
  emphasis?: boolean;
  description?: string;
}) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${emphasis ? "border-ink shadow-soft" : "border-black/10"}`}>
      <div className="mb-3">
        <h3 className="font-medium">{title}</h3>
        {description ? <p className="mt-1 text-xs leading-5 text-black/50">{description}</p> : null}
      </div>
      {src ? (
        <img src={src} alt={title} className="image-checker aspect-[4/5] w-full rounded-md object-contain" />
      ) : (
        <div className="flex aspect-[4/5] items-center justify-center rounded-md bg-zinc-100 px-4 text-center text-sm text-black/50">
          暂无图片
        </div>
      )}
    </div>
  );
}

function ResultState({ title, description, loading }: { title: string; description: string; loading?: boolean }) {
  return (
    <div className="flex aspect-[4/5] flex-col items-center justify-center rounded-lg border border-dashed border-black/20 bg-white px-6 text-center">
      {loading ? <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black/15 border-t-ink" /> : null}
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-black/55">{description}</p>
    </div>
  );
}

function SkeletonImage() {
  return <div className="aspect-[4/5] animate-pulse rounded-lg bg-black/10" />;
}
