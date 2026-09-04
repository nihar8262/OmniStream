import crypto from "crypto";

const SECRET = process.env.TOKEN_SECRET || "ig-media-downloader-super-secret-key-32chars!";
// 32-byte key derived with SHA-256
const KEY = crypto.createHash("sha256").update(SECRET).digest();
const TOKEN_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

export interface TokenPayload {
  url: string;
  type: "image" | "video";
  filename?: string;
  exp: number;
}

/**
 * Creates an encrypted opaque token containing upstream URL and metadata.
 */
export function createMediaToken(url: string, type: "image" | "video", filename?: string): string {
  const payload: TokenPayload = {
    url,
    type,
    filename,
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const jsonStr = JSON.stringify(payload);
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  
  let encrypted = cipher.update(jsonStr, "utf8", "base64url");
  encrypted += cipher.final("base64url");
  const authTag = cipher.getAuthTag().toString("base64url");

  // Format: iv.authTag.encrypted
  return `${iv.toString("base64url")}.${authTag}.${encrypted}`;
}

/**
 * Verifies and decodes an opaque token. Returns null if invalid or expired.
 */
export function verifyMediaToken(token: string): TokenPayload | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [ivB64, authTagB64, encrypted] = parts;
    const iv = Buffer.from(ivB64, "base64url");
    const authTag = Buffer.from(authTagB64, "base64url");

    if (iv.length !== 12 || authTag.length !== 16) return null;

    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "base64url", "utf8");
    decrypted += decipher.final("utf8");

    const payload = JSON.parse(decrypted) as TokenPayload;

    if (!payload.url || !payload.exp || Date.now() > payload.exp) {
      return null;
    }

    // Ensure URL is a valid http/https URL
    const parsed = new URL(payload.url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
