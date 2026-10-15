import { getApiUrl } from './config';

export interface WhatsappEnquiryPayload {
  storeId: string;
  productId?: string;
  customerName?: string;
  customerPhone?: string;
  message?: string;
}

export async function logWhatsappEnquiry(payload: WhatsappEnquiryPayload): Promise<void> {
  if (!payload.storeId) return;
  try {
    const apiUrl = getApiUrl();
    await fetch(`${apiUrl}/enquiries/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Failed to log WhatsApp enquiry:', err);
  }
}
