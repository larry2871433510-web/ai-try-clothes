"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { parseApiResponse } from "@/types/api";
import { aspectRatioOptions, garmentOptions } from "@/types/tryon";

type AdminTask = {
  id: string;
  garmentType: string;
  aspectRatio: string;
  quality?: string | null;
  status: string;
  provider: string;
  externalPredictionId?: string | null;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorMessage?: string | null;
};

const statusFilters = [
  { label: "全部", value: "ALL" },
  { label: "PROCESSING", value: "PROCESSING" },
  { label: "SUCCESS", value: "SUCCESS" },
  { label: "FAILED", value: "FAILED" }
];

const providerFilters = [
  { label: "全部", value: "ALL" },
  { label: "mock", value: "mock" },
  { label: "fashn", value: "fashn" }
];

const reservedModules = ["管理员登录", "用户管理", "成本统计", "图片审核"];

export default function AdminPage() {
  const router = useRouter();
  const [status, setStatus] = useState("ALL");
  const [provider, setProvider] = useState("ALL");
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    const searchParams = new URLSearchParams();
    if (status !== "ALL") searchParams.set("status", status);
    if (provider !== "ALL") searchParams.set("provider", provider);
    const url = searchParams.size > 0 ? `/api/tasks?${searchParams.toString()}` : "/api/tasks";

    fetch(url)
      .then(async (response) => {
        const data = await parseApiResponse<{ tasks: AdminTask[] }>(response);
        setTasks(data.tasks);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [provider, status]);

  const counts = useMemo(() => {
    return {
      total: tasks.length,
      processing: tasks.filter((task) => task.status === "PROCESSING").length,
      success: tasks.filter((task) => task.status === "SUCCESS").length,
      failed: tasks.filter((task) => task.status === "FAILED").length
    };
  }, [tasks]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-sage">Admin Console</p>
          <h1 className="mt-2 text-3xl font-semibold">后台任务管理</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
            当前只做任务排查，不显示任何 API Key。后续可在这里接入用户管理、成本统计和图片审核。
          </p>
        </div>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="当前列表" value={counts.total} />
        <Metric label="PROCESSING" value={counts.processing} />
        <Metric label="SUCCESS" value={counts.success} />
        <Metric label="FAILED" value={counts.failed} />
      </section>

      <section className="mb-5 grid gap-3 lg:grid-cols-2">
        <FilterGroup label="状态筛选" value={status} options={statusFilters} onChange={setStatus} />
        <FilterGroup label="Provider 筛选" value={provider} options={providerFilters} onChange={setProvider} />
      </section>

      {loading ? <AdminTableSkeleton /> : null}
      {error ? <EmptyState title="任务加载失败" description={error} /> : null}
      {!loading && !error && tasks.length === 0 ? <EmptyState title="没有匹配任务" description="切换状态或 provider 筛选，或先创建一条试衣任务。" /> : null}

      {!loading && !error && tasks.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-black/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] border-collapse text-sm">
              <thead className="bg-zinc-50 text-left text-black/55">
                <tr>
                  <TableHead>id</TableHead>
                  <TableHead>garmentType</TableHead>
                  <TableHead>aspectRatio</TableHead>
                  <TableHead>quality</TableHead>
                  <TableHead>status</TableHead>
                  <TableHead>provider</TableHead>
                  <TableHead>externalPredictionId</TableHead>
                  <TableHead>createdAt</TableHead>
                  <TableHead>startedAt</TableHead>
                  <TableHead>finishedAt</TableHead>
                  <TableHead>errorMessage</TableHead>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    tabIndex={0}
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") router.push(`/tasks/${task.id}`);
                    }}
                    className="cursor-pointer border-t border-black/10 transition hover:bg-zinc-50 focus:bg-zinc-50 focus:outline-none"
                    title="点击查看任务详情"
                  >
                    <TableCell className="font-mono text-xs">{task.id}</TableCell>
                    <TableCell>{labelFor(garmentOptions, task.garmentType)}</TableCell>
                    <TableCell>{labelFor(aspectRatioOptions, task.aspectRatio)}</TableCell>
                    <TableCell>{task.quality || "standard"}</TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>{task.provider}</TableCell>
                    <TableCell>
                      <span className="block max-w-[220px] truncate font-mono text-xs">{task.externalPredictionId || "-"}</span>
                    </TableCell>
                    <TableCell>{formatDate(task.createdAt)}</TableCell>
                    <TableCell>{task.startedAt ? formatDate(task.startedAt) : "-"}</TableCell>
                    <TableCell>{task.finishedAt ? formatDate(task.finishedAt) : "-"}</TableCell>
                    <TableCell>
                      <span className="block max-w-[300px] truncate text-red-700">{task.errorMessage || "-"}</span>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-lg border border-dashed border-black/15 bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">后续管理能力预留</h2>
            <p className="mt-2 text-sm leading-6 text-black/55">当前先保持轻量任务查看，后续模块可接入独立路由或后台布局。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {reservedModules.map((module) => (
              <span key={module} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-black/60">
                {module}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <p className="text-sm text-black/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function FilterGroup({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <p className="mb-2 text-xs font-medium text-black/50">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`min-h-[38px] rounded-md border px-4 py-2 text-sm font-medium transition ${
              value === item.value ? "border-ink bg-ink text-white" : "border-black/15 bg-white text-ink hover:bg-black/5"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

function TableCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

function AdminTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="grid grid-cols-4 gap-4 border-t border-black/10 p-4 first:border-t-0">
          <div className="h-4 animate-pulse rounded bg-black/10" />
          <div className="h-4 animate-pulse rounded bg-black/10" />
          <div className="h-4 animate-pulse rounded bg-black/10" />
          <div className="h-4 animate-pulse rounded bg-black/10" />
        </div>
      ))}
    </div>
  );
}

function labelFor(options: readonly { label: string; value: string }[], value: string) {
  return options.find((item) => item.value === value)?.label || value;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN");
}
