"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { parseApiResponse } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      await parseApiResponse<{ message: string }>(response);
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : "/try-on");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-black/10 bg-white p-6 shadow-soft">
        <div className="mb-6">
          <p className="text-sm font-medium text-sage">Admin Login</p>
          <h1 className="mt-2 text-3xl font-semibold">管理员登录</h1>
          <p className="mt-2 text-sm leading-6 text-black/55">登录后可以使用 AI 试衣、查看历史记录和后台任务。</p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">账号</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="h-11 w-full rounded-md border border-black/15 bg-white px-3 outline-none transition focus:border-ink"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">密码</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              className="h-11 w-full rounded-md border border-black/15 bg-white px-3 outline-none transition focus:border-ink"
              required
            />
          </label>

          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">{error}</p> : null}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "登录中..." : "登录"}
          </Button>
        </form>
      </section>
    </main>
  );
}
