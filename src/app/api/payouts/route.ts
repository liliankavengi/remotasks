// src/app/api/payouts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const RequestPayoutSchema = z.object({
  amount: z.number().min(5, 'Minimum payout request is $5.00'),
  paymentMethod: z.string().default('MPESA'),
  accountDetails: z.string().min(8, 'Please provide valid phone/M-Pesa details'),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;

    const [earnings, payouts] = await Promise.all([
      prisma.earning.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.payout.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' },
      }),
    ]);

    const totalEarned = earnings.reduce((acc, curr) => acc + curr.amount, 0);
    const availableEarnings = earnings
      .filter((e) => e.status === 'AVAILABLE')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalPaid = payouts
      .filter((p) => p.status === 'PAID')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json({
      walletBalance: availableEarnings,
      totalEarned,
      totalPaid,
      earnings,
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        method: p.provider.toUpperCase(),
        status: p.status,
        accountDetails: p.phoneNumber,
        createdAt: p.requestedAt,
        reference: p.reference,
      })),
    });
  } catch (error) {
    console.error('Error fetching payouts data:', error);
    return NextResponse.json({ error: 'Failed to fetch payout records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;
    const body = await request.json();
    const parsed = RequestPayoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { amount, paymentMethod, accountDetails } = parsed.data;

    // Calculate available balance
    const availableEarnings = await prisma.earning.aggregate({
      where: { userId, status: 'AVAILABLE' },
      _sum: { amount: true },
    });

    const balance = availableEarnings._sum.amount || 0;

    if (balance < amount) {
      return NextResponse.json(
        { error: `Insufficient wallet balance. Available: $${balance.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Create Payout record
    const payout = await prisma.payout.create({
      data: {
        userId,
        amount,
        currency: 'USD',
        phoneNumber: accountDetails,
        provider: paymentMethod.toLowerCase(),
        status: 'REQUESTED',
        reference: `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      },
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Payout Request Submitted',
        message: `Your withdrawal request of $${amount.toFixed(2)} via ${paymentMethod} is pending review.`,
        type: 'SYSTEM',
      },
    });

    return NextResponse.json({
      message: 'Payout request submitted successfully!',
      payout,
    });
  } catch (error) {
    console.error('Error requesting payout:', error);
    return NextResponse.json({ error: 'Failed to process payout request' }, { status: 500 });
  }
}
