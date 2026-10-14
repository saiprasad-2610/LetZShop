/**
 * Product Image Validation & Magic Byte Sniffing
 *
 * Provides shared, zero-dependency binary validation for uploaded product images
 * across both the seller web app (browser) and the backend API (Node.js).
 */

export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PRODUCT_IMAGES_PER_PRODUCT = 3;

export const SUPPORTED_PRODUCT_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export type SupportedProductImageMimeType = (typeof SUPPORTED_PRODUCT_IMAGE_MIME_TYPES)[number];

export interface ImageDetectionResult {
  mimeType: string;
  extension: string;
  isSupportedProductFormat: boolean;
  isHeic: boolean;
}

export interface ImageValidationResult {
  isValid: boolean;
  mimeType?: SupportedProductImageMimeType;
  extension?: string;
  error?: string;
}

/**
 * Detects the real image format and MIME type directly from the file's binary header (magic bytes).
 * Supports Uint8Array (works in browser ArrayBuffer views) and Node.js Buffer.
 */
export function detectImageFormatFromBytes(bytes: Uint8Array): ImageDetectionResult | null {
  if (!bytes || bytes.length < 4) {
    return null;
  }

  // 1. JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return {
      mimeType: 'image/jpeg',
      extension: '.jpg',
      isSupportedProductFormat: true,
      isHeic: false,
    };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return {
      mimeType: 'image/png',
      extension: '.png',
      isSupportedProductFormat: true,
      isHeic: false,
    };
  }

  // 3. WebP: RIFF .... WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 && // "RIFF"
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50 // "WEBP"
  ) {
    return {
      mimeType: 'image/webp',
      extension: '.webp',
      isSupportedProductFormat: true,
      isHeic: false,
    };
  }

  // 4. ISO Base Media File Format (ISOBMFF) boxes: AVIF, HEIC, HEIF
  // Bytes 4..7 === 'ftyp' (0x66 0x74 0x79 0x70)
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    // Read the brand string in bytes 8..min(64, length)
    const maxLen = Math.min(bytes.length, 64);
    let brandAscii = '';
    for (let i = 8; i < maxLen; i++) {
      brandAscii += String.fromCharCode(bytes[i]);
    }
    const lowerBrands = brandAscii.toLowerCase();

    // Check AVIF first (avif, avis)
    if (lowerBrands.includes('avif') || lowerBrands.includes('avis')) {
      return {
        mimeType: 'image/avif',
        extension: '.avif',
        isSupportedProductFormat: true,
        isHeic: false,
      };
    }

    // Check HEIC / HEIF (heic, heix, hevc, hevx, mif1, msf1)
    if (
      lowerBrands.includes('heic') ||
      lowerBrands.includes('heix') ||
      lowerBrands.includes('hevc') ||
      lowerBrands.includes('hevx') ||
      lowerBrands.includes('mif1') ||
      lowerBrands.includes('msf1')
    ) {
      return {
        mimeType: 'image/heic',
        extension: '.heic',
        isSupportedProductFormat: false,
        isHeic: true,
      };
    }
  }

  // 5. GIF (for informative rejection message)
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return {
      mimeType: 'image/gif',
      extension: '.gif',
      isSupportedProductFormat: false,
      isHeic: false,
    };
  }

  // 6. SVG (for informative rejection message)
  if (bytes.length >= 8) {
    let textSlice = '';
    const sliceLen = Math.min(bytes.length, 128);
    for (let i = 0; i < sliceLen; i++) {
      textSlice += String.fromCharCode(bytes[i]);
    }
    const trimmed = textSlice.trim().toLowerCase();
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<svg') || trimmed.includes('<svg')) {
      return {
        mimeType: 'image/svg+xml',
        extension: '.svg',
        isSupportedProductFormat: false,
        isHeic: false,
      };
    }
  }

  return null;
}

/**
 * Validates an image buffer (Node.js Buffer or browser Uint8Array) for product catalog uploads.
 */
export function validateProductImageBuffer(
  buffer: Uint8Array,
  filename?: string | null
): ImageValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      error: 'The selected file is empty (0 bytes). Please upload a valid product photo.',
    };
  }

  // File size check: 5MB maximum
  if (buffer.length > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    return {
      isValid: false,
      error: 'Image file size exceeds the 5MB limit. Please upload an image under 5MB.',
    };
  }

  // Check filename extension hints for HEIC
  const lowerName = filename ? filename.toLowerCase().trim() : '';
  const hasHeicExt = lowerName.endsWith('.heic') || lowerName.endsWith('.heif');

  // Binary inspection of header magic bytes
  const detected = detectImageFormatFromBytes(buffer);

  // If detected as HEIC/HEIF or has HEIC file extension
  if (hasHeicExt || detected?.isHeic) {
    return {
      isValid: false,
      error: 'HEIC images are not currently supported. Please upload JPG, PNG or WebP.',
    };
  }

  if (detected?.mimeType === 'image/gif') {
    return {
      isValid: false,
      error: 'Animated GIF images are not supported for product photos. Please upload JPG, PNG or WebP.',
    };
  }

  if (detected?.mimeType === 'image/svg+xml') {
    return {
      isValid: false,
      error: 'SVG vector graphics are not supported for product photos. Please upload JPG, PNG or WebP.',
    };
  }

  // If detected as a supported product image format
  if (detected && detected.isSupportedProductFormat) {
    return {
      isValid: true,
      mimeType: detected.mimeType as SupportedProductImageMimeType,
      extension: detected.extension,
    };
  }

  // File does not match valid image headers (e.g. renamed .exe, .pdf, or corrupted bytes)
  return {
    isValid: false,
    error: 'The selected file is not a supported image format. Please upload JPG, PNG, WebP or AVIF.',
  };
}

/**
 * Browser-friendly async validation of a File object before reading entire content.
 * Reads the first 64 bytes to inspect magic numbers without memory overhead.
 */
export async function validateProductImageFile(file: File): Promise<ImageValidationResult> {
  if (!file) {
    return {
      isValid: false,
      error: 'No file selected.',
    };
  }

  // 1. Check size limit first
  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    return {
      isValid: false,
      error: 'Image file size exceeds the 5MB limit. Please upload an image under 5MB.',
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'The selected file is empty (0 bytes). Please upload a valid product photo.',
    };
  }

  // 2. Check HEIC hints by extension or MIME type
  const lowerName = (file.name || '').toLowerCase().trim();
  const lowerType = (file.type || '').toLowerCase().trim();
  if (
    lowerName.endsWith('.heic') ||
    lowerName.endsWith('.heif') ||
    lowerType === 'image/heic' ||
    lowerType === 'image/heif'
  ) {
    return {
      isValid: false,
      error: 'HEIC images are not currently supported. Please upload JPG, PNG or WebP.',
    };
  }

  // 3. Read first 64 bytes to verify actual binary magic bytes
  try {
    const headerSlice = file.slice(0, 64);
    const arrayBuf = await headerSlice.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);

    return validateProductImageBuffer(bytes, file.name);
  } catch {
    return {
      isValid: false,
      error: 'Failed to read file for validation. Please try again.',
    };
  }
}

/**
 * Formats byte count into human-readable size string (e.g. 450 KB, 2.3 MB).
 */
export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} B`;
}
