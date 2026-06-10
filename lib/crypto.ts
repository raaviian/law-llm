import "server-only";
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { env } from "@/lib/env";

// 32-byte key derived from ENCRYPTION_KEY (preferred) or AUTH_SECRET. Changing
// either invalidates previously stored secrets (they'd need re-entering).
function key(): Buffer {
  const material = env.encryptionKey || env.authSecret || "lexboard-dev-key";
  return createHash("sha256").update(material).digest();
}

/** Encrypt a string with AES-256-GCM. Returns "v1:iv:tag:ciphertext" (base64). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

/** Decrypt a value produced by encryptSecret. Returns null if it can't decrypt. */
export function decryptSecret(value: string): string | null {
  try {
    const [v, ivB64, tagB64, ctB64] = value.split(":");
    if (v !== "v1") return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key(),
      Buffer.from(ivB64, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const pt = Buffer.concat([
      decipher.update(Buffer.from(ctB64, "base64")),
      decipher.final(),
    ]);
    return pt.toString("utf8");
  } catch {
    return null;
  }
}
