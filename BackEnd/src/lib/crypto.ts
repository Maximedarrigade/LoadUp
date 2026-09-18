import crypto from "crypto";

function getMasterKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY manquante ou invalide (attendu : 64 caractères hex).");
  }
  return Buffer.from(key, "hex");
}

function deriveKey(purpose: string) {
  return crypto.createHmac("sha256", getMasterKey()).update(purpose).digest();
}

export function encryptDeterministic(plaintext: string): string {
  const encKey = deriveKey("loadup:enc");
  const ivKey = deriveKey("loadup:iv");
  const iv = crypto.createHmac("sha256", ivKey).update(plaintext).digest().subarray(0, 12);

  const cipher = crypto.createCipheriv("aes-256-gcm", encKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decrypt(stored: string): string {
  const [ivB64, tagB64, ciphertextB64] = stored.split(":");
  if (!ivB64 || !tagB64 || !ciphertextB64) {
    throw new Error("Valeur chiffrée invalide.");
  }

  const encKey = deriveKey("loadup:enc");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", encKey, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
