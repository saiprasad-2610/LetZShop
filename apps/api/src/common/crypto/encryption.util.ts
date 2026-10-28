import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const PREFIX = 'enc:v1:';

function getEncryptionKey(): Buffer {
  const secret =
    process.env.CREDENTIALS_ENCRYPTION_KEY ||
    process.env.ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'aikyam-letzshop-prod-default-master-key-32b';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plaintext secret string using AES-256-GCM.
 * Output format: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encryptSecret(plaintext?: string | null): string {
  if (!plaintext || typeof plaintext !== 'string') return '';
  // Avoid double encryption
  if (plaintext.startsWith(PREFIX)) return plaintext;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${PREFIX}${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a ciphertext string encrypted with encryptSecret.
 * If the string does not start with enc:v1:, it is treated as a legacy or plaintext value
 * and returned directly for backwards-compatibility.
 */
export function decryptSecret(encryptedOrPlaintext?: string | null): string {
  if (!encryptedOrPlaintext || typeof encryptedOrPlaintext !== 'string') return '';
  if (!encryptedOrPlaintext.startsWith(PREFIX)) {
    return encryptedOrPlaintext;
  }

  try {
    const parts = encryptedOrPlaintext.slice(PREFIX.length).split(':');
    if (parts.length !== 3) {
      return encryptedOrPlaintext;
    }
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err: any) {
    console.error('Failed to decrypt secret:', err.message);
    return encryptedOrPlaintext;
  }
}
