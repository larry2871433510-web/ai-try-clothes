import { AspectRatio, GarmentType, TryOnTaskStatus } from "@prisma/client";
import { fashnProvider } from "@/lib/ai/fashnProvider";
import { normalizeTryOnQuality } from "@/lib/ai/garmentMapping";
import { mockProvider } from "@/lib/ai/mockProvider";
import { TryOnProviderError, type TryOnProvider, type TryOnProviderName } from "@/lib/ai/types";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/storage/storageService";

export type CreateTryOnInput = {
  garmentImageUrl: string;
  personImageUrl?: string | null;
  aiModelId?: string | null;
  garmentType: GarmentType;
  aspectRatio: AspectRatio;
  quality?: string | null;
};

export async function createTryOnTask(input: CreateTryOnInput) {
  let aiModelImageUrl: string | null = null;

  if (input.aiModelId) {
    const model = await prisma.aiModel.findFirst({
      where: {
        id: input.aiModelId,
        isActive: true
      }
    });

    if (!model) {
      throw new Error("Selected AI model does not exist or is inactive");
    }

    aiModelImageUrl = model.imageUrl;
  }

  const provider = getTryOnProvider();
  const quality = normalizeTryOnQuality(input.quality);

  const task = await prisma.tryOnTask.create({
    data: {
      garmentImageUrl: input.garmentImageUrl,
      personImageUrl: input.personImageUrl || null,
      aiModelId: input.aiModelId || null,
      garmentType: input.garmentType,
      aspectRatio: input.aspectRatio,
      quality,
      status: TryOnTaskStatus.PROCESSING,
      provider: provider.name,
      startedAt: new Date()
    }
  });

  try {
    const generation = await provider.generate({
      garmentImageUrl: input.garmentImageUrl,
      personImageUrl: input.personImageUrl || undefined,
      aiModelImageUrl: aiModelImageUrl || undefined,
      garmentType: input.garmentType,
      aspectRatio: input.aspectRatio,
      quality,
      taskId: task.id,
      onExternalPredictionId: async (externalPredictionId) => {
        await prisma.tryOnTask.update({
          where: { id: task.id },
          data: {
            externalPredictionId,
            startedAt: new Date()
          }
        });
      }
    });

    const persistedResult = await persistResultImageIfNeeded({
      taskId: task.id,
      generation
    });

    const finishedTask = await prisma.tryOnTask.update({
      where: { id: task.id },
      data: {
        status: TryOnTaskStatus.SUCCESS,
        resultImageUrl: persistedResult.resultImageUrl,
        provider: generation.provider,
        externalPredictionId: generation.externalPredictionId || undefined,
        rawResponse: toPrismaJson(persistedResult.rawResponse),
        errorMessage: persistedResult.errorMessage,
        finishedAt: new Date()
      }
    });

    return finishedTask;
  } catch (error) {
    const providerError = error instanceof TryOnProviderError ? error : null;
    await prisma.tryOnTask.update({
      where: { id: task.id },
      data: {
        status: TryOnTaskStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "AI try-on generation failed",
        externalPredictionId: providerError?.externalPredictionId || undefined,
        rawResponse: toPrismaJson(providerError?.rawResponse),
        finishedAt: new Date()
      }
    });

    throw error;
  }
}

export const createMockTryOnTask = createTryOnTask;

function getTryOnProvider(): TryOnProvider {
  const providerName = (process.env.AI_PROVIDER || "mock") as TryOnProviderName;

  if (providerName === "mock") {
    return mockProvider;
  }

  if (providerName === "fashn") {
    return fashnProvider;
  }

  throw new Error(`Unsupported AI provider: ${providerName}`);
}

function toPrismaJson(value: unknown) {
  if (value === undefined) return undefined;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return {
      serializationError: "Failed to serialize provider raw response"
    };
  }
}

async function persistResultImageIfNeeded({
  taskId,
  generation
}: {
  taskId: string;
  generation: {
    resultImageUrl: string;
    provider: TryOnProviderName;
    rawResponse?: unknown;
  };
}) {
  if (generation.provider !== "fashn") {
    return {
      resultImageUrl: generation.resultImageUrl,
      rawResponse: generation.rawResponse,
      errorMessage: null
    };
  }

  try {
    const downloaded = await downloadImage(generation.resultImageUrl);
    const uploaded = await uploadFile({
      buffer: downloaded.buffer,
      filename: `${taskId}${downloaded.extension}`,
      contentType: downloaded.contentType,
      folder: "results"
    });

    return {
      resultImageUrl: uploaded.url,
      rawResponse: {
        original: generation.rawResponse,
        fashnOutputUrl: generation.resultImageUrl,
        persistedResult: {
          url: uploaded.url,
          key: uploaded.key,
          provider: uploaded.provider,
          contentType: uploaded.contentType,
          size: uploaded.size
        }
      },
      errorMessage: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`结果图回存 COS 失败: ${message}`);

    return {
      resultImageUrl: generation.resultImageUrl,
      rawResponse: {
        original: generation.rawResponse,
        fashnOutputUrl: generation.resultImageUrl,
        persistResultError: "结果图回存 COS 失败"
      },
      errorMessage: "结果图回存 COS 失败，已暂时使用 FASHN 原始结果图"
    };
  }
}

async function downloadImage(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`download failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("image/")) {
    throw new Error(`invalid content-type: ${contentType || "unknown"}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
    extension: extensionFromContentType(contentType, url)
  };
}

function extensionFromContentType(contentType: string, url: string) {
  const normalized = contentType.toLowerCase();
  if (normalized.includes("png")) return ".png";
  if (normalized.includes("webp")) return ".webp";
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return ".jpg";

  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(jpg|jpeg|png|webp)$/i);
    if (match) return `.${match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase()}`;
  } catch {
    // Ignore URL parsing errors and use a safe default.
  }

  return ".jpg";
}
