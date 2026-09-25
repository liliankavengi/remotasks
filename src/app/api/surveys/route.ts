// src/app/api/surveys/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const QuestionSchema = z.object({
  questionText: z.string().min(3, 'Question text is required'),
  questionType: z.enum(['MULTIPLE_CHOICE', 'TEXT', 'RATING', 'BOOLEAN']),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().default(true),
});

const CreateSurveySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  rewardAmount: z.number().min(0.1, 'Reward must be at least $0.10'),
  totalSlots: z.number().min(1).default(100),
  targetAudience: z.string().optional(),
  questions: z.array(QuestionSchema).min(1, 'At least 1 question is required'),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const surveys = await prisma.survey.findMany({
      include: {
        questions: true,
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      surveys: surveys.map((s) => ({
        ...s,
        rewardAmount: 0.5,
        totalSlots: 100,
        creator: { name: 'Admin Creator' },
      })),
    });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const parsed = CreateSurveySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { title, description, rewardAmount, totalSlots, targetAudience, questions } = parsed.data;

    // Server-side confirmed membership verification
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
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

    const isAdmin = dbUser.role === 'ADMIN' || dbUser.role === 'SUPER_ADMIN';
    const sub = dbUser.subscriptions[0];
    const surveyCreateLimit = sub?.surveyCreateLimit ?? 0;

    if (!isAdmin && surveyCreateLimit <= 0) {
      return NextResponse.json({
        error: 'Your current membership tier does not permit survey creation. Please upgrade your plan to unlock this functionality.',
        requiresUpgrade: true,
      }, { status: 403 });
    }

    let category = await prisma.taskCategory.findFirst({
      where: { slug: 'surveys-research' },
    });

    if (!category) {
      category = await prisma.taskCategory.findFirst();
    }

    const survey = await prisma.$transaction(async (tx: any) => {
      const createdSurvey = await tx.survey.create({
        data: {
          creatorId: userId,
          title,
          description,
          isPublished: true,
          questions: {
            create: questions.map((q, idx) => ({
              question: q.questionText,
              type: q.questionType,
              isRequired: q.isRequired,
              sortOrder: idx + 1,
              ...(q.options && q.options.length > 0 ? {
                options: {
                  create: q.options.map((optText, optIdx) => ({
                    text: optText,
                    sortOrder: optIdx,
                  })),
                },
              } : {}),
            })),
          },
        },
      });

      if (category) {
        await tx.task.create({
          data: {
            slug: `survey-${Date.now()}`,
            creatorId: userId,
            categoryId: category.id,
            title: `[Survey] ${title}`,
            description,
            instructions: description,
            reward: rewardAmount,
            estimatedMinutes: Math.max(3, questions.length * 2),
            totalSlots,
            status: 'PUBLISHED',
            requiredPlan: 'FREE',
            questions: {
              create: questions.map((q, idx) => ({
                question: q.questionText,
                type: q.questionType,
                isRequired: q.isRequired,
                sortOrder: idx + 1,
                ...(q.options && q.options.length > 0 ? {
                  options: {
                    create: q.options.map((optText, optIdx) => ({
                      text: optText,
                      sortOrder: optIdx,
                    })),
                  },
                } : {}),
              })),
            },
          },
        });
      }

      return createdSurvey;
    });

    return NextResponse.json({
      message: 'Survey published successfully!',
      surveyId: survey.id,
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
  }
}
