import { TryOnTaskStatus } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const provider = searchParams.get("provider");

    const tasks = await prisma.tryOnTask.findMany({
      where: {
        ...(status && Object.values(TryOnTaskStatus).includes(status as TryOnTaskStatus)
          ? { status: status as TryOnTaskStatus }
          : {}),
        ...(provider && ["mock", "fashn"].includes(provider) ? { provider } : {})
      },
      include: { aiModel: true },
      orderBy: { createdAt: "desc" }
    });

    return apiSuccess({ tasks });
  } catch (error) {
    console.error(error);
    return apiError("TASKS_FETCH_FAILED", "任务列表加载失败", 500);
  }
}
