// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      submissions,
      totalEarnings,
      pendingEarnings,
      availableEarnings,
      subscription,
      notificationsCount,
      availableTasks,
      todayCount,
      recentSubmissions,
    ] = await Promise.all([
      // 1. Submissions by status
      prisma.taskSubmission.groupBy({
        by: ['status'],
        where: { userId: user.id },
        _count: { status: true },
      }),

      // 2. Total earnings
      prisma.earning.aggregate({
        where: { userId: user.id },
        _sum: { amount: true },
      }),

      // 3. Pending earnings
      prisma.earning.aggregate({
        where: { userId: user.id, status: 'PENDING' },
        _sum: { amount: true },
      }),

      // 4. Available earnings
      prisma.earning.aggregate({
        where: { userId: user.id, status: 'AVAILABLE' },
        _sum: { amount: true },
      }),

      // 5. Active subscription
      prisma.subscription.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      }),

      // 6. Unread notifications
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),

      // 7. Available tasks
      prisma.task.count({
        where: { status: 'PUBLISHED' },
      }),

      // 8. Today's task count
      prisma.taskSubmission.count({
        where: { userId: user.id, submittedAt: { gte: today } },
      }),

      // 9. Recent submissions
      prisma.taskSubmission.findMany({
        where: { userId: user.id },
        take: 5,
        orderBy: { submittedAt: 'desc' },
        include: {
          task: {
            select: { title: true, reward: true, category: { select: { name: true, slug: true } } },
          },
        },
      }),
    ]);

    // Parse submission map
    const submissionMap = submissions.reduce((acc: Record<string, number>, curr: any) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      stats: {
        totalSubmissions: (Object.values(submissionMap) as number[]).reduce((a: number, b: number) => a + b, 0),
        completedTasks: submissionMap['APPROVED'] || 0,
        pendingTasks: (submissionMap['SUBMITTED'] || 0) + (submissionMap['UNDER_REVIEW'] || 0),
        availableTasks,
        totalEarnings: totalEarnings._sum.amount || 0,
        pendingEarnings: pendingEarnings._sum.amount || 0,
        availableBalance: availableEarnings._sum.amount || 0,
        todayTasksCompleted: todayCount,
        dailyTaskLimit: subscription?.dailyTaskLimit || 5,
        unreadNotifications: notificationsCount,
      },
      subscription: subscription
        ? {
            plan: subscription.plan.name,
            planSlug: subscription.plan.slug,
            status: subscription.status,
            endDate: subscription.endDate,
            dailyTaskLimit: subscription.dailyTaskLimit,
            monthlyTaskLimit: subscription.monthlyTaskLimit,
          }
        : null,
      recentSubmissions,
    });
  } catch (error) {
    console.error('[Dashboard] Error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data.' }, { status: 500 });
  }
}
