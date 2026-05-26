import { AspectRatio, GarmentType } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { normalizeTryOnQuality } from "@/lib/ai/garmentMapping";
import { createTryOnTask } from "@/lib/ai/tryonService";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const garmentImageUrl = String(body.garmentImageUrl || "");
    const personImageUrl = body.personImageUrl ? String(body.personImageUrl) : null;
    const aiModelId = body.aiModelId ? String(body.aiModelId) : null;
    const garmentType = body.garmentType as GarmentType;
    const aspectRatio = body.aspectRatio as AspectRatio;
    const quality = normalizeTryOnQuality(body.quality ? String(body.quality) : null);

    if (!garmentImageUrl) {
      return apiError("MISSING_GARMENT_IMAGE", "请先上传服装正面图");
    }

    if (!personImageUrl && !aiModelId) {
      return apiError("MISSING_PERSON_SOURCE", "请上传人物照片或选择系统模特");
    }

    if (!Object.values(GarmentType).includes(garmentType)) {
      return apiError("INVALID_GARMENT_TYPE", "请选择有效的服装类型");
    }

    if (!Object.values(AspectRatio).includes(aspectRatio)) {
      return apiError("INVALID_ASPECT_RATIO", "请选择有效的图片比例");
    }

    const task = await createTryOnTask({
      garmentImageUrl,
      personImageUrl,
      aiModelId,
      garmentType,
      aspectRatio,
      quality
    });

    return apiSuccess({ taskId: task.id });
  } catch (error) {
    console.error(error);
    return apiError("TRY_ON_CREATE_FAILED", error instanceof Error ? error.message : "创建试衣任务失败", 500);
  }
}
