export type StorageProviderName = "local" | "cos";
export type UploadFolder = "garments" | "persons" | "models" | "results";

export type UploadFileInput = {
  buffer: Buffer;
  filename: string;
  contentType: string;
  folder?: string;
};

export type UploadFileResult = {
  url: string;
  key: string;
  provider: StorageProviderName;
  contentType: string;
  size: number;
};

export type StorageProvider = {
  name: StorageProviderName;
  uploadFile: (input: UploadFileInput) => Promise<UploadFileResult>;
};

export class StorageProviderConfigError extends Error {
  code = "STORAGE_CONFIG_MISSING";

  constructor(message: string) {
    super(message);
    this.name = "StorageProviderConfigError";
  }
}
