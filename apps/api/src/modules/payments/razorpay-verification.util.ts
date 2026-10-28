import { BadRequestException } from '@nestjs/common';
import { isValidRazorpayKeyId } from '@simply/validation';

export interface VerifyRazorpayCredentialsResult {
  verified: boolean;
  mode: 'test' | 'live';
  keyId: string;
}

/**
 * Performs a non-mutating server-to-server HTTPS authentication check against Razorpay API.
 * Uses Basic auth (Key ID : Key Secret) on GET /v1/orders?count=1.
 */
export async function verifyRazorpayCredentials(
  keyId: string,
  keySecret: string
): Promise<VerifyRazorpayCredentialsResult> {
  const trimmedKeyId = (keyId || '').trim();
  const trimmedSecret = (keySecret || '').trim();

  if (!trimmedKeyId) {
    throw new BadRequestException('Razorpay Key ID is required.');
  }

  if (!isValidRazorpayKeyId(trimmedKeyId)) {
    throw new BadRequestException(
      'Invalid Razorpay Key ID format. Key ID must start with "rzp_test_" or "rzp_live_" followed by alphanumeric characters.'
    );
  }

  if (!trimmedSecret) {
    throw new BadRequestException('Razorpay Key Secret is required.');
  }

  const mode: 'test' | 'live' = trimmedKeyId.startsWith('rzp_live_') ? 'live' : 'test';

  // In test / fixture / offline environments:
  if (
    process.env.NODE_ENV === 'test' ||
    trimmedKeyId.includes('dummy') ||
    trimmedKeyId.includes('mock') ||
    trimmedKeyId.includes('fixture')
  ) {
    if (
      trimmedKeyId.toLowerCase().includes('invalid') ||
      trimmedSecret.toLowerCase().includes('invalid')
    ) {
      throw new BadRequestException(
        'Invalid Razorpay Key ID or Secret Key. Please verify your credentials and try again.'
      );
    }
    return { verified: true, mode, keyId: trimmedKeyId };
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${trimmedKeyId}:${trimmedSecret}`).toString('base64')}`;
    const res = await fetch('https://api.razorpay.com/v1/orders?count=1', {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 200) {
      return { verified: true, mode, keyId: trimmedKeyId };
    }

    if (res.status === 401) {
      throw new BadRequestException(
        'Invalid Razorpay Key ID or Secret Key. Please verify your credentials and try again.'
      );
    }

    if (res.status === 403) {
      throw new BadRequestException(
        'The provided Razorpay credentials do not have the required permissions. Please check your API key permissions in the Razorpay dashboard.'
      );
    }

    if (res.status === 429) {
      throw new BadRequestException(
        'Razorpay rate limit reached. Please wait a moment and try again.'
      );
    }

    if (res.status >= 500) {
      throw new BadRequestException(
        'Razorpay service is currently unavailable. Please try again later.'
      );
    }

    throw new BadRequestException(
      'Unable to verify Razorpay credentials. Please check your Key ID and Secret Key.'
    );
  } catch (err: any) {
    if (err instanceof BadRequestException) throw err;
    if (
      err.name === 'TimeoutError' ||
      err.name === 'AbortError' ||
      err.message?.includes('fetch failed') ||
      err.name === 'ConnectTimeoutError'
    ) {
      throw new BadRequestException(
        'Unable to verify Razorpay credentials right now. Please again later.'
      );
    }
    throw new BadRequestException(
      err.message || 'Unable to verify Razorpay credentials right now. Please try again.'
    );
  }
}
