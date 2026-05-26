"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1 text-sm">
      <Link className="rounded px-3 py-2 hover:bg-black/5" href="/">
        首页
      </Link>
      {isLoggedIn ? (
        <>
          <Link className="rounded px-3 py-2 hover:bg-black/5" href="/try-on">
            AI 试衣
          </Link>
          <Link className="rounded px-3 py-2 hover:bg-black/5" href="/history">
            历史记录
          </Link>
          <Link className="rounded px-3 py-2 hover:bg-black/5" href="/admin">
            后台管理
          </Link>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="rounded px-3 py-2 text-left hover:bg-black/5 disabled:opacity-60"
          >
            {loggingOut ? "退出中..." : "退出登录"}
          </button>
        </>
      ) : (
        <Link className="rounded px-3 py-2 hover:bg-black/5" href="/login">
          登录
        </Link>
      )}
    </div>
  );
}
