"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { TaskCard, type TaskCardData } from "@/components/TaskCard";
import { parseApiResponse } from "@/types/api";

const statusFilters = [
  { label: "全部", value: "ALL" },
  { label: "生成中", value: "PROCESSING" },
  { label: "成功", value: "SUCCESS" },
  { label: "失败", value: "FAILED" }
];

export default function HistoryPage() {
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch(status === "ALL" ? "/api/tasks" : `/api/tasks?status=${status}`)
      .then(async (response) => {
        const data = await parseApiResponse<{ tasks: TaskCardData[] }>(response);
        setTasks(data.tasks);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [status]);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      processing: tasks.filter((task) => task.status === "PROCESSING").length,
      success: tasks.filter((task) => task.status === "SUCCESS").length,
      failed: tasks.filter((task) => task.status === "FAILED").length
    }),
    [tasks]
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-sage">History</p>
          <h1 className="mt-2 text-3xl font-semibold">历史试衣任务</h1>
          <p className="mt-2 text-sm text-black/55">
            当前列表 {counts.total} 条，生成中 {counts.processing} 条，成功 {counts.success} 条，失败 {counts.failed} 条。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatus(item.value)}
              className={`min-h-[40px] rounded-md border px-4 py-2 text-sm font-medium transition ${
                status === item.value ? "border-ink bg-ink text-white" : "border-black/15 bg-white text-ink hover:bg-black/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-lg border border-black/10 bg-white">
              <div className="grid grid-cols-2 gap-px bg-black/10">
                <div className="aspect-[4/5] animate-pulse bg-black/10" />
                <div className="aspect-[4/5] animate-pulse bg-black/10" />
              </div>
              <div className="space-y-3 p-4">
                <div className="h-5 w-28 animate-pulse rounded bg-black/10" />
                <div className="h-4 w-full animate-pulse rounded bg-black/10" />
                <div className="h-10 w-full animate-pulse rounded bg-black/10" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {error ? <EmptyState title="历史记录加载失败" description={error} /> : null}
      {!loading && !error && tasks.length === 0 ? (
        <EmptyState title="没有匹配任务" description="切换筛选条件，或创建第一条试衣任务。" actionHref="/try-on" actionLabel="开始体验" />
      ) : null}
      {!loading && !error && tasks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : null}
    </main>
  );
}
