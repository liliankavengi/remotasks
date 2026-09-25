// src/app/api/payments/webhook/route.ts
// PayHero Webhook Handler
// PayHero POSTs payment results to this URL (PAYHERO_CALLBACK_URL)
// IMPORTANT: This must be idempotent — handle duplicate webhooks safely

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { payHero, PayHeroWebhookPayload } from '@/lib/payhero';
import { confirmAndActivatePayment } from '@/lib/subscriptions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Webhook] Received PayHero callback:', JSON.stringify(body));

    // Validate webhook payload structure
    if (!payHero.validateWebhook(body)) {
      console.warn('[Webhook] Invalid payload structure');
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const payload = body as PayHeroWebhookPayload;
    const { status, external_reference, amount, phone_number, MpesaReceiptNumber } = payload;

    // Find payment by our reference (idempotent lookup)
    const payment = await prisma.payment.findUnique({
      where: { reference: external_reference },
      include: {
        user: true,
        plan: true,
      },
    });

    if (!payment) {
      console.warn('[Webhook] Payment not found for reference:', external_reference);
      // Return 200 to acknowledge receipt (prevent PayHero from retrying)
      return NextResponse.json({ received: true });
    }

    // Idempotency: if already processed, skip
    if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
      console.log('[Webhook] Payment already processed:', payment.id, payment.status);
      return NextResponse.json({ received: true });
    }

    if (status === 'SUCCESS') {
      // Process successful payment atomically
      await confirmAndActivatePayment({
        paymentId: payment.id,
        providerTransactionId: MpesaReceiptNumber || payload.CheckoutRequestID,
        webhookPayload: body,
      });

      console.log('[Webhook] Payment confirmed successfully:', payment.id);
    } else {
      // Payment failed or cancelled
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          webhookPayload: body as any,
          metadata: { failureReason: status } as any,
        },
      });

      await prisma.notification.create({
        data: {
          userId: payment.userId,
          type: 'PAYMENT_SUCCESS',
          title: 'Payment Failed',
          message: `We couldn't confirm your M-Pesa payment. Please try again or contact support.`,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: payment.userId,
          action: 'PAYMENT_FAILED',
          resource: 'payment',
          resourceId: payment.id,
          metadata: { status, reason: payload } as any,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    // Return 200 to prevent infinite retries, but log the error
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

