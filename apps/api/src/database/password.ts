import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, storedHash] = stored.split(":");
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256");
  return timingSafeEqual(Buffer.from(storedHash, "hex"), hash);
}
