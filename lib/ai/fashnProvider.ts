import Fashn from "fashn";
import {
  mapGarmentTypeToFashnCategory,
  mapQualityToFashnMode
} from "@/lib/ai/garmentMapping";
import type { TryOnGenerateInput, TryOnGenerateResult, TryOnProvider } from "@/lib/ai/types";
import { TryOnProviderError } from "@/lib/ai/types";
import { validatePublicImageUrl } from "@/lib/url/validatePublicImageUrl";

const publicUrlError =
  "图片无法被 FASHN 访问，请确认 COS 图片 URL 可公网打开。";

export const fashnProvider: TryOnProvider = {
  name: "fashn",
  async generate(input: TryOnGenerateInput): Promise<TryOnGenerateResult> {
    validateInput(input);

    const modelImageUrl = input.personImageUrl || input.aiModelImageUrl;
    if (!modelImageUrl || !input.garmentImageUrl) {
      throw new TryOnProviderError("FASHN 需要同时提供人物图和服装图。");
    }

    if (!validatePublicImageUrl(input.garmentImageUrl) || !validatePublicImageUrl(modelImageUrl)) {
      throw new TryOnProviderError(publicUrlError);
    }

    const client = createFashnClient();
    let externalPredictionId: string | undefined;

    try {
      const subscribeRequest = {
        model_name: getModelName(),
        inputs: {
          model_image: modelImageUrl,
          garment_image: input.garmentImageUrl,
          category: mapGarmentTypeToFashnCategory(input.garmentType),
          mode: mapQualityToFashnMode(input.quality),
          return_base64: false
        },
        pollInterval: getNumberEnv("FASHN_POLL_INTERVAL_MS", 3000),
        timeout: getNumberEnv("FASHN_POLL_TIMEOUT_MS", 120000),
        onEnqueued: async (requestId: string) => {
          externalPredictionId = requestId;
          await input.onExternalPredictionId?.(requestId);
        }
      } as unknown as Parameters<typeof client.predictions.subscribe>[0];

      const response = await client.predictions.subscribe(subscribeRequest);

      externalPredictionId = response.id || externalPredictionId;
      if (externalPredictionId) {
        await input.onExternalPredictionId?.(externalPredictionId);
      }

      if (response.status === "time_out") {
        throw new TryOnProviderError("FASHN 生成超时，请稍后重试", {
          rawResponse: response,
          externalPredictionId
        });
      }

      if (response.status !== "completed") {
        throw new TryOnProviderError(toUserReadableFashnError(response), {
          rawResponse: response,
          externalPredictionId
        });
      }

      const resultImageUrl = extractResultImageUrl(response.output);
      if (!resultImageUrl) {
        throw new TryOnProviderError("FASHN 生成成功，但没有返回结果图片 URL。", {
          rawResponse: response,
          externalPredictionId
        });
      }

      return {
        resultImageUrl,
        provider: "fashn",
        externalPredictionId,
        rawResponse: response
      };
    } catch (error) {
      if (error instanceof TryOnProviderError) {
        throw error;
      }

      throw new TryOnProviderError(toUserReadableThrownError(error), {
        rawResponse: sanitizeThrownError(error),
        externalPredictionId
      });
    }
  }
};

function validateInput(input: TryOnGenerateInput) {
  if (!input.taskId) {
    throw new TryOnProviderError("Missing taskId");
  }

  if (!input.garmentImageUrl) {
    throw new TryOnProviderError("Missing garmentImageUrl");
  }

  if (!input.personImageUrl && !input.aiModelImageUrl) {
    throw new TryOnProviderError("Missing personImageUrl or aiModelImageUrl");
  }
}

function createFashnClient() {
  const apiKey = process.env.FASHN_API_KEY;
  if (!apiKey) {
    throw new TryOnProviderError("FASHN 配置错误，请检查 API Key");
  }

  return new Fashn({
    apiKey,
    baseURL: process.env.FASHN_API_BASE_URL || "https://api.fashn.ai"
  });
}

function getModelName() {
  return (process.env.FASHN_MODEL_NAME || "tryon-v1.6") as "tryon-v1.6";
}

function getNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function extractResultImageUrl(output: unknown) {
  if (Array.isArray(output)) {
    return output.find((item): item is string => typeof item === "string" && Boolean(item));
  }

  if (typeof output === "string") {
    return output;
  }

  if (output && typeof output === "object") {
    const record = output as Record<string, unknown>;
    if (typeof record.url === "string") return record.url;
    if (typeof record.image === "string") return record.image;
    if (typeof record.imageUrl === "string") return record.imageUrl;
  }

  return null;
}

function toUserReadableFashnError(response: { status: string; error?: unknown }) {
  if (response.status === "time_out") {
    return "生成时间过长，请稍后重试";
  }

  const technicalMessage = getTechnicalErrorMessage(response.error);
  return mapTechnicalError(technicalMessage) || `FASHN 生成失败，状态：${response.status}`;
}

function toUserReadableThrownError(error: unknown) {
  const technicalMessage = getTechnicalErrorMessage(error);
  return mapTechnicalError(technicalMessage) || "FASHN 生成失败，请稍后重试";
}

function mapTechnicalError(message: string) {
  const value = message.toLowerCase();

  if (value.includes("api key") || value.includes("unauthorized") || value.includes("authentication") || value.includes("401")) {
    return "FASHN 配置错误，请检查 API Key";
  }

  if (value.includes("image_load") || value.includes("imageload") || value.includes("load") || value.includes("url")) {
    return publicUrlError;
  }

  if (value.includes("format") || value.includes("unsupported")) {
    return "图片格式不支持，请上传 JPG、PNG 或 WEBP";
  }

  if (value.includes("pose") || value.includes("person") || value.includes("model_image")) {
    return "人物图不符合试衣要求，请上传清晰正面人物图";
  }

  if (value.includes("garment") || value.includes("product") || value.includes("clothing")) {
    return "服装图不符合试衣要求，请上传清晰、无遮挡的服装正面图";
  }

  if (value.includes("timeout") || value.includes("time_out") || value.includes("polling")) {
    return "生成时间过长，请稍后重试";
  }

  return "";
}

function getTechnicalErrorMessage(error: unknown): string {
  if (!error) return "";

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    return [record.name, record.message, record.code, record.status]
      .filter((item): item is string | number => typeof item === "string" || typeof item === "number")
      .join(" ");
  }

  return "";
}

function sanitizeThrownError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return error;
}
