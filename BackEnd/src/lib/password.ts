import argon2 from "argon2";

// Minimum Argon2id settings recommended by the OWASP Password Storage Cheat Sheet
// (19 MiB, 2 iterations, parallelism 1). Much lighter on memory than the library
// defaults (64 MiB, t=3, p=4) previously used, which could get the backend
// OOM-killed on our small AlwaysData instance.
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string) {
  return argon2.hash(password, HASH_OPTIONS);
}

// Hashes store their own parameters, so older ones (64 MiB, t=3, p=4) still verify.
export function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export function passwordNeedsRehash(hash: string) {
  return !hash.startsWith("$argon2id$") || argon2.needsRehash(hash, HASH_OPTIONS);
}
