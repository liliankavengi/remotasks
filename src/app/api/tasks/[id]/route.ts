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
          include: {
            options: {
              orderBy: { sortOrder: 'asc' },
            },
          },
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

    const formattedQuestions = task.questions.map((q) => ({
      id: q.id,
      question: q.question,
      questionText: q.question,
      type: q.type,
      questionType: q.type,
      isRequired: q.isRequired,
      stepOrder: q.sortOrder,
      sortOrder: q.sortOrder,
      options: q.options?.map((o) => o.text) || [],
    }));

    return NextResponse.json({
      task: {
        ...task,
        rewardAmount: task.reward,
        questions: formattedQuestions,
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
