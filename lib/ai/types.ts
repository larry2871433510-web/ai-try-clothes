export type TryOnProviderName = "mock" | "fashn";

export type TryOnGenerateInput = {
  taskId: string;
  garmentImageUrl: string;
  personImageUrl?: string;
  aiModelImageUrl?: string;
  garmentType: string;
  aspectRatio: string;
  quality?: string;
  onExternalPredictionId?: (externalPredictionId: string) => Promise<void> | void;
};

export type TryOnGenerateResult = {
  resultImageUrl: string;
  provider: TryOnProviderName;
  externalPredictionId?: string;
  rawResponse?: unknown;
};

export type TryOnProvider = {
  name: TryOnProviderName;
  generate: (input: TryOnGenerateInput) => Promise<TryOnGenerateResult>;
};

export class TryOnProviderError extends Error {
  rawResponse?: unknown;
  externalPredictionId?: string;

  constructor(message: string, options?: { rawResponse?: unknown; externalPredictionId?: string }) {
    super(message);
    this.name = "TryOnProviderError";
    this.rawResponse = options?.rawResponse;
    this.externalPredictionId = options?.externalPredictionId;
  }
}
