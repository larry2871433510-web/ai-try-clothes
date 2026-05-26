import { apiError, apiSuccess } from "@/lib/apiResponse";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const models = await prisma.aiModel.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" }
    });

    return apiSuccess({ models });
  } catch (error) {
    console.error(error);
    return apiError("MODELS_FETCH_FAILED", "模特库加载失败", 500);
  }
}
