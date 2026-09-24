# 🚀 Remotask — Vercel Deployment & Production Setup Guide

This document provides step-by-step instructions for deploying **Remotask** to **Vercel** with full PostgreSQL database integration, PayHero M-Pesa payments, and Google OAuth.

---

## 📋 Prerequisites

1. A [Vercel Account](https://vercel.com).
2. A PostgreSQL Database instance (Vercel Postgres, Supabase, Neon, or Railway).
3. A PayHero Account (`https://payhero.co.ke`) with your Username, Password, and Channel ID.
4. Google Cloud Console Credentials (if enabling Google Sign-Up/Sign-In).

---

## 🛠️ Step 1: Push Repository to GitHub

Ensure your project is pushed to a GitHub repository:

```bash
git add .
git commit -m "Configure Remotask for Vercel deployment with PayHero"
git push origin main
```

---

## ⚡ Step 2: Deploy on Vercel

1. Log into your **Vercel Dashboard** and click **"Add New Project"**.
2. Select your `remotask` GitHub repository.
3. In the project setup panel:
   - **Framework Preset:** `Next.js`
   - **Build Command:** `npm run vercel-build` *(Automatically configured via `vercel.json`)*
   - **Install Command:** `npm install`

---

## 🔑 Step 3: Configure Environment Variables in Vercel

Under **Settings ➔ Environment Variables** in your Vercel project, add the following variables:

### 1. Database Connection (`DATABASE_URL`)
```env
DATABASE_URL="postgresql://user:password@hostname:5432/remotask_db?sslmode=require"
```
*(If using Vercel Postgres / Neon / Supabase, copy the pooled connection string provided by your database dashboard)*

> **Note on Prisma Provider:** Ensure `prisma/schema.prisma` line 9 has `provider = "postgresql"`.

### 2. NextAuth & App URLs
```env
NEXTAUTH_URL="https://your-app-name.vercel.app"
AUTH_SECRET="generate-a-strong-secret-key-here-32-chars-minimum"
NEXTAUTH_SECRET="generate-a-strong-secret-key-here-32-chars-minimum"
APP_URL="https://your-app-name.vercel.app"
NODE_ENV="production"
```

### 3. PayHero M-Pesa Payment Integration
```env
PAYHERO_USERNAME="your_payhero_username"
PAYHERO_PASSWORD="your_payhero_password"
PAYHERO_CHANNEL_ID="1234"
PAYHERO_CALLBACK_URL="https://your-app-name.vercel.app/api/payments/webhook"
```

### 4. Google OAuth (Optional)
```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## 🔄 Step 4: Automated Build & Seed

When Vercel builds your application, the `vercel-build` command automatically executes:
1. `prisma generate` — Generates the Prisma Client.
2. `prisma db push` — Syncs the schema with your production PostgreSQL database.
3. `npx tsx prisma/seed.ts` — Seeds default admin credentials (`admin@remotask.co.ke` / `Admin@Remotask2024!`), standard plans (`FREE`, `STARTER`, `PRO`, `VIP`, `ENTERPRISE`), and task categories.
4. `next build` — Builds the Next.js production bundle.

---

## 💳 Step 5: Configure PayHero Callback URL

1. Log into your [PayHero Dashboard](https://backend.payhero.co.ke).
2. Go to **Channel Settings** or **API & Webhooks**.
3. Set your Callback URL to:
   ```
   https://your-app-name.vercel.app/api/payments/webhook
   ```
4. Save settings. All live M-Pesa STK Push payments initiated from `/upgrade` will now automatically process and instantly upgrade worker accounts upon completion.

---

## 👑 Default Production Credentials

After initial deployment and database seeding:
* **Admin Email:** `admin@remotask.co.ke`
* **Admin Password:** `Admin@Remotask2024!`
* **Admin Portal URL:** `https://your-app-name.vercel.app/admin`

*(Remember to update the admin password after your first login in `/profile` or `/settings`)*
