import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './prisma';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              include: { plan: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        });

        if (!user) return null;
        if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
          throw new Error('Account suspended');
        }

        if (!user.passwordHash) {
          throw new Error('This account was registered using Google. Please click "Sign in with Google".');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          plan: user.subscriptions[0]?.plan?.slug ?? 'FREE',
          planName: user.subscriptions[0]?.plan?.name ?? 'Free',
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { status: true },
        });
        if (dbUser && (dbUser.status === 'SUSPENDED' || dbUser.status === 'BANNED')) {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      const targetId = (user?.id || token.id) as string;
      if (targetId && (user || !token.plan || trigger === 'update')) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: targetId },
            include: {
              subscriptions: {
                where: { status: 'ACTIVE' },
                include: { plan: true },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.status = dbUser.status;
            token.plan = dbUser.subscriptions[0]?.plan?.slug ?? 'FREE';
            token.planName = dbUser.subscriptions[0]?.plan?.name ?? 'Free';
          }
        } catch (e) {
          console.error('[NextAuth] JWT callback fetch error:', e);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
        (session.user as any).plan = token.plan;
        (session.user as any).planName = token.planName;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-provision profile and free subscription for OAuth accounts
      try {
        await prisma.profile.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            bio: '',
            skills: '',
          },
        });

        const freePlan = await prisma.plan.findUnique({ where: { slug: 'FREE' } });
        if (freePlan) {
          const existingSub = await prisma.subscription.findFirst({
            where: { userId: user.id, status: 'ACTIVE' },
          });
          if (!existingSub) {
            await prisma.subscription.create({
              data: {
                userId: user.id,
                planId: freePlan.id,
                status: 'ACTIVE',
                dailyTaskLimit: 5,
                monthlyTaskLimit: 50,
                maxActiveTasks: 3,
                surveyCreateLimit: 0,
                taskCreateLimit: 0,
              },
            });
          }
        }

        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: 'USER_REGISTERED_GOOGLE',
            resource: 'user',
            resourceId: user.id,
          },
        });
      } catch (err) {
        console.error('[NextAuth] Error in createUser event:', err);
      }
    },
    async signIn({ user }) {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'USER_LOGIN',
          resource: 'auth',
        },
      }).catch(() => {});
    },
  },
});
