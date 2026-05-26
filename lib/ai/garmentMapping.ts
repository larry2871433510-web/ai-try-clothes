export type FashnCategory = "tops" | "bottoms" | "one-pieces";
export type FashnAspectRatio = "1:1" | "3:4" | "4:5" | "9:16";
export type TryOnQuality = "standard" | "high";
export type FashnMode = "performance" | "quality";

export function mapGarmentTypeToFashnCategory(garmentType: string): FashnCategory {
  if (garmentType === "PANTS" || garmentType === "SKIRT") {
    return "bottoms";
  }

  if (garmentType === "DRESS") {
    return "one-pieces";
  }

  return "tops";
}

export function mapAspectRatioToFashnAspectRatio(aspectRatio: string): FashnAspectRatio {
  if (aspectRatio === "RATIO_1_1") return "1:1";
  if (aspectRatio === "RATIO_4_5") return "4:5";
  if (aspectRatio === "RATIO_9_16") return "9:16";
  return "3:4";
}

export function normalizeTryOnQuality(value?: string | null): TryOnQuality {
  return value === "high" ? "high" : "standard";
}

export function mapQualityToFashnMode(quality?: string | null): FashnMode {
  return normalizeTryOnQuality(quality) === "high" ? "quality" : "performance";
}
