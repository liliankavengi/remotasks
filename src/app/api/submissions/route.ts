// src/app/api/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canSubmitTask } from '@/lib/permissions';
import { z } from 'zod';

const SubmitSchema = z.object({
  taskId: z.string(),
  submissionData: z.record(z.unknown()),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await request.json();
    const parsed = SubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { taskId, submissionData } = parsed.data;

    // Get task details with server-side authorization
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    if (task.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'This task is no longer accepting submissions.' }, { status: 400 });
    }

    // Check task expiry
    if (task.endDate && new Date() > task.endDate) {
      return NextResponse.json({ error: 'This task has expired.' }, { status: 400 });
    }

    // Check slots
    if (task.filledSlots >= task.totalSlots) {
      return NextResponse.json({ error: 'This task has no more available slots.' }, { status: 400 });
    }

    // Server-side plan check
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!dbUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const userPlan = (dbUser.subscriptions[0]?.plan?.slug || 'FREE') as any;
    if (!canSubmitTask(userPlan, task.requiredPlan as any)) {
      return NextResponse.json({
        error: `This task requires ${task.requiredPlan} plan access. Please upgrade your account.`,
        requiresUpgrade: true,
        requiredPlan: task.requiredPlan,
      }, { status: 403 });
    }

    // Check for existing submission (prevent duplicates)
    const existing = await prisma.taskSubmission.findUnique({
      where: { userId_taskId: { userId: user.id, taskId } },
    });

    if (existing) {
      return NextResponse.json({
        error: 'You have already submitted this task.',
        submissionId: existing.id,
      }, { status: 409 });
    }

    // Check daily/monthly limits
    const sub = dbUser.subscriptions[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dailyCount, monthlyCount] = await Promise.all([
      prisma.taskSubmission.count({
        where: { userId: user.id, submittedAt: { gte: today } },
      }),
      prisma.taskSubmission.count({
        where: { userId: user.id, submittedAt: { gte: startOfMonth } },
      }),
    ]);

    if (sub && dailyCount >= sub.dailyTaskLimit) {
      return NextResponse.json({
        error: `You've reached your daily task limit of ${sub.dailyTaskLimit}. Upgrade to complete more tasks.`,
        requiresUpgrade: true,
      }, { status: 429 });
    }

    if (sub && monthlyCount >= sub.monthlyTaskLimit) {
      return NextResponse.json({
        error: `You've reached your monthly task limit of ${sub.monthlyTaskLimit}. Upgrade to continue.`,
        requiresUpgrade: true,
      }, { status: 429 });
    }

    // Create submission and update task
    const submission = await prisma.$transaction(async (tx: any) => {
      const sub = await tx.taskSubmission.create({
        data: {
          userId: user.id,
          taskId,
          submissionData,
          status: 'SUBMITTED',
          reward: task.reward,
        },
      });

      await tx.task.update({
        where: { id: taskId },
        data: { filledSlots: { increment: 1 } },
      });

      // Create pending earning
      await tx.earning.create({
        data: {
          userId: user.id,
          taskId,
          submissionId: sub.id,
          amount: task.reward,
          status: 'PENDING',
          description: `Task reward: ${task.title}`,
        },
      });

      // Notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'TASK_SUBMITTED',
          title: 'Task Submitted ✓',
          message: `Your submission for "${task.title}" is under review. You'll earn KES ${task.reward} upon approval.`,
        },
      });

      return sub;
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: 'Submission received successfully.',
    }, { status: 201 });
  } catch (error) {
    console.error('[Submission POST] Error:', error);
    return NextResponse.json({ error: 'Failed to submit task.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    const where: any = { userId: user.id };
    if (status) where.status = status;

    const [submissions, total] = await Promise.all([
      prisma.taskSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          task: {
            select: { title: true, reward: true, category: { select: { name: true } } },
          },
        },
      }),
      prisma.taskSubmission.count({ where }),
    ]);

    return NextResponse.json({
      submissions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Submissions GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions.' }, { status: 500 });
  }
}
