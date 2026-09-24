'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  Zap,
  Shield,
  Smartphone,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  priceKes: number;
  priceUsd: number;
  maxDailyTasks: number;
  maxMonthlyTasks: number;
  earningMultiplier: number;
  features: string[];
}

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get('plan');

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string>(preselectedPlan || 'PRO');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [isInitiating, setIsInitiating] = useState(false);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll timer state
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      // Hardcoded high-value plans matching Prisma seed
      const defaultPlans: Plan[] = [
        {
          id: 'free',
          name: 'Free Starter',
          slug: 'FREE',
          priceKes: 0,
          priceUsd: 0,
          maxDailyTasks: 3,
          maxMonthlyTasks: 30,
          earningMultiplier: 1.0,
          features: ['Basic Survey Tasks', 'Standard Payout Speed', 'Public Support Forum'],
        },
        {
          id: 'starter',
          name: 'Bronze Starter',
          slug: 'STARTER',
          priceKes: 500,
          priceUsd: 5,
          maxDailyTasks: 10,
          maxMonthlyTasks: 150,
          earningMultiplier: 1.25,
          features: ['AI Data Labeling Tasks', 'Priority Submission Review', 'Email Support', '1.25x Earning Rate'],
        },
        {
          id: 'pro',
          name: 'Silver Pro',
          slug: 'PRO',
          priceKes: 1500,
          priceUsd: 15,
          maxDailyTasks: 30,
          maxMonthlyTasks: 500,
          earningMultiplier: 1.5,
          features: ['Prompt Engineering & RLHF Tasks', 'Same-Day M-Pesa Payouts', 'Dedicated Support', '1.5x Earning Rate'],
        },
        {
          id: 'vip',
          name: 'Gold VIP',
          slug: 'VIP',
          priceKes: 5000,
          priceUsd: 50,
          maxDailyTasks: 100,
          maxMonthlyTasks: 2000,
          earningMultiplier: 2.0,
          features: ['All Premium AI & LLM Tasks', 'Instant M-Pesa Payouts', 'Survey Creator Tool Access', '2.0x Earning Multiplier'],
        },
        {
          id: 'enterprise',
          name: 'Platinum Enterprise',
          slug: 'ENTERPRISE',
          priceKes: 15000,
          priceUsd: 150,
          maxDailyTasks: 9999,
          maxMonthlyTasks: 99999,
          earningMultiplier: 2.5,
          features: ['Unlimited Task Submissions', 'Custom Survey Builder', 'Account Manager', '2.5x Max Multiplier'],
        },
      ];
      setPlans(defaultPlans);
    } finally {
      setLoading(false);
    }
  };

  // Polling mechanism when STK push is pending
  useEffect(() => {
    if (paymentStatus !== 'PENDING' || !paymentRef) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${paymentRef}`);
        const data = await res.json();

        if (data.status === 'COMPLETED') {
          setPaymentStatus('SUCCESS');
          clearInterval(interval);
        } else if (data.status === 'FAILED') {
          setPaymentStatus('FAILED');
          setErrorMessage(data.failureReason || 'Payment request was declined or timed out.');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }

      setPollCount((prev) => prev + 1);
    }, 3000);

    // Timeout after 60 seconds (20 polling cycles)
    if (pollCount > 20) {
      setPaymentStatus('FAILED');
      setErrorMessage('STK Push request timed out. Please try again.');
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [paymentStatus, paymentRef, pollCount]);

  const handleInitiateSTK = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPlan = plans.find((p) => p.slug === selectedPlanSlug);

    if (!selectedPlan || selectedPlan.priceKes <= 0) {
      alert('Free plan requires no payment.');
      return;
    }

    if (!phone.trim()) {
      alert('Please enter your M-Pesa phone number.');
      return;
    }

    setIsInitiating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate M-Pesa payment.');
      }

      setPaymentRef(data.reference);
      setPaymentStatus('PENDING');
      setPollCount(0);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation error.');
      setPaymentStatus('FAILED');
    } finally {
      setIsInitiating(false);
    }
  };

  const currentSelectedPlan = plans.find((p) => p.slug === selectedPlanSlug);

  return (
    <div className="container py-10 max-w-6xl">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
        <div className="badge badge-primary inline-flex items-center gap-1.5 px-3 py-1">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          Unlock High-Paying AI & Survey Tasks
        </div>
        <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
          Choose Your Work Membership Plan
        </h1>
        <p className="text-muted text-sm leading-relaxed">
          Upgrade your account tier to increase your daily task limit, unlock lucrative AI evaluation categories, and get up to <span className="text-emerald-400 font-bold">2.5x higher pay</span> per task.
        </p>
      </div>

      {/* Plans Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
        {plans.map((plan) => {
          const isSelected = selectedPlanSlug === plan.slug;
          const isPopular = plan.slug === 'PRO';

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanSlug(plan.slug)}
              className={`card p-5 cursor-pointer relative transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-2 border-emerald-500 bg-emerald-950/20 shadow-xl shadow-emerald-500/10 scale-[1.02]'
                  : 'hover:border-zinc-700'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-zinc-950 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-base">{plan.name}</h3>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                </div>

                <div className="my-3">
                  <span className="text-2xl font-extrabold text-white">
                    KES {plan.priceKes.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted block font-mono">
                    (${plan.priceUsd} USD) / month
                  </span>
                </div>

                <div className="text-xs bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800 space-y-1 my-3">
                  <div className="flex justify-between text-zinc-300">
                    <span>Daily Tasks:</span>
                    <span className="font-bold text-white">{plan.maxDailyTasks}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Earning Rate:</span>
                    <span className="font-bold text-emerald-400">{plan.earningMultiplier}x</span>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-muted mb-4">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className={`btn w-full text-xs py-2 ${
                  isSelected ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {isSelected ? 'Selected Plan' : 'Select Plan'}
              </button>
            </div>
          );
        })}
      </div>

      {/* M-Pesa Payment Card */}
      {currentSelectedPlan && currentSelectedPlan.priceKes > 0 && (
        <div className="max-w-xl mx-auto card p-8 border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-card shadow-2xl">
          <div className="flex items-center gap-3 pb-6 border-b border-border mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                Instant M-Pesa STK Push Payment
              </h2>
              <p className="text-xs text-muted">
                Upgrading to <span className="text-emerald-400 font-bold">{currentSelectedPlan.name}</span> for{' '}
                <span className="text-white font-bold">KES {currentSelectedPlan.priceKes.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Form / Payment Controls */}
          {paymentStatus === 'IDLE' && (
            <form onSubmit={handleInitiateSTK} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  M-Pesa Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0712345678 or 254712345678"
                    className="input w-full pl-10 font-mono text-sm"
                    required
                  />
                  <Smartphone className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                </div>
                <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Secured by PayHero STK Push API integration.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isInitiating}
                className="btn btn-primary w-full py-3 text-sm font-bold shadow-lg shadow-emerald-500/20"
              >
                {isInitiating ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting to M-Pesa...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Pay KES {currentSelectedPlan.priceKes.toLocaleString()} via M-Pesa
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          )}

          {/* STK Push Pending Modal/Overlay */}
          {paymentStatus === 'PENDING' && (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <Smartphone className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Check Your Phone!</h3>
              <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                An M-Pesa STK prompt has been sent to <span className="text-emerald-400 font-mono font-bold">{phone}</span>. Please enter your M-Pesa PIN to complete payment.
              </p>
              <div className="text-xs text-zinc-500 font-mono">
                Waiting for payment confirmation... ({pollCount * 3}s)
              </div>
            </div>
          )}

          {/* Payment Success View */}
          {paymentStatus === 'SUCCESS' && (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-white">Payment Received!</h3>
              <p className="text-sm text-muted">
                Your account has been instantly upgraded to <span className="text-emerald-400 font-bold">{currentSelectedPlan.name}</span>.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn btn-primary px-8"
                >
                  Go to Dashboard & Start Tasks
                </button>
              </div>
            </div>
          )}

          {/* Payment Failed View */}
          {paymentStatus === 'FAILED' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500 text-red-400 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white">Payment Failed or Cancelled</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                {errorMessage || 'The transaction could not be completed.'}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setPaymentStatus('IDLE')}
                  className="btn btn-secondary px-6 text-xs"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
