import { NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { createAdminSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || "");
    const password = String(body.password || "");

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return apiError("AUTH_CONFIG_MISSING", "管理员登录配置缺失", 500);
    }

    if (username !== adminUsername || password !== adminPassword) {
      return apiError("INVALID_CREDENTIALS", "账号或密码错误", 401);
    }

    const session = await createAdminSession();
    const response = apiSuccess({ message: "登录成功" });
    response.cookies.set(session.name, session.value, session.options);
    return response;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return apiError("INVALID_REQUEST", "请求参数格式错误", 400);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "LOGIN_FAILED",
          message: error instanceof Error ? error.message : "登录失败"
        }
      },
      { status: 500 }
    );
  }
}
