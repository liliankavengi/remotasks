// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        category: true,
        questions: {
          orderBy: { sortOrder: 'asc' },
        },
        creator: {
          select: { name: true, avatar: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if current user already submitted
    const existingSubmission = await prisma.taskSubmission.findUnique({
      where: {
        userId_taskId: {
          userId,
          taskId: id,
        },
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        reward: true,
        rejectionReason: true,
        submissionData: true,
      },
    });

    return NextResponse.json({
      task: {
        ...task,
        rewardAmount: task.reward,
      },
      userSubmission: existingSubmission
        ? {
            ...existingSubmission,
            rewardEarned: existingSubmission.reward || 0,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching task detail:', error);
    return NextResponse.json({ error: 'Failed to fetch task details' }, { status: 500 });
  }
}
