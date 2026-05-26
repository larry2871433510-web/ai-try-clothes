import { randomUUID } from "crypto";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { uploadFile } from "@/lib/storage/storageService";
import { StorageProviderConfigError, type UploadFolder } from "@/lib/storage/types";

export const runtime = "nodejs";

const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const maxSize = 10 * 1024 * 1024;
const minDimension = 512;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!isUploadFile(file)) {
      return uploadError("NO_FILE", "请选择要上传的图片");
    }

    if (!allowedTypes.includes(file.type)) {
      return uploadError("INVALID_FILE_TYPE", "仅支持 jpg、jpeg、png、webp 图片");
    }

    if (file.size > maxSize) {
      return uploadError("FILE_TOO_LARGE", "图片大小不能超过 10MB");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dimensions = getImageDimensions(buffer, file.type);

    if (!dimensions) {
      return uploadError("INVALID_IMAGE", "无法读取图片宽高，请上传有效的 jpg、jpeg、png 或 webp 图片");
    }

    if (dimensions.width < minDimension || dimensions.height < minDimension) {
      return uploadError(
        "IMAGE_TOO_SMALL",
        `图片宽高不能小于 ${minDimension}x${minDimension}，当前为 ${dimensions.width}x${dimensions.height}`
      );
    }

    const ext = extensionFromType(file.type);
    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    const folder = getUploadFolder(formData);
    const uploaded = await uploadFile({
      buffer,
      filename,
      contentType: file.type,
      folder
    });

    return apiSuccess({
      url: uploaded.url,
      imageUrl: uploaded.url,
      key: uploaded.key,
      provider: uploaded.provider,
      contentType: uploaded.contentType,
      size: uploaded.size,
      width: dimensions.width,
      height: dimensions.height
    });
  } catch (error) {
    if (error instanceof StorageProviderConfigError) {
      return uploadError(error.code, error.message, 500);
    }

    console.error(error instanceof Error ? error.message : "Upload failed");
    return uploadError("UPLOAD_FAILED", "上传失败，请稍后重试", 500);
  }
}

function uploadError(code: string, message: string, status = 400) {
  return apiError(code, message, status);
}

function isUploadFile(file: FormDataEntryValue | null): file is File {
  return Boolean(
    file &&
      typeof file !== "string" &&
      "type" in file &&
      "size" in file &&
      "arrayBuffer" in file &&
      typeof file.type === "string" &&
      typeof file.size === "number" &&
      typeof file.arrayBuffer === "function"
  );
}

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function getUploadFolder(formData: FormData): UploadFolder {
  const folder = formData.get("folder");
  if (folder === "garment" || folder === "garments") {
    return "garments";
  }

  if (folder === "person" || folder === "persons") {
    return "persons";
  }

  if (folder === "model" || folder === "models") {
    return "models";
  }

  if (folder === "result" || folder === "results") {
    return "results";
  }

  return "garments";
}

function getImageDimensions(buffer: Buffer, type: string) {
  if (type === "image/png") return getPngDimensions(buffer);
  if (type === "image/webp") return getWebpDimensions(buffer);
  if (type === "image/jpeg" || type === "image/jpg") return getJpegDimensions(buffer);
  return null;
}

function getPngDimensions(buffer: Buffer) {
  const isPng = buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG";
  if (!isPng) return null;

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function getJpegDimensions(buffer: Buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if (isJpegStartOfFrame(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7)
      };
    }

    offset += 2 + length;
  }

  return null;
}

function isJpegStartOfFrame(marker: number) {
  return (
    marker === 0xc0 ||
    marker === 0xc1 ||
    marker === 0xc2 ||
    marker === 0xc3 ||
    marker === 0xc5 ||
    marker === 0xc6 ||
    marker === 0xc7 ||
    marker === 0xc9 ||
    marker === 0xca ||
    marker === 0xcb ||
    marker === 0xcd ||
    marker === 0xce ||
    marker === 0xcf
  );
}

function getWebpDimensions(buffer: Buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }

  const format = buffer.toString("ascii", 12, 16);

  if (format === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3)
    };
  }

  if (format === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff
    };
  }

  if (format === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1
    };
  }

  return null;
}
