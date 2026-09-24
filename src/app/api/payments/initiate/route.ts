// src/app/api/payments/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { payHero } from '@/lib/payhero';
import { generateReference } from '@/lib/utils';
import { z } from 'zod';

const InitiateSchema = z.object({
  planId: z.string().optional(),
  planSlug: z.string().optional(),
  phoneNumber: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await request.json();
    const parsed = InitiateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const targetPhone = parsed.data.phoneNumber || parsed.data.phone;
    if (!targetPhone || targetPhone.length < 9) {
      return NextResponse.json({ error: 'Please enter a valid M-Pesa phone number.' }, { status: 400 });
    }

    const targetPlanIdentifier = parsed.data.planId || parsed.data.planSlug;
    if (!targetPlanIdentifier) {
      return NextResponse.json({ error: 'Plan specification is required.' }, { status: 400 });
    }

    // Find plan by id or slug
    let plan = await prisma.plan.findFirst({
      where: {
        OR: [
          { id: targetPlanIdentifier },
          { slug: targetPlanIdentifier.toUpperCase() as any },
        ],
      },
    });

    if (!plan) {
      plan = await prisma.plan.findFirst({
        where: { slug: 'PRO' },
      });
    }

    if (!plan) {
      return NextResponse.json({ error: 'Selected plan not found.' }, { status: 404 });
    }

    const reference = generateReference('PAY');

    // Create pending payment record FIRST
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency,
        phoneNumber: targetPhone,
        provider: 'PAYHERO',
        reference,
        status: 'PENDING',
      },
    });

    // Check if PayHero live integration credentials exist
    if (payHero.configured) {
      const result = await payHero.initiatePayment({
        amount: plan.price,
        phoneNumber: targetPhone,
        reference,
      });

      if (!result.success) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED', metadata: { error: result.error } as any },
        });

        return NextResponse.json({
          error: result.error || 'M-Pesa payment initiation failed. Please try again.',
        }, { status: 400 });
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          metadata: result.data as any,
          providerTransactionId: result.data?.CheckoutRequestID || result.data?.reference,
        },
      });

      return NextResponse.json({
        success: true,
        reference,
        paymentId: payment.id,
        message: 'M-Pesa STK Push prompt sent to your phone. Enter your PIN to complete payment.',
      });
    } else {
      // In local dev without live credentials, auto-complete after simulation
      const slugStr = plan.slug as string;
      setTimeout(async () => {
        try {
          await prisma.$transaction(async (tx: any) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: 'COMPLETED',
                verifiedAt: new Date(),
                providerTransactionId: `MPESA-DEMO-${Date.now()}`,
              },
            });

            // Upsert active subscription for user
            await tx.subscription.create({
              data: {
                userId: user.id,
                planId: plan.id,
                status: 'ACTIVE',
                dailyTaskLimit: slugStr === 'PRO' ? 30 : slugStr === 'VIP' ? 100 : 999,
                monthlyTaskLimit: slugStr === 'PRO' ? 500 : slugStr === 'VIP' ? 2000 : 9999,
              },
            });

            await tx.notification.create({
              data: {
                userId: user.id,
                type: 'UPGRADE_SUCCESS',
                title: 'Plan Upgraded Successfully! 🎉',
                message: `Your account is now upgraded to ${plan.name}. High-paying tasks unlocked!`,
              },
            });
          });
        } catch (e) {
          console.error('Error simulating demo payment completion:', e);
        }
      }, 4000);

      return NextResponse.json({
        success: true,
        reference,
        paymentId: payment.id,
        message: 'Simulated STK Push sent. Please wait while payment confirms...',
      });
    }
  } catch (error) {
    console.error('[Payment Initiate] Error:', error);
    return NextResponse.json({ error: 'Payment initiation error. Please try again.' }, { status: 500 });
  }
}
