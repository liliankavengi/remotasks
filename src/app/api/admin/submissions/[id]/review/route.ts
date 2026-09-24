// src/app/api/admin/submissions/[id]/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isReviewer } from '@/lib/permissions';
import { z } from 'zod';

const ReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'approve', 'reject']),
  rejectionReason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const reviewer = session.user as any;
    const dbReviewer = await prisma.user.findUnique({ where: { id: reviewer.id } });
    if (!dbReviewer || !isReviewer(dbReviewer.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const rawAction = parsed.data.action.toUpperCase();
    const isApprove = rawAction === 'APPROVE';
    const rejectionReason = parsed.data.rejectionReason;

    if (!isApprove && !rejectionReason) {
      return NextResponse.json({ error: 'Rejection reason is required.' }, { status: 400 });
    }

    const submission = await prisma.taskSubmission.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
    }

    if (submission.status === 'APPROVED' || submission.status === 'REJECTED') {
      return NextResponse.json({ error: 'Submission has already been reviewed.' }, { status: 400 });
    }

    const reward = submission.reward || submission.task.reward || 0;

    if (isApprove) {
      await prisma.$transaction(async (tx: any) => {
        await tx.taskSubmission.update({
          where: { id },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewerId: reviewer.id,
          },
        });

        // Create earning record
        await tx.earning.create({
          data: {
            userId: submission.userId,
            taskId: submission.taskId,
            submissionId: id,
            amount: reward,
            currency: submission.task.currency || 'USD',
            status: 'AVAILABLE',
            availableAt: new Date(),
            description: `Reward for task: ${submission.task.title}`,
          },
        });

        // Notify user
        await tx.notification.create({
          data: {
            userId: submission.userId,
            type: 'TASK_APPROVED',
            title: 'Task Approved',
            message: `Your submission for "${submission.task.title}" was approved! $${reward.toFixed(2)} is now available in your earnings.`,
          },
        });
      });
    } else {
      await prisma.$transaction(async (tx: any) => {
        await tx.taskSubmission.update({
          where: { id },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewerId: reviewer.id,
            rejectionReason,
          },
        });

        // Decrement filled slots to reopen
        await tx.task.update({
          where: { id: submission.taskId },
          data: { filledSlots: { decrement: 1 } },
        });

        await tx.notification.create({
          data: {
            userId: submission.userId,
            type: 'TASK_REJECTED',
            title: 'Submission Not Approved',
            message: `Your submission for "${submission.task.title}" was not approved. Reason: ${rejectionReason}`,
          },
        });
      });
    }

    return NextResponse.json({ success: true, action: isApprove ? 'approve' : 'reject' });
  } catch (error) {
    console.error('[Review] Error:', error);
    return NextResponse.json({ error: 'Failed to review submission.' }, { status: 500 });
  }
}
