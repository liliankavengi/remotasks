// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Remotask — Work Online. Complete Tasks. Get Rewarded.',
    template: '%s | Remotask',
  },
  description: 'Remotask connects people with digital tasks across surveys, research, AI evaluation, content, data and more. Complete tasks and earn from anywhere.',
  keywords: ['remote work', 'tasks', 'earn online', 'surveys', 'AI evaluation', 'data annotation', 'Kenya', 'M-Pesa'],
  authors: [{ name: 'Remotask' }],
  creator: 'Remotask',
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: process.env.APP_URL,
    siteName: 'Remotask',
    title: 'Remotask — Work Online. Complete Tasks. Get Rewarded.',
    description: 'Complete digital tasks and earn money online with Remotask.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Remotask',
    description: 'Complete digital tasks and earn money online.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
