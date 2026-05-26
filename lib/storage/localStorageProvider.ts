import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { StorageProvider, UploadFileInput, UploadFileResult } from "@/lib/storage/types";

export const localStorageProvider: StorageProvider = {
  name: "local",
  async uploadFile(input: UploadFileInput): Promise<UploadFileResult> {
    const folder = normalizeFolder(input.folder);
    const filename = sanitizeFilename(input.filename);
    const relativeKey = folder ? `${folder}/${filename}` : filename;
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), input.buffer);

    return {
      url: `/uploads/${relativeKey}`,
      key: relativeKey,
      provider: "local",
      contentType: input.contentType,
      size: input.buffer.length
    };
  }
};

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9-_.]/g, "");
}

function normalizeFolder(folder?: string) {
  if (!folder) return "garments";
  return folder.replace(/[^a-zA-Z0-9-_/]/g, "").replace(/^\/+|\/+$/g, "") || "garments";
}
