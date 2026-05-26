import { apiSuccess } from "@/lib/apiResponse";
import { clearAdminSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  const session = clearAdminSession();
  const response = apiSuccess({ message: "已退出登录" });
  response.cookies.set(session.name, session.value, session.options);
  return response;
}
