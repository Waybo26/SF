import { scrypt, randomBytes, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

/**
 * Hash a plain-text password using scrypt with a random salt.
 * Returns a string in the format "salt:hash" (both hex-encoded).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");

  const hash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });

  return `${salt}:${hash.toString("hex")}`;
}

/**
 * Verify a plain-text password against a stored "salt:hash" string.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;

  const hash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });

  return timingSafeEqual(Buffer.from(storedHash, "hex"), hash);
}
