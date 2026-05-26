import { apiError, apiSuccess } from "@/lib/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return apiError("NOT_FOUND", "Not found", 404);
  }

  return apiSuccess({
    hasApiKey: Boolean(process.env.FASHN_API_KEY),
    baseUrlConfigured: Boolean(process.env.FASHN_API_BASE_URL || "https://api.fashn.ai"),
    modelName: process.env.FASHN_MODEL_NAME || "tryon-v1.6"
  });
}
