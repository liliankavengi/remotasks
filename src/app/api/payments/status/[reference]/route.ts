// src/app/api/payments/status/[reference]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { payHero } from '@/lib/payhero';
import { confirmAndActivatePayment } from '@/lib/subscriptions';

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

    let payment = await prisma.payment.findFirst({
      where: {
        reference,
        userId: user.id,
      },
      include: {
        plan: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    }

    // If still PENDING and PayHero is configured, actively query PayHero live status
    if (payment.status === 'PENDING' && payHero.configured) {
      const liveStatus = await payHero.getTransactionStatus(payment.reference);

      if (liveStatus.success) {
        if (liveStatus.status === 'SUCCESS') {
          // Real payment has been confirmed by M-Pesa / PayHero
          const confirmation = await confirmAndActivatePayment({
            paymentId: payment.id,
            providerTransactionId: liveStatus.receiptNumber,
            webhookPayload: liveStatus.raw,
          });

          return NextResponse.json({
            status: 'COMPLETED',
            reference: payment.reference,
            amount: payment.amount,
            plan: payment.plan?.name,
            verifiedAt: confirmation.payment.verifiedAt || new Date(),
            receipt: liveStatus.receiptNumber,
          });
        } else if (liveStatus.status === 'FAILED' || liveStatus.status === 'CANCELLED') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              metadata: {
                reason: liveStatus.status,
                raw: liveStatus.raw,
              } as any,
            },
          });

          return NextResponse.json({
            status: 'FAILED',
            reference: payment.reference,
            amount: payment.amount,
            plan: payment.plan?.name,
            failureReason: 'Transaction was cancelled or declined on your phone.',
          });
        }
      }
    }

    return NextResponse.json({
      status: payment.status,
      reference: payment.reference,
      amount: payment.amount,
      plan: payment.plan?.name,
      verifiedAt: payment.verifiedAt,
      failureReason: payment.status === 'FAILED' ? ((payment.metadata as any)?.error || (payment.metadata as any)?.failureReason || 'Payment could not be completed.') : undefined,
    });
  } catch (error) {
    console.error('[Payment Status] Error:', error);
    return NextResponse.json({ error: 'Failed to check payment status.' }, { status: 500 });
  }
}

