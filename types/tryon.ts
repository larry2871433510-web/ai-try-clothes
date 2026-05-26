export const garmentOptions = [
  { label: "T恤", value: "T_SHIRT" },
  { label: "衬衫", value: "SHIRT" },
  { label: "卫衣", value: "HOODIE" },
  { label: "外套", value: "COAT" },
  { label: "裤子", value: "PANTS" },
  { label: "裙子", value: "SKIRT" },
  { label: "连衣裙", value: "DRESS" }
] as const;

export const aspectRatioOptions = [
  { label: "1:1", value: "RATIO_1_1" },
  { label: "3:4", value: "RATIO_3_4" },
  { label: "4:5", value: "RATIO_4_5" },
  { label: "9:16", value: "RATIO_9_16" }
] as const;

export const qualityOptions = [
  { label: "速度优先", value: "standard", description: "更快返回，适合批量预览。" },
  { label: "质量优先", value: "high", description: "更重视细节，耗时可能更长。" }
] as const;

export const statusLabels: Record<string, string> = {
  PENDING: "等待中",
  PROCESSING: "生成中",
  SUCCESS: "已完成",
  FAILED: "失败"
};

export const builtInModels = [
  {
    id: "model-editorial-female",
    name: "Editorial 女模",
    style: "清爽棚拍",
    imageUrl: "/models/editorial-female.svg"
  },
  {
    id: "model-street-male",
    name: "Street 男模",
    style: "自然街拍",
    imageUrl: "/models/street-male.svg"
  },
  {
    id: "model-minimal-neutral",
    name: "Neutral 模特",
    style: "极简中性",
    imageUrl: "/models/neutral.svg"
  }
] as const;

export type GarmentTypeValue = (typeof garmentOptions)[number]["value"];
export type AspectRatioValue = (typeof aspectRatioOptions)[number]["value"];
export type QualityValue = (typeof qualityOptions)[number]["value"];
