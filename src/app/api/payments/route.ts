// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;

    const [payments, activeSubscription] = await Promise.all([
      prisma.payment.findMany({
        where: { userId: user.id },
        include: {
          plan: {
            select: {
              name: true,
              slug: true,
              price: true,
              currency: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.subscription.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        reference: p.reference,
        amount: p.amount,
        currency: p.currency,
        phoneNumber: p.phoneNumber,
        status: p.status,
        providerTransactionId: p.providerTransactionId,
        createdAt: p.createdAt,
        verifiedAt: p.verifiedAt,
        planName: p.plan?.name || 'Membership Plan',
        planSlug: p.plan?.slug || 'PRO',
      })),
      subscription: activeSubscription
        ? {
            planName: activeSubscription.plan.name,
            planSlug: activeSubscription.plan.slug,
            status: activeSubscription.status,
            startDate: activeSubscription.startDate,
            endDate: activeSubscription.endDate,
            dailyTaskLimit: activeSubscription.dailyTaskLimit,
            monthlyTaskLimit: activeSubscription.monthlyTaskLimit,
          }
        : null,
    });
  } catch (error) {
    console.error('[Payments GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments.' }, { status: 500 });
  }
}
