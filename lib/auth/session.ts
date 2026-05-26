export const adminSessionCookieName = "ai_tryon_admin_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

export type AdminSession = {
  admin: true;
  username: string;
  exp: number;
};

export type SessionCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge?: number;
  expires?: Date;
};

export async function createAdminSession() {
  const username = process.env.ADMIN_USERNAME;
  if (!username) {
    throw new Error("ADMIN_USERNAME 未配置");
  }

  const exp = Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds;
  const session: AdminSession = {
    admin: true,
    username,
    exp
  };

  return {
    name: adminSessionCookieName,
    value: await signSession(session),
    options: getSessionCookieOptions()
  };
}

export async function verifyAdminSession(value?: string | null): Promise<AdminSession | null> {
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = await createSignature(payload);
  if (!safeEqual(signature, expected)) return null;

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as AdminSession;
    if (!session.admin || !session.username || !session.exp) return null;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    if (process.env.ADMIN_USERNAME && session.username !== process.env.ADMIN_USERNAME) return null;
    return session;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  return {
    name: adminSessionCookieName,
    value: "",
    options: {
      ...getSessionCookieOptions(),
      maxAge: 0,
      expires: new Date(0)
    }
  };
}

export async function getCurrentAdmin() {
  const { cookies } = await import("next/headers");
  const value = cookies().get(adminSessionCookieName)?.value;
  return verifyAdminSession(value);
}

function getSessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds
  };
}

async function signSession(session: AdminSession) {
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = await createSignature(payload);
  return `${payload}.${signature}`;
}

async function createSignature(payload: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET 未配置");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function base64UrlEncode(value: string) {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function base64UrlEncodeBytes(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}
