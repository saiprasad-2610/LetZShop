import * as fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

export function avifFallbackFormat(accept = ''): 'webp' | 'png' | null {
  const types = accept
    .toLowerCase()
    .split(',')
    .map((value) => {
      const [mime, ...parameters] = value.trim().split(';');
      const quality = parameters.find((parameter) =>
        parameter.trim().startsWith('q='),
      );
      return {
        mime,
        accepted: !quality || Number(quality.trim().slice(2)) > 0,
      };
    });
  const accepts = (mime: string) =>
    types.some((type) => type.mime === mime && type.accepted);
  // A generic API/file download keeps the original. Image requests advertise their codecs.
  if (
    !types.some((type) => type.mime.startsWith('image/')) ||
    accepts('image/avif')
  )
    return null;
  return accepts('image/webp') ? 'webp' : 'png';
}

// Deduplicate by full tenant/store asset path + format. Never cache by a global storefront key.
const pending = new Map<string, Promise<string>>();
let active = 0;
const waiters: Array<() => void> = [];
async function conversionSlot() {
  if (active >= 2) await new Promise<void>((resolve) => waiters.push(resolve));
  else active++;
  return () => {
    const next = waiters.shift();
    if (next) next();
    else active--;
  };
}

/** Keep the original AVIF and its persisted URL; cache a bounded compatibility derivative beside it. */
export async function compatibleAvifFile(
  source: string,
  format: 'webp' | 'png',
): Promise<string> {
  const output = `${source}.compat.${format}`;
  const existing = pending.get(output);
  if (existing) return existing;
  const work = (async () => {
    const original = await fs.stat(source);
    const cached = await fs.stat(output).catch(() => null);
    if (cached && cached.mtimeMs >= original.mtimeMs) return output;
    const release = await conversionSlot();
    const temporary = `${output}.${randomUUID()}.tmp`;
    try {
      await sharp(source, { limitInputPixels: 40000000, sequentialRead: true })
        .rotate()
        .toFormat(format)
        .toFile(temporary);
      // Do not publish a derivative if the merchant removed/replaced the source during conversion.
      const current = await fs.stat(source);
      if (
        current.mtimeMs !== original.mtimeMs ||
        current.size !== original.size
      )
        throw new Error('Image changed during conversion.');
      await fs.rename(temporary, output);
      return output;
    } finally {
      await fs.unlink(temporary).catch(() => undefined);
      release();
    }
  })();
  pending.set(output, work);
  try {
    return await work;
  } finally {
    pending.delete(output);
  }
}

export async function convertAvifBuffer(
  buffer: Buffer,
  format: 'webp' | 'png',
): Promise<Buffer> {
  const release = await conversionSlot();
  try {
    return await sharp(buffer, { limitInputPixels: 40000000, sequentialRead: true })
      .rotate()
      .toFormat(format)
      .toBuffer();
  } finally {
    release();
  }
}

