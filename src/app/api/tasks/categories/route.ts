// src/app/api/tasks/categories/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.taskCategory.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, icon: true, requiredPlan: true, color: true },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[Categories] Error:', error);
    return NextResponse.json({ categories: [] });
  }
}
