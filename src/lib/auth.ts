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
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
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
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.plan = (user as any).plan;
        token.planName = (user as any).planName;
      }

      // Refresh on update trigger
      if (trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
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
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.plan = dbUser.subscriptions[0]?.plan?.slug ?? 'FREE';
          token.planName = dbUser.subscriptions[0]?.plan?.name ?? 'Free';
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
    async signIn({ user }) {
      // Audit log
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'USER_LOGIN',
          resource: 'auth',
        },
      }).catch(() => {}); // Non-blocking
    },
  },
});
