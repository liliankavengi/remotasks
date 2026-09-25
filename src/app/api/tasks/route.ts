// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessAdmin } from '@/lib/permissions';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'PUBLISHED';
    const minReward = searchParams.get('minReward');
    const maxReward = searchParams.get('maxReward');
    const sortBy = searchParams.get('sortBy') || 'newest';

    const skip = (page - 1) * limit;

    const where: any = {
      status: status === 'all' ? undefined : status,
    };

    if (category) where.categoryId = category;
    if (difficulty) where.difficulty = difficulty;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }
    if (minReward) where.reward = { ...where.reward, gte: parseFloat(minReward) };
    if (maxReward) where.reward = { ...where.reward, lte: parseFloat(maxReward) };

    const orderBy: any = {
      newest: { createdAt: 'desc' },
      oldest: { createdAt: 'asc' },
      reward_high: { reward: 'desc' },
      reward_low: { reward: 'asc' },
      popular: { filledSlots: 'desc' },
    }[sortBy] || { createdAt: 'desc' };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { name: true, slug: true, icon: true } },
          creator: { select: { name: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Tasks GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks.' }, { status: 500 });
  }
}

const CreateTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  categoryId: z.string(),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  instructions: z.string().optional(),
  reward: z.number().positive().optional(),
  rewardAmount: z.number().positive().optional(),
  estimatedMinutes: z.number().positive().optional().default(10),
  difficulty: z.string().optional().default('BEGINNER'),
  totalSlots: z.number().positive().optional().default(50),
  requiredPlan: z.string().optional().default('FREE'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;

    // Check permissions
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isAdminUser = canAccessAdmin(dbUser.role);
    const sub = dbUser.subscriptions[0];
    const taskCreateLimit = sub?.taskCreateLimit ?? 0;

    if (!isAdminUser && taskCreateLimit <= 0) {
      return NextResponse.json(
        { error: 'Your current plan does not allow task creation. Please upgrade.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = CreateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;

    // Normalize difficulty & plan
    let diff = (data.difficulty || 'BEGINNER').toUpperCase();
    if (diff === 'MEDIUM') diff = 'INTERMEDIATE';
    if (!['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(diff)) {
      diff = 'BEGINNER';
    }

    let plan = (data.requiredPlan || 'FREE').toUpperCase();
    if (plan === 'VIP') plan = 'BUSINESS';
    if (!['FREE', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE'].includes(plan)) {
      plan = 'FREE';
    }

    const finalReward = data.reward ?? data.rewardAmount ?? 50;

    // Create slug from title
    const baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60);

    const uniqueSlug = `${baseSlug}-${Date.now()}`;

    const task = await prisma.task.create({
      data: {
        title: data.title,
        slug: uniqueSlug,
        categoryId: data.categoryId,
        creatorId: user.id,
        description: data.description,
        instructions: data.instructions || data.description,
        reward: finalReward,
        estimatedMinutes: data.estimatedMinutes || 10,
        difficulty: diff as any,
        totalSlots: data.totalSlots || 50,
        requiredPlan: plan as any,
        status: isAdminUser ? 'PUBLISHED' : 'PENDING_REVIEW',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
      },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error('[Tasks POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create task.' }, { status: 500 });
  }
}
