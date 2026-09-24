// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session?.user || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const [
      totalUsers,
      totalTasks,
      pendingSubmissions,
      approvedSubmissions,
      pendingPayouts,
      totalRevenue,
      recentSubmissions,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.taskSubmission.count({ where: { status: 'SUBMITTED' } }),
      prisma.taskSubmission.count({ where: { status: 'APPROVED' } }),
      prisma.payout.count({ where: { status: 'REQUESTED' } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.taskSubmission.findMany({
        where: { status: 'SUBMITTED' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          task: { select: { id: true, title: true, reward: true, currency: true } },
        },
        orderBy: { submittedAt: 'desc' },
        take: 20,
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { plan: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    const revenue = totalRevenue._sum.amount || 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        totalTasks,
        pendingSubmissions,
        approvedSubmissions,
        pendingPayouts,
        totalRevenueKes: revenue,
      },
      pendingSubmissions: recentSubmissions.map((s) => ({
        id: s.id,
        submittedAt: s.submittedAt.toISOString(),
        submissionData: s.submissionData,
        user: s.user,
        task: {
          id: s.task.id,
          title: s.task.title,
          rewardAmount: s.task.reward,
          currency: s.task.currency,
        },
      })),
      recentUsers,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to load admin stats' }, { status: 500 });
  }
}
