// src/app/api/payments/webhook/route.ts
// PayHero Webhook Handler
// PayHero POSTs payment results to this URL (PAYHERO_CALLBACK_URL)
// IMPORTANT: This must be idempotent — handle duplicate webhooks safely

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { payHero, PayHeroWebhookPayload } from '@/lib/payhero';

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
      // Process successful payment
      await prisma.$transaction(async (tx: any) => {
        // Mark payment as completed
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            verifiedAt: new Date(),
            providerTransactionId: MpesaReceiptNumber || payload.CheckoutRequestID,
            webhookPayload: body as any,
          },
        });

        // Upgrade user's subscription if plan exists
        if (payment.plan) {
          // Deactivate existing active subscriptions
          await tx.subscription.updateMany({
            where: { userId: payment.userId, status: 'ACTIVE' },
            data: { status: 'CANCELLED' },
          });

          // Get plan limits based on slug
          const planLimits = getPlanLimits(payment.plan.slug as any);

          // Create new subscription
          await tx.subscription.create({
            data: {
              userId: payment.userId,
              planId: payment.planId!,
              status: 'ACTIVE',
              startDate: new Date(),
              endDate: getSubscriptionEndDate(payment.plan.billingPeriod as any),
              ...planLimits,
            },
          });
        }

        // Create notification
        await tx.notification.create({
          data: {
            userId: payment.userId,
            type: 'PAYMENT_SUCCESS',
            title: 'Payment Successful 🎉',
            message: `Your payment of KES ${amount} was confirmed. ${payment.plan ? `Your ${payment.plan.name} plan is now active!` : ''}`,
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            actorId: payment.userId,
            action: 'PAYMENT_CONFIRMED',
            resource: 'payment',
            resourceId: payment.id,
            metadata: { amount, mpesaRef: MpesaReceiptNumber, plan: payment.plan?.name },
          },
        });
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

function getPlanLimits(slug: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE') {
  const limits = {
    FREE:       { dailyTaskLimit: 5,   monthlyTaskLimit: 50,   maxActiveTasks: 3,  surveyCreateLimit: 0, taskCreateLimit: 0  },
    STARTER:    { dailyTaskLimit: 15,  monthlyTaskLimit: 150,  maxActiveTasks: 10, surveyCreateLimit: 5, taskCreateLimit: 0  },
    PRO:        { dailyTaskLimit: 50,  monthlyTaskLimit: 500,  maxActiveTasks: 30, surveyCreateLimit: 20, taskCreateLimit: 5 },
    BUSINESS:   { dailyTaskLimit: 100, monthlyTaskLimit: 1000, maxActiveTasks: 50, surveyCreateLimit: 50, taskCreateLimit: 20 },
    ENTERPRISE: { dailyTaskLimit: 999, monthlyTaskLimit: 9999, maxActiveTasks: 999, surveyCreateLimit: 999, taskCreateLimit: 999 },
  };
  return limits[slug] || limits.FREE;
}

function getSubscriptionEndDate(billingPeriod: 'MONTHLY' | 'YEARLY' | 'LIFETIME'): Date | null {
  const now = new Date();
  if (billingPeriod === 'MONTHLY') {
    return new Date(now.setMonth(now.getMonth() + 1));
  }
  if (billingPeriod === 'YEARLY') {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }
  return null; // Lifetime
}
