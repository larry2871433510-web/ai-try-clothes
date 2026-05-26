import { apiError, apiSuccess } from "@/lib/apiResponse";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const task = await prisma.tryOnTask.findUnique({
      where: { id: params.id },
      include: { aiModel: true }
    });

    if (!task) {
      return apiError("TASK_NOT_FOUND", "任务不存在", 404);
    }

    return apiSuccess({ task });
  } catch (error) {
    console.error(error);
    return apiError("TASK_FETCH_FAILED", "任务详情加载失败", 500);
  }
}
