"use client";

import { useRef, useState } from "react";
import { parseApiResponse } from "@/types/api";

type UploadResult = {
  url: string;
  imageUrl: string;
  key?: string;
  provider?: string;
  width?: number;
  height?: number;
};

export function ImageUpload({
  label,
  value,
  onChange,
  required,
  folder,
  helper
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
  folder?: "garments" | "persons" | "models" | "results";
  helper?: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState("");

  async function handleFile(file?: File) {
    setError("");
    setMeta("");
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("仅支持 jpg、jpeg、png、webp 图片");
      onChange("");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("图片不能超过 10MB");
      onChange("");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder || "garments");

    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await parseApiResponse<UploadResult>(response);
      onChange(data.url || data.imageUrl);
      setMeta(data.width && data.height ? `${data.width}x${data.height}` : "上传成功");
    } catch (err) {
      onChange("");
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="block text-sm font-medium">
          {label}
          {required ? <span className="text-red-600"> *</span> : null}
        </span>
        <span className="text-xs text-black/45">jpg / jpeg / png / webp，最大 10MB</span>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`image-checker relative flex min-h-[240px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border bg-white text-left transition ${
          error ? "border-red-300" : value ? "border-emerald-300" : "border-black/15 hover:border-black/30"
        }`}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="h-full max-h-[320px] w-full object-contain" />
            <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
              上传成功{meta ? ` · ${meta}` : ""}
            </span>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-white shadow-sm">
              点击重新上传
            </span>
          </>
        ) : (
          <div className="px-6 text-center text-sm text-black/55">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-ink" />
                上传中...
              </span>
            ) : (
              "点击选择图片"
            )}
            <div className="mt-2 text-xs leading-5">建议宽高不低于 512x512，图片越清晰，生成越稳定。</div>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {helper ? <div className="mt-3">{helper}</div> : null}
      {error ? <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">{error}</p> : null}
    </div>
  );
}
