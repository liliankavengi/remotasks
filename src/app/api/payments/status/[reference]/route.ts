// src/app/api/payments/status/[reference]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reference } = await params;
    const user = session.user as any;

    const payment = await prisma.payment.findFirst({
      where: {
        reference,
        userId: user.id,
      },
      include: {
        plan: { select: { name: true, slug: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    }

    return NextResponse.json({
      status: payment.status,
      reference: payment.reference,
      amount: payment.amount,
      plan: payment.plan?.name,
      verifiedAt: payment.verifiedAt,
    });
  } catch (error) {
    console.error('[Payment Status] Error:', error);
    return NextResponse.json({ error: 'Failed to check payment status.' }, { status: 500 });
  }
}
