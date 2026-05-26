import type { TryOnGenerateInput, TryOnGenerateResult, TryOnProvider } from "@/lib/ai/types";

export const mockProvider: TryOnProvider = {
  name: "mock",
  async generate(input: TryOnGenerateInput): Promise<TryOnGenerateResult> {
    validateInput(input);
    await wait(randomBetween(2000, 3000));

    return {
      resultImageUrl: "/mock/result-placeholder.jpg",
      provider: "mock",
      rawResponse: {
        taskId: input.taskId,
        mode: "mock",
        garmentType: input.garmentType,
        aspectRatio: input.aspectRatio,
        quality: input.quality || "standard",
        message: "Mock try-on generation completed"
      }
    };
  }
};

function validateInput(input: TryOnGenerateInput) {
  if (!input.taskId) {
    throw new Error("Missing taskId");
  }

  if (!input.garmentImageUrl) {
    throw new Error("Missing garmentImageUrl");
  }

  if (!input.personImageUrl && !input.aiModelImageUrl) {
    throw new Error("Missing personImageUrl or aiModelImageUrl");
  }

  if (!input.garmentType) {
    throw new Error("Missing garmentType");
  }

  if (!input.aspectRatio) {
    throw new Error("Missing aspectRatio");
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
