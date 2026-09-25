import { prisma } from '@/lib/prisma';

export function getPlanLimits(slug: string) {
  const normalized = (slug || 'FREE').toUpperCase();
  const limits: Record<string, {
    dailyTaskLimit: number;
    monthlyTaskLimit: number;
    maxActiveTasks: number;
    surveyCreateLimit: number;
    taskCreateLimit: number;
  }> = {
    FREE:       { dailyTaskLimit: 5,   monthlyTaskLimit: 50,   maxActiveTasks: 3,   surveyCreateLimit: 0,   taskCreateLimit: 0   },
    STARTER:    { dailyTaskLimit: 15,  monthlyTaskLimit: 150,  maxActiveTasks: 10,  surveyCreateLimit: 5,   taskCreateLimit: 0   },
    PRO:        { dailyTaskLimit: 50,  monthlyTaskLimit: 500,  maxActiveTasks: 30,  surveyCreateLimit: 20,  taskCreateLimit: 5  },
    VIP:        { dailyTaskLimit: 100, monthlyTaskLimit: 1000, maxActiveTasks: 50,  surveyCreateLimit: 50,  taskCreateLimit: 20 },
    BUSINESS:   { dailyTaskLimit: 100, monthlyTaskLimit: 1000, maxActiveTasks: 50,  surveyCreateLimit: 50,  taskCreateLimit: 20 },
    ENTERPRISE: { dailyTaskLimit: 999, monthlyTaskLimit: 9999, maxActiveTasks: 999, surveyCreateLimit: 999, taskCreateLimit: 999 },
  };

  return limits[normalized] || limits.FREE;
}

export function getSubscriptionEndDate(billingPeriod?: string | null): Date | null {
  const now = new Date();
  if (billingPeriod === 'YEARLY') {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }
  // Default monthly
  return new Date(now.setMonth(now.getMonth() + 1));
}

/**
 * Atomically activates a subscription upon verified payment confirmation.
 * Fully idempotent — safe to call multiple times.
 */
export async function confirmAndActivatePayment(params: {
  paymentId: string;
  providerTransactionId?: string;
  webhookPayload?: any;
}) {
  const { paymentId, providerTransactionId, webhookPayload } = params;

  return await prisma.$transaction(async (tx: any) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        plan: true,
      },
    });

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found.`);
    }

    if (payment.status === 'COMPLETED') {
      return { success: true, payment, alreadyConfirmed: true };
    }

    // 1. Mark payment as COMPLETED with receipt info
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        verifiedAt: new Date(),
        providerTransactionId: providerTransactionId || payment.providerTransactionId,
        webhookPayload: webhookPayload || payment.webhookPayload,
      },
    });

    // 2. Deactivate previous active subscriptions
    if (payment.plan) {
      await tx.subscription.updateMany({
        where: { userId: payment.userId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      const limits = getPlanLimits(payment.plan.slug as string);

      // 3. Create newly active subscription
      await tx.subscription.create({
        data: {
          userId: payment.userId,
          planId: payment.planId!,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: getSubscriptionEndDate(payment.plan.billingPeriod as any),
          ...limits,
        },
      });

      // 4. Create in-app notification
      await tx.notification.create({
        data: {
          userId: payment.userId,
          type: 'UPGRADE_SUCCESS',
          title: 'Plan Upgraded Successfully!',
          message: `Your account is now upgraded to ${payment.plan.name}. High-paying tasks and expanded daily limits are now unlocked!`,
        },
      });

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          actorId: payment.userId,
          action: 'PAYMENT_CONFIRMED',
          resource: 'payment',
          resourceId: payment.id,
          metadata: {
            amount: payment.amount,
            plan: payment.plan.name,
            providerTransactionId: providerTransactionId || payment.providerTransactionId,
          },
        },
      });
    }

    return { success: true, payment: updatedPayment, plan: payment.plan };
  });
}
