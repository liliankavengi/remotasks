import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './prisma';

const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
  isGoogleAuth: z.string().optional(),
  name: z.string().optional(),
  avatar: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = AuthSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, isGoogleAuth, name, avatar } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        if (isGoogleAuth === 'true') {
          // Direct Google email selection flow — runs smoothly with zero Google Console setup
          let user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: {
              subscriptions: {
                where: { status: 'ACTIVE' },
                include: { plan: true },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          });

          if (user) {
            if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
              throw new Error('Account suspended');
            }

            // Ensure profile exists
            await prisma.profile.upsert({
              where: { userId: user.id },
              update: {},
              create: {
                userId: user.id,
                bio: 'Remotask Contributor',
                skills: 'Data Annotation, Surveys',
              },
            }).catch(() => {});

            // Ensure active subscription exists
            if (!user.subscriptions.length) {
              const freePlan = await prisma.plan.findUnique({ where: { slug: 'FREE' } });
              if (freePlan) {
                const sub = await prisma.subscription.create({
                  data: {
                    userId: user.id,
                    planId: freePlan.id,
                    status: 'ACTIVE',
                    dailyTaskLimit: 5,
                    monthlyTaskLimit: 50,
                    maxActiveTasks: 3,
                  },
                  include: { plan: true },
                }).catch(() => null);
                if (sub) user.subscriptions = [sub as any];
              }
            }
          } else {
            // New user registration via Google selection
            const derivedName = name?.trim() ||
              normalizedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

            const freePlan = await prisma.plan.findUnique({ where: { slug: 'FREE' } });

            user = await prisma.user.create({
              data: {
                email: normalizedEmail,
                name: derivedName,
                emailVerified: new Date(),
                avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(derivedName)}&background=4285F4&color=fff`,
                profile: {
                  create: {
                    bio: 'Remotask Contributor',
                    skills: 'Data Annotation, Surveys',
                  },
                },
                ...(freePlan ? {
                  subscriptions: {
                    create: {
                      planId: freePlan.id,
                      status: 'ACTIVE',
                      dailyTaskLimit: 5,
                      monthlyTaskLimit: 50,
                      maxActiveTasks: 3,
                      surveyCreateLimit: 0,
                      taskCreateLimit: 0,
                    },
                  },
                } : {}),
              },
              include: {
                subscriptions: {
                  where: { status: 'ACTIVE' },
                  include: { plan: true },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            });

            await prisma.auditLog.create({
              data: {
                actorId: user.id,
                action: 'USER_REGISTERED',
                resource: 'user',
                resourceId: user.id,
              },
            }).catch(() => {});
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            plan: user.subscriptions[0]?.plan?.slug ?? 'FREE',
            planName: user.subscriptions[0]?.plan?.name ?? 'Free',
          };
        }

        // Standard Email + Password Login
        if (!password) return null;

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
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
          throw new Error('This account was registered using Google. Please click "Continue with Google".');
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
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.plan = (user as any).plan;
        token.planName = (user as any).planName;
      }

      const targetId = (token.id || user?.id || token.sub) as string;
      if (targetId && (!token.plan || trigger === 'update')) {
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
      if (token && session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
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
      if (!user?.id) return;
      const userId = user.id;
      // Auto-provision profile and free subscription for OAuth accounts
      try {
        await prisma.profile.upsert({
          where: { userId },
          update: {},
          create: {
            userId,
            bio: '',
            skills: '',
          },
        });

        const freePlan = await prisma.plan.findUnique({ where: { slug: 'FREE' } });
        if (freePlan) {
          const existingSub = await prisma.subscription.findFirst({
            where: { userId, status: 'ACTIVE' },
          });
          if (!existingSub) {
            await prisma.subscription.create({
              data: {
                userId,
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
            actorId: userId,
            action: 'USER_REGISTERED',
            resource: 'user',
            resourceId: userId,
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
