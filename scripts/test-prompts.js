const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Remotask Local Prompts & Tasks System...\n');

  // 1. Check Categories
  const categories = await prisma.taskCategory.findMany({ select: { slug: true, name: true } });
  console.log('1. Categories active:', categories.length);

  // 2. Check Tasks & Questions
  const tasks = await prisma.task.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      requiredPlan: true,
      reward: true,
      questions: {
        select: {
          id: true,
          question: true,
          type: true,
          options: { select: { text: true } }
        }
      }
    }
  });

  console.log(`2. Total Tasks in DB: ${tasks.length}`);
  for (const t of tasks) {
    console.log(`   - Task: "${t.title}" (Reward: KES ${t.reward}, Plan: ${t.requiredPlan})`);
    console.log(`     Questions count: ${t.questions.length}`);
    for (const q of t.questions) {
      console.log(`       * [${q.type}] "${q.question}" -> Options: [${q.options.map(o => o.text).join(', ')}]`);
    }
  }

  // 3. Check Users & Google Auth Readiness
  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, email: true, name: true, role: true, subscriptions: { select: { plan: { select: { slug: true } } } } }
  });
  console.log(`\n3. Registered Users: ${users.length}`);
  users.forEach(u => {
    const plan = u.subscriptions[0]?.plan?.slug || 'FREE';
    console.log(`   - User: ${u.email} (${u.name || 'Anonymous'}), Role: ${u.role}, Plan: ${plan}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
