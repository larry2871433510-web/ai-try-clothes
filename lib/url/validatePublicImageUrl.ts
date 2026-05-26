export function validatePublicImageUrl(url?: string | null) {
  if (!url) return false;

  const value = url.trim();
  if (!value) return false;

  const lowerValue = value.toLowerCase();
  if (
    value.startsWith("/") ||
    lowerValue.startsWith("file://") ||
    lowerValue.startsWith("blob:") ||
    lowerValue.startsWith("data:")
  ) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  return hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "0.0.0.0";
}
