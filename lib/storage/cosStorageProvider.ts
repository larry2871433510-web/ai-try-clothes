import { randomUUID } from "crypto";
import COS from "cos-nodejs-sdk-v5";
import type { StorageProvider, UploadFileInput, UploadFileResult } from "@/lib/storage/types";
import { StorageProviderConfigError } from "@/lib/storage/types";

type CosConfig = {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  publicBaseUrl: string;
};

export const cosStorageProvider: StorageProvider = {
  name: "cos",
  async uploadFile(input: UploadFileInput): Promise<UploadFileResult> {
    const config = getCosConfig();
    const folder = normalizeFolder(input.folder);
    const key = `${folder}/${formatDatePath(new Date())}/${randomUUID()}${getExtension(input.filename)}`;

    const client = new COS({
      SecretId: config.secretId,
      SecretKey: config.secretKey
    });

    await putObject(client, {
      Bucket: config.bucket,
      Region: config.region,
      Key: key,
      Body: input.buffer,
      ContentType: input.contentType
    });

    return {
      url: `${trimTrailingSlash(config.publicBaseUrl)}/${key}`,
      key,
      provider: "cos",
      contentType: input.contentType,
      size: input.buffer.length
    };
  }
};

function getCosConfig(): CosConfig {
  const missing = [
    ["COS_SECRET_ID", process.env.COS_SECRET_ID],
    ["COS_SECRET_KEY", process.env.COS_SECRET_KEY],
    ["COS_BUCKET", process.env.COS_BUCKET],
    ["COS_REGION", process.env.COS_REGION],
    ["COS_PUBLIC_BASE_URL", process.env.COS_PUBLIC_BASE_URL]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new StorageProviderConfigError(
      "腾讯云 COS 配置缺失，请检查 COS_SECRET_ID、COS_SECRET_KEY、COS_BUCKET、COS_REGION、COS_PUBLIC_BASE_URL。"
    );
  }

  return {
    secretId: process.env.COS_SECRET_ID as string,
    secretKey: process.env.COS_SECRET_KEY as string,
    bucket: process.env.COS_BUCKET as string,
    region: process.env.COS_REGION as string,
    publicBaseUrl: process.env.COS_PUBLIC_BASE_URL as string
  };
}

function putObject(
  client: COS,
  params: {
    Bucket: string;
    Region: string;
    Key: string;
    Body: Buffer;
    ContentType: string;
  }
) {
  return new Promise<void>((resolve, reject) => {
    client.putObject(params, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function formatDatePath(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}/${month}`;
}

function getExtension(filename: string) {
  const match = filename.match(/\.[a-zA-Z0-9]+$/);
  return match ? match[0].toLowerCase() : "";
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeFolder(folder?: string) {
  if (!folder) return "garments";
  return folder.replace(/[^a-zA-Z0-9-_/]/g, "").replace(/^\/+|\/+$/g, "") || "garments";
}
