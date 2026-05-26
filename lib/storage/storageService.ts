import { localStorageProvider } from "@/lib/storage/localStorageProvider";
import { cosStorageProvider } from "@/lib/storage/cosStorageProvider";
import type { StorageProvider, StorageProviderName, UploadFileInput } from "@/lib/storage/types";

export async function uploadFile(input: UploadFileInput) {
  return getStorageProvider().uploadFile(input);
}

function getStorageProvider(): StorageProvider {
  const providerName = (process.env.STORAGE_PROVIDER || "local") as StorageProviderName;

  if (process.env.NODE_ENV === "production" && providerName === "local") {
    throw new Error("生产环境必须配置 STORAGE_PROVIDER=cos，不能使用本地 /uploads 存储。");
  }

  if (providerName === "local") {
    return localStorageProvider;
  }

  if (providerName === "cos") {
    return cosStorageProvider;
  }

  // TODO: Register more cloud storage providers here, for example S3.
  throw new Error(`Unsupported storage provider: ${providerName}`);
}
