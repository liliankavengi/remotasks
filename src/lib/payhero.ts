// src/lib/payhero.ts
// PayHero M-Pesa Payment Integration
// Docs: https://docs.payhero.co.ke
// Endpoint: POST https://backend.payhero.co.ke/api/v2/payments/initiate-stk-push

export interface PayHeroInitiateRequest {
  amount: number;
  phone_number: string;  // Format: 254XXXXXXXXX
  channel_id: number;
  provider: 'm-pesa' | 'airtel';
  external_reference: string;  // Your internal reference/order ID
  callback_url: string;
}

export interface PayHeroResponse {
  success: boolean;
  status: number;
  message: string;
  reference?: string;
  merchant_reference?: string;
  customer_reference?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
}

export interface PayHeroWebhookPayload {
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount: number;
  phone_number: string;
  external_reference: string;
  CheckoutRequestID?: string;
  MpesaReceiptNumber?: string;
  TransactionDate?: string;
  merchant_reference?: string;
  provider: string;
  channel_id: number;
}

class PayHeroProvider {
  private baseUrl = 'https://backend.payhero.co.ke/api/v2';
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!(
      process.env.PAYHERO_USERNAME &&
      process.env.PAYHERO_PASSWORD &&
      process.env.PAYHERO_CHANNEL_ID
    );
  }

  private getAuthHeader(): string {
    const username = process.env.PAYHERO_USERNAME!;
    const password = process.env.PAYHERO_PASSWORD!;
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    return `Basic ${token}`;
  }

  public get configured(): boolean {
    return this.isConfigured;
  }

  /**
   * Initiate an M-Pesa STK Push payment
   */
  async initiatePayment(params: {
    amount: number;
    phoneNumber: string;
    reference: string;
  }): Promise<{ success: boolean; data?: PayHeroResponse; error?: string; notConfigured?: boolean }> {
    if (!this.isConfigured) {
      return {
        success: false,
        notConfigured: true,
        error: 'PayHero payment provider is not configured. Please set PAYHERO_USERNAME, PAYHERO_PASSWORD, and PAYHERO_CHANNEL_ID environment variables.',
      };
    }

    const channelId = parseInt(process.env.PAYHERO_CHANNEL_ID!);
    const callbackUrl = process.env.PAYHERO_CALLBACK_URL || `${process.env.APP_URL}/api/payments/webhook`;

    const payload: PayHeroInitiateRequest = {
      amount: params.amount,
      phone_number: this.formatPhone(params.phoneNumber),
      channel_id: channelId,
      provider: 'm-pesa',
      external_reference: params.reference,
      callback_url: callbackUrl,
    };

    try {
      const response = await fetch(`${this.baseUrl}/payments/initiate-stk-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data: PayHeroResponse = await response.json();

      return {
        success: response.ok && data.success,
        data,
        error: !response.ok ? data.message || 'Payment initiation failed' : undefined,
      };
    } catch (error) {
      console.error('[PayHero] Error initiating payment:', error);
      return {
        success: false,
        error: 'Network error communicating with payment provider. Please try again.',
      };
    }
  }

  /**
   * Query the live status of a transaction from PayHero
   * Endpoint: GET https://backend.payhero.co.ke/api/v2/transaction-status?reference={reference}
   */
  async getTransactionStatus(reference: string): Promise<{
    success: boolean;
    status?: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED';
    receiptNumber?: string;
    amount?: number;
    phone?: string;
    raw?: any;
    error?: string;
  }> {
    if (!this.isConfigured) {
      return { success: false, error: 'PayHero is not configured.' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/transaction-status?reference=${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        return { success: false, error: `PayHero responded with status ${response.status}` };
      }

      const data = await response.json();
      console.log('[PayHero] Queried transaction status for reference', reference, ':', JSON.stringify(data));

      // Standardize status format from PayHero response
      const rawStatus = (
        data.status ||
        data.payment_status ||
        data.transaction_status ||
        (data.data && (data.data.status || data.data.payment_status)) ||
        ''
      ).toString().toUpperCase();

      const receiptNumber =
        data.MpesaReceiptNumber ||
        data.mpesa_reference ||
        data.receipt ||
        data.checkout_request_id ||
        (data.data && (data.data.MpesaReceiptNumber || data.data.mpesa_reference));

      let mappedStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED' = 'PENDING';
      if (rawStatus === 'SUCCESS' || rawStatus === 'COMPLETED' || rawStatus === 'PAID') {
        mappedStatus = 'SUCCESS';
      } else if (rawStatus === 'FAILED' || rawStatus === 'REJECTED' || rawStatus === 'DECLINED') {
        mappedStatus = 'FAILED';
      } else if (rawStatus === 'CANCELLED' || rawStatus === 'CANCELED') {
        mappedStatus = 'CANCELLED';
      }

      return {
        success: true,
        status: mappedStatus,
        receiptNumber,
        amount: data.amount || (data.data && data.data.amount),
        phone: data.phone_number || (data.data && data.data.phone_number),
        raw: data,
      };
    } catch (error: any) {
      console.error('[PayHero] Error checking transaction status:', error);
      return { success: false, error: error.message || 'Failed to query transaction status' };
    }
  }

  /**
   * Format phone number to 254XXXXXXXXX
   */
  private formatPhone(phone: string): string {
    // Remove spaces, dashes, plus signs
    let cleaned = phone.replace(/[\s\-\+]/g, '');

    // Handle 07XXXXXXXX → 2547XXXXXXXX
    if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
      cleaned = '254' + cleaned.substring(1);
    }

    // Handle 7XXXXXXXX → 2547XXXXXXXX
    if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
      cleaned = '254' + cleaned;
    }

    return cleaned;
  }

  /**
   * Validate an incoming webhook payload
   * PayHero sends callbacks to your callback_url
   */
  validateWebhook(payload: unknown): payload is PayHeroWebhookPayload {
    if (!payload || typeof payload !== 'object') return false;
    const p = payload as Record<string, unknown>;
    return (
      typeof p.status === 'string' &&
      typeof p.amount === 'number' &&
      typeof p.phone_number === 'string' &&
      typeof p.external_reference === 'string'
    );
  }
}

export const payHero = new PayHeroProvider();

