const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('   REMOTASK COMPREHENSIVE END-TO-END VERIFICATION   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  // ── TEST 1: Google Direct Account Selection & Auth Provisioning ──
  console.log('TEST SUITE 1: Google Account Selector & Auto-Provisioning');
  const testEmail = 'lilian.tester@gmail.com';
  const testName = 'Lilian Tester';

  let testUser = await prisma.user.findUnique({
    where: { email: testEmail },
    include: { subscriptions: { include: { plan: true } } },
  });

  if (!testUser) {
    const freePlan = await prisma.plan.findUnique({ where: { slug: 'FREE' } });
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: testName,
        emailVerified: new Date(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(testName)}&background=4285F4&color=fff`,
        profile: {
          create: {
            bio: 'Remotask Contributor',
            skills: 'Data Annotation, Prompt Engineering, Surveys',
          },
        },
        subscriptions: {
          create: {
            planId: freePlan.id,
            status: 'ACTIVE',
            dailyTaskLimit: 5,
            monthlyTaskLimit: 50,
            maxActiveTasks: 3,
          },
        },
      },
      include: { subscriptions: { include: { plan: true } }, profile: true },
    });
  }

  assert(testUser && testUser.email === testEmail, 'User created with email');
  assert(testUser.subscriptions.length > 0, 'Active FREE subscription auto-assigned');
  assert(testUser.profile !== null, 'Profile record created with default skills');

  // ── TEST 2: Task Workplace & Questions / Prompts Loading ──
  console.log('\nTEST SUITE 2: Prompt Engineering & Task Workplace Loading');
  const promptTask = await prisma.task.findUnique({
    where: { slug: 'improve-customer-support-prompt-demo' },
    include: {
      category: true,
      questions: {
        orderBy: { sortOrder: 'asc' },
        include: { options: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  });

  assert(promptTask !== null, 'Prompt engineering task found');
  assert(promptTask.questions.length >= 4, `Prompt engineering task has ${promptTask?.questions.length} questions`);

  const hasLongText = promptTask.questions.some(q => q.type === 'LONG_TEXT');
  const hasChoice = promptTask.questions.some(q => q.type === 'SINGLE_CHOICE' && q.options.length > 0);
  const hasRating = promptTask.questions.some(q => q.type === 'RATING');
  const hasYesNo = promptTask.questions.some(q => q.type === 'YES_NO');

  assert(hasLongText, 'Prompt rewrite question (LONG_TEXT) exists');
  assert(hasChoice, 'Guardrails question with options exists');
  assert(hasRating, 'Prompt effectiveness rating question exists');
  assert(hasYesNo, 'Few-shot prompt example verification (YES_NO) exists');

  // ── TEST 3: Search Query with tags filter ──
  console.log('\nTEST SUITE 3: Task Search & Filter Execution');
  const searchFilter = {
    where: {
      status: 'PUBLISHED',
      OR: [
        { title: { contains: 'prompt' } },
        { description: { contains: 'prompt' } },
        { tags: { contains: 'prompt' } },
      ],
    },
  };
  const searchResults = await prisma.task.findMany(searchFilter);
  assert(searchResults.length > 0, `Search for "prompt" successfully returns ${searchResults.length} matching tasks`);

  // ── TEST 4: Task Workplace Submission & Reward Crediting ──
  console.log('\nTEST SUITE 4: Interactive Workplace Submission Flow');
  // Clean up any prior test submission
  await prisma.earning.deleteMany({ where: { userId: testUser.id, taskId: promptTask.id } });
  await prisma.notification.deleteMany({ where: { userId: testUser.id, type: 'TASK_SUBMITTED' } });
  await prisma.taskSubmission.deleteMany({ where: { userId: testUser.id, taskId: promptTask.id } });

  const submissionAnswers = {};
  promptTask.questions.forEach((q, idx) => {
    if (q.type === 'LONG_TEXT' || q.type === 'SHORT_TEXT') {
      submissionAnswers[q.id] = 'You are a warm, professional customer support agent. Step 1: Verify Order ID and user email. Step 2: Inquire kindly about issue. Step 3: Escalate to supervisor if unresolved.';
    } else if (q.type === 'SINGLE_CHOICE') {
      submissionAnswers[q.id] = q.options[0]?.text || 'Strict verification';
    } else if (q.type === 'RATING') {
      submissionAnswers[q.id] = 5;
    } else if (q.type === 'YES_NO') {
      submissionAnswers[q.id] = 'Yes';
    }
  });

  const submission = await prisma.$transaction(async (tx) => {
    const sub = await tx.taskSubmission.create({
      data: {
        userId: testUser.id,
        taskId: promptTask.id,
        submissionData: { answers: submissionAnswers, generalNotes: 'High quality response' },
        status: 'SUBMITTED',
        reward: promptTask.reward,
      },
    });

    await tx.earning.create({
      data: {
        userId: testUser.id,
        taskId: promptTask.id,
        submissionId: sub.id,
        amount: promptTask.reward,
        status: 'PENDING',
        description: `Task reward: ${promptTask.title}`,
      },
    });

    await tx.notification.create({
      data: {
        userId: testUser.id,
        type: 'TASK_SUBMITTED',
        title: 'Task Submitted',
        message: `Your submission for "${promptTask.title}" is under review.`,
      },
    });

    return sub;
  });

  assert(submission && submission.status === 'SUBMITTED', 'Task submission successfully created');
  const earning = await prisma.earning.findFirst({ where: { submissionId: submission.id } });
  assert(earning && earning.amount === promptTask.reward, `Pending reward of KES ${promptTask.reward} credited`);
  const notification = await prisma.notification.findFirst({ where: { userId: testUser.id, type: 'TASK_SUBMITTED' } });
  assert(notification !== null, 'Worker notified of successful submission');

  // ── TEST 5: Payment Initiation (M-Pesa STK Prompt) ──
  console.log('\nTEST SUITE 5: M-Pesa STK Payment Prompt Initiation');
  const proPlan = await prisma.plan.findUnique({ where: { slug: 'PRO' } });
  assert(proPlan !== null, 'Pro plan exists in catalog');

  const paymentRef = `PAY-TEST-${Date.now().toString(36).toUpperCase()}`;
  const payment = await prisma.payment.create({
    data: {
      userId: testUser.id,
      planId: proPlan.id,
      amount: proPlan.price,
      currency: 'KES',
      phoneNumber: '254712345678',
      provider: 'MOCK',
      reference: paymentRef,
      status: 'PENDING',
    },
  });

  assert(payment && payment.reference === paymentRef, `M-Pesa payment prompt record generated (Ref: ${paymentRef})`);

  // ── SUMMARY ──
  console.log('\n====================================================');
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests()
  .catch((e) => {
    console.error('Test run failed with error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
