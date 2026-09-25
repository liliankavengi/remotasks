// prisma/seed.ts
// Development seed data — clearly marked as DEMO DATA

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Remotask database...');

  // ── Plans ────────────────────────────────────────────────────────────────
  console.log('Creating plans...');

  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { slug: 'FREE' },
      update: {},
      create: {
        slug: 'FREE',
        name: 'Free',
        description: 'Get started with basic tasks',
        price: 0,
        currency: 'KES',
        billingPeriod: 'MONTHLY',
        sortOrder: 0,
        features: {
          create: [
            { feature: 'Up to 5 tasks per day', included: true },
            { feature: 'Basic task categories', included: true },
            { feature: '50 tasks per month', included: true },
            { feature: 'Survey tasks', included: false, limit: 0 },
            { feature: 'AI evaluation tasks', included: false },
            { feature: 'Prompt engineering', included: false },
            { feature: 'Task creation', included: false },
            { feature: 'Priority support', included: false },
          ],
        },
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'STARTER' },
      update: {},
      create: {
        slug: 'STARTER',
        name: 'Starter',
        description: 'Unlock more task categories',
        price: 299,
        currency: 'KES',
        billingPeriod: 'MONTHLY',
        sortOrder: 1,
        features: {
          create: [
            { feature: '15 tasks per day', included: true },
            { feature: 'More task categories', included: true },
            { feature: '150 tasks per month', included: true },
            { feature: 'Survey tasks (5/month)', included: true, limit: 5 },
            { feature: 'Data annotation tasks', included: true },
            { feature: 'AI evaluation tasks', included: false },
            { feature: 'Task creation', included: false },
            { feature: 'Priority support', included: false },
          ],
        },
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'PRO' },
      update: {},
      create: {
        slug: 'PRO',
        name: 'Pro',
        description: 'Full access to all task categories',
        price: 799,
        currency: 'KES',
        billingPeriod: 'MONTHLY',
        sortOrder: 2,
        features: {
          create: [
            { feature: '50 tasks per day', included: true },
            { feature: 'All task categories', included: true },
            { feature: '500 tasks per month', included: true },
            { feature: 'Survey creation (20/month)', included: true, limit: 20 },
            { feature: 'AI evaluation & prompt tasks', included: true },
            { feature: 'Task creation (5/month)', included: true, limit: 5 },
            { feature: 'Advanced earnings dashboard', included: true },
            { feature: 'Priority support', included: false },
          ],
        },
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'BUSINESS' },
      update: {},
      create: {
        slug: 'BUSINESS',
        name: 'Business',
        description: 'Advanced creation and management tools',
        price: 2499,
        currency: 'KES',
        billingPeriod: 'MONTHLY',
        sortOrder: 3,
        features: {
          create: [
            { feature: '100 tasks per day', included: true },
            { feature: 'All task categories', included: true },
            { feature: '1,000 tasks per month', included: true },
            { feature: 'Survey creation (50/month)', included: true, limit: 50 },
            { feature: 'Task creation (20/month)', included: true, limit: 20 },
            { feature: 'Advanced analytics', included: true },
            { feature: 'Team management', included: true },
            { feature: 'Priority support', included: true },
          ],
        },
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'ENTERPRISE' },
      update: {},
      create: {
        slug: 'ENTERPRISE',
        name: 'Enterprise',
        description: 'Unlimited access for organizations',
        price: 9999,
        currency: 'KES',
        billingPeriod: 'MONTHLY',
        sortOrder: 4,
        features: {
          create: [
            { feature: 'Unlimited tasks', included: true },
            { feature: 'All task categories', included: true },
            { feature: 'Unlimited monthly tasks', included: true },
            { feature: 'Unlimited survey creation', included: true },
            { feature: 'Unlimited task creation', included: true },
            { feature: 'Custom analytics & reporting', included: true },
            { feature: 'Dedicated account manager', included: true },
            { feature: '24/7 Priority support', included: true },
          ],
        },
      },
    }),
  ]);

  // ── Task Categories ───────────────────────────────────────────────────────
  console.log('Creating task categories...');

  const categories = [
    { slug: 'surveys', name: 'Surveys', icon: '📋', description: 'Complete surveys and questionnaires', requiredPlan: 'FREE' as any, color: '#16A34A', sortOrder: 0 },
    { slug: 'survey-creation', name: 'Survey Creation', icon: '✏️', description: 'Create and design surveys', requiredPlan: 'STARTER' as any, color: '#0EA5E9', sortOrder: 1 },
    { slug: 'prompt-engineering', name: 'Prompt Engineering', icon: '⚡', description: 'Design and improve AI prompts', requiredPlan: 'PRO' as any, color: '#7C3AED', sortOrder: 2 },
    { slug: 'ai-evaluation', name: 'AI Response Evaluation', icon: '🤖', description: 'Evaluate and rate AI-generated content', requiredPlan: 'PRO' as any, color: '#6366F1', sortOrder: 3 },
    { slug: 'data-annotation', name: 'Data Annotation', icon: '🏷️', description: 'Label and annotate data for AI training', requiredPlan: 'STARTER' as any, color: '#F59E0B', sortOrder: 4 },
    { slug: 'image-classification', name: 'Image Classification', icon: '🖼️', description: 'Categorize and label images', requiredPlan: 'FREE' as any, color: '#EC4899', sortOrder: 5 },
    { slug: 'text-classification', name: 'Text Classification', icon: '📝', description: 'Classify and categorize text content', requiredPlan: 'FREE' as any, color: '#14B8A6', sortOrder: 6 },
    { slug: 'content-moderation', name: 'Content Moderation', icon: '🛡️', description: 'Review and moderate content', requiredPlan: 'STARTER' as any, color: '#DC2626', sortOrder: 7 },
    { slug: 'web-research', name: 'Web Research', icon: '🔍', description: 'Conduct web research and gather information', requiredPlan: 'FREE' as any, color: '#2563EB', sortOrder: 8 },
    { slug: 'data-collection', name: 'Data Collection', icon: '📊', description: 'Collect and organize data', requiredPlan: 'FREE' as any, color: '#7C3AED', sortOrder: 9 },
    { slug: 'transcription', name: 'Transcription', icon: '🎙️', description: 'Transcribe audio and video content', requiredPlan: 'STARTER' as any, color: '#0891B2', sortOrder: 10 },
    { slug: 'search-relevance', name: 'Search Relevance', icon: '🎯', description: 'Rate search result quality', requiredPlan: 'FREE' as any, color: '#D97706', sortOrder: 11 },
    { slug: 'product-categorization', name: 'Product Categorization', icon: '🛒', description: 'Categorize products and items', requiredPlan: 'FREE' as any, color: '#16A34A', sortOrder: 12 },
    { slug: 'content-writing', name: 'Content Writing', icon: '✍️', description: 'Write articles, descriptions, and copy', requiredPlan: 'PRO' as any, color: '#6366F1', sortOrder: 13 },
    { slug: 'ai-training', name: 'AI Training', icon: '🧠', description: 'Help train AI models with feedback', requiredPlan: 'PRO' as any, color: '#8B5CF6', sortOrder: 14 },
    { slug: 'audio-evaluation', name: 'Audio Evaluation', icon: '🎵', description: 'Evaluate audio quality and content', requiredPlan: 'STARTER' as any, color: '#EC4899', sortOrder: 15 },
    { slug: 'translation', name: 'Translation', icon: '🌐', description: 'Translate text between languages', requiredPlan: 'STARTER' as any, color: '#0EA5E9', sortOrder: 16 },
{ slug: 'website-testing', name: 'Website Testing', icon: '💻', description: 'Test websites and report issues', requiredPlan: 'PRO' as any, color: '#F97316', sortOrder: 17 },
  ];

  const createdCategories: any[] = [];
  for (const cat of categories) {
    const created = await prisma.taskCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories.push(created);
  }

  // ── Admin User ────────────────────────────────────────────────────────────
  console.log('Creating admin user...');

  const adminPassword = await bcrypt.hash('Admin@Remotask2024!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@remotask.co.ke' },
    update: {},
    create: {
      email: 'admin@remotask.co.ke',
      name: 'Remotask Admin',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      country: 'Kenya',
    },
  });

  // Assign Enterprise subscription to admin
  const enterprisePlan = plans.find(p => p.slug === 'ENTERPRISE')!;
  await prisma.subscription.upsert({
    where: { id: 'admin-sub' },
    update: {},
    create: {
      id: 'admin-sub',
      userId: admin.id,
      planId: enterprisePlan.id,
      status: 'ACTIVE',
      dailyTaskLimit: 999,
      monthlyTaskLimit: 9999,
      maxActiveTasks: 999,
      surveyCreateLimit: 999,
      taskCreateLimit: 999,
    },
  });

  // ── Demo Tasks (clearly marked) ───────────────────────────────────────────
  console.log('Creating demo tasks...');

  const surveyCat = createdCategories.find(c => c.slug === 'surveys')!;
  const promptCat = createdCategories.find(c => c.slug === 'prompt-engineering')!;
  const aiEvalCat = createdCategories.find(c => c.slug === 'ai-evaluation')!;
  const imgCat    = createdCategories.find(c => c.slug === 'image-classification')!;
  const textCat   = createdCategories.find(c => c.slug === 'text-classification')!;
  const researchCat = createdCategories.find(c => c.slug === 'web-research')!;

  const demoTasks = [
    {
      title: 'Consumer Preferences Survey',
      slug: 'consumer-preferences-survey-demo',
      categoryId: surveyCat.id,
      creatorId: admin.id,
      description: 'Share your opinions on everyday consumer products and online shopping in Kenya. Quick and easy to complete.',
      instructions: 'Answer all questions honestly based on your personal experience. This survey takes approximately 8 minutes to complete.',
      reward: 80,
      estimatedMinutes: 8,
      difficulty: 'BEGINNER' as const,
      totalSlots: 500,
      requiredPlan: 'FREE' as const,
      status: 'PUBLISHED' as const,
      tags: 'survey, consumer, beginner',
      isDemo: true,
      publishedAt: new Date(),
      questions: [
        {
          type: 'SINGLE_CHOICE' as const,
          question: 'How frequently do you make online purchases using your mobile phone or laptop?',
          options: ['Daily', '2-3 times per week', 'Once a month', 'Rarely or never'],
          isRequired: true,
        },
        {
          type: 'RATING' as const,
          question: 'Rate your overall satisfaction with mobile money (M-Pesa / Airtel Money) checkout speeds in Kenyan web apps (1-5 stars):',
          options: [],
          isRequired: true,
        },
        {
          type: 'YES_NO' as const,
          question: 'Have you ever abandoned an online shopping cart due to delayed payment prompts or OTP SMS?',
          options: [],
          isRequired: true,
        },
        {
          type: 'LONG_TEXT' as const,
          question: 'What is the single most important improvement online shopping platforms should make to improve your experience?',
          options: [],
          isRequired: true,
        },
      ],
    },
    {
      title: 'Improve This Customer Support Prompt',
      slug: 'improve-customer-support-prompt-demo',
      categoryId: promptCat.id,
      creatorId: admin.id,
      description: 'Rewrite and improve a prompt for an AI customer support assistant to produce more helpful, structured responses.',
      instructions: 'You will be given a poorly written AI prompt. Your task is to rewrite it so it produces better structured, more helpful customer support responses. Include instructions for tone, format, and handling edge cases.',
      reward: 250,
      estimatedMinutes: 20,
      difficulty: 'INTERMEDIATE' as const,
      totalSlots: 100,
      requiredPlan: 'PRO' as const,
      status: 'PUBLISHED' as const,
      tags: 'AI, prompt, writing',
      isDemo: true,
      publishedAt: new Date(),
      questions: [
        {
          type: 'LONG_TEXT' as const,
          question: "Original prompt: 'Help the customer with their order problem.' Rewrite this into an effective, role-defined AI system prompt with instructions on empathetic tone, required customer verification questions (Order ID & Email), and polite escalation policies:",
          options: [],
          isRequired: true,
        },
        {
          type: 'SINGLE_CHOICE' as const,
          question: 'Which primary safety guardrail or constraint did you emphasize most in your rewritten prompt?',
          options: [
            'Strict verification before sharing order details',
            'Customer sentiment escalation to human manager',
            'Clear refund policy boundaries',
            'Profanity and abuse handling filters',
          ],
          isRequired: true,
        },
        {
          type: 'RATING' as const,
          question: 'Rate the expected accuracy and structure improvement of your new prompt (1-5 stars):',
          options: [],
          isRequired: true,
        },
        {
          type: 'YES_NO' as const,
          question: 'Does your improved prompt provide a concrete few-shot example for the AI model?',
          options: [],
          isRequired: true,
        },
      ],
    },
    {
      title: 'Evaluate AI-Generated Product Descriptions',
      slug: 'evaluate-ai-product-descriptions-demo',
      categoryId: aiEvalCat.id,
      creatorId: admin.id,
      description: 'Compare two AI-generated product descriptions and rate them on accuracy, clarity, and persuasiveness.',
      instructions: 'You will see two AI-generated product descriptions for the same item. Rate each on a 1-5 scale for accuracy, clarity, and persuasiveness. Select which is better and explain why.',
      reward: 150,
      estimatedMinutes: 12,
      difficulty: 'BEGINNER' as const,
      totalSlots: 300,
      requiredPlan: 'PRO' as const,
      status: 'PUBLISHED' as const,
      tags: 'AI, evaluation, writing',
      isDemo: true,
      publishedAt: new Date(),
      questions: [
        {
          type: 'RATING' as const,
          question: "Model A Output: 'Ultra-fast wireless noise-canceling headphones featuring 40-hour playtime, quick USB-C charging, and Bluetooth 5.3 connectivity.' Rate Model A on technical clarity (1-5):",
          options: [],
          isRequired: true,
        },
        {
          type: 'RATING' as const,
          question: "Model B Output: 'Lose yourself in crystal-clear studio acoustics wherever your journey takes you. Designed for all-day comfort and deep, punchy bass.' Rate Model B on persuasive appeal (1-5):",
          options: [],
          isRequired: true,
        },
        {
          type: 'SINGLE_CHOICE' as const,
          question: 'Which AI model output is more effective for high-conversion e-commerce listings?',
          options: [
            'Model A (Direct, spec-focused, high clarity)',
            'Model B (Lifestyle, emotional, aspirational)',
            'Equal blend of both',
            'Neither - requires further prompt refinement',
          ],
          isRequired: true,
        },
        {
          type: 'LONG_TEXT' as const,
          question: 'Provide brief evaluation notes explaining what prompt adjustments would produce an optimal hybrid response:',
          options: [],
          isRequired: true,
        },
      ],
    },
    {
      title: 'Image Scene Classification',
      slug: 'image-scene-classification-demo',
      categoryId: imgCat.id,
      creatorId: admin.id,
      description: 'Classify images into the correct scene category. Simple click-based task, no typing required.',
      instructions: 'You will be shown an image. Select the category that best describes the scene in the image from the provided options.',
      reward: 40,
      estimatedMinutes: 3,
      difficulty: 'BEGINNER' as const,
      totalSlots: 1000,
      requiredPlan: 'FREE' as const,
      status: 'PUBLISHED' as const,
      tags: 'image, classification, beginner',
      isDemo: true,
      publishedAt: new Date(),
      questions: [
        {
          type: 'SINGLE_CHOICE' as const,
          question: 'Scene: Sun setting over the Great Rift Valley with acacia trees in the foreground. Classify the scene environment:',
          options: [
            'African Savannah / Wilderness',
            'Urban Cityscape',
            'Coastal / Ocean Beach',
            'Dense Alpine Forest',
          ],
          isRequired: true,
        },
        {
          type: 'YES_NO' as const,
          question: 'Is the lighting condition in the scene categorized as Golden Hour / Sunset?',
          options: [],
          isRequired: true,
        },
        {
          type: 'RATING' as const,
          question: 'Rate the visual clarity and composition of this image capture (1-5):',
          options: [],
          isRequired: true,
        },
      ],
    },
    {
      title: 'Classify Customer Review Sentiment',
      slug: 'classify-customer-review-sentiment-demo',
      categoryId: textCat.id,
      creatorId: admin.id,
      description: 'Read customer reviews and classify them as positive, neutral, or negative. Quick and simple.',
      instructions: 'Read the provided customer review carefully. Select the sentiment that best matches: Positive, Neutral, or Negative. If mixed, choose the dominant sentiment.',
      reward: 30,
      estimatedMinutes: 2,
      difficulty: 'BEGINNER' as const,
      totalSlots: 2000,
      requiredPlan: 'FREE' as const,
      status: 'PUBLISHED' as const,
      tags: 'text, sentiment, classification, beginner',
      isDemo: true,
      publishedAt: new Date(),
      questions: [
        {
          type: 'SINGLE_CHOICE' as const,
          question: "Customer Review: 'The delivery was two days later than promised, but the packaging was immaculate and the product quality exceeded my expectations.' Classify the overall sentiment:",
          options: ['Positive', 'Neutral / Mixed', 'Negative'],
          isRequired: true,
        },
        {
          type: 'SHORT_TEXT' as const,
          question: "Identify and quote the positive sentiment phrases from the customer's text:",
          options: [],
          isRequired: true,
        },
        {
          type: 'YES_NO' as const,
          question: 'Is customer churn risk indicated in this review?',
          options: [],
          isRequired: true,
        },
      ],
    },
    {
      title: 'Research: Top 5 Business Permit Requirements in Nairobi',
      slug: 'research-nairobi-business-permits-demo',
      categoryId: researchCat.id,
      creatorId: admin.id,
      description: 'Research and document the top 5 business permit requirements for starting a small business in Nairobi, Kenya.',
      instructions: 'Using official sources (Nairobi City County website, KRA, etc.), research and list the top 5 permit requirements for a new small business in Nairobi. Include: permit name, issuing authority, cost (if public), and official source URL.',
      reward: 200,
      estimatedMinutes: 30,
      difficulty: 'INTERMEDIATE' as const,
      totalSlots: 50,
      requiredPlan: 'FREE' as const,
      status: 'PUBLISHED' as const,
      tags: 'research, Kenya, business',
      isDemo: true,
      publishedAt: new Date(),
      questions: [
        {
          type: 'SHORT_TEXT' as const,
          question: 'List the Unified Business Permit (UBP) official issuing portal or authority for Nairobi City County:',
          options: [],
          isRequired: true,
        },
        {
          type: 'YES_NO' as const,
          question: 'Is a valid Food & Hygiene license required if the small business handles prepared food?',
          options: [],
          isRequired: true,
        },
        {
          type: 'LONG_TEXT' as const,
          question: 'Paste the official source URL and key compliance notes for starting an SME in Nairobi:',
          options: [],
          isRequired: true,
        },
      ],
    },
  ];

  for (const task of demoTasks) {
    const { questions, ...taskData } = task;
    const createdTask = await prisma.task.upsert({
      where: { slug: task.slug },
      update: {
        description: taskData.description,
        instructions: taskData.instructions,
        reward: taskData.reward,
        requiredPlan: taskData.requiredPlan,
      },
      create: taskData,
    });

    if (questions && questions.length > 0) {
      // Clear old questions if needed and insert fresh
      await prisma.taskQuestion.deleteMany({ where: { taskId: createdTask.id } });
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await prisma.taskQuestion.create({
          data: {
            taskId: createdTask.id,
            type: q.type,
            question: q.question,
            isRequired: q.isRequired,
            sortOrder: i + 1,
            ...(q.options && q.options.length > 0 ? {
              options: {
                create: q.options.map((optText, oIdx) => ({
                  text: optText,
                  sortOrder: oIdx,
                })),
              },
            } : {}),
          },
        });
      }
    }
  }

  // ── Site Settings ─────────────────────────────────────────────────────────
  console.log('Creating site settings...');

  const settings = [
    { key: 'site_name', value: 'Remotask', type: 'string', group: 'general' },
    { key: 'site_currency', value: 'KES', type: 'string', group: 'general' },
    { key: 'minimum_payout', value: '500', type: 'number', group: 'payments' },
    { key: 'support_email', value: 'support@remotask.co.ke', type: 'string', group: 'general' },
    { key: 'maintenance_mode', value: 'false', type: 'boolean', group: 'general' },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Seeding complete!');
  console.log('');
  console.log('⚠️  DEMO DATA NOTICE:');
  console.log('   All demo tasks are marked with isDemo=true.');
  console.log('   Admin credentials: admin@remotask.co.ke / Admin@Remotask2024!');
  console.log('   CHANGE ADMIN PASSWORD BEFORE GOING TO PRODUCTION!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
