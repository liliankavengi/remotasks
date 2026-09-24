// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  country: z.string().optional(),
  referralCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password, country, referralCode } = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // Get free plan
    const freePlan = await prisma.plan.findUnique({ where: { slug: 'FREE' } });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with free plan subscription
    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          phone: phone?.trim(),
          country,
          passwordHash,
          referredBy: referralCode || null,
        },
      });

      // Create profile
      await tx.profile.create({
        data: { userId: newUser.id },
      });

      // Assign free plan subscription
      if (freePlan) {
        await tx.subscription.create({
          data: {
            userId: newUser.id,
            planId: freePlan.id,
            status: 'ACTIVE',
            dailyTaskLimit: 5,
            monthlyTaskLimit: 50,
            maxActiveTasks: 3,
            surveyCreateLimit: 0,
            taskCreateLimit: 0,
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: newUser.id,
          action: 'USER_REGISTERED',
          resource: 'user',
          resourceId: newUser.id,
        },
      });

      return newUser;
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully.',
      userId: user.id,
    });
  } catch (error) {
    console.error('[Register] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
