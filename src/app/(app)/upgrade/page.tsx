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
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
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
          features: ['Basic Survey Tasks', 'Standard Payout Speed', 'Public Community Support'],
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
          features: ['Prompt Engineering Tasks', 'Same-Day M-Pesa Payouts', 'Dedicated Support', '1.5x Earning Rate'],
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
          features: ['All Premium AI & LLM Tasks', 'Instant M-Pesa Payouts', 'Survey Creator Access', '2.0x Earning Multiplier'],
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
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* Page Header */}
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            marginBottom: '12px',
          }}
        >
          <Zap size={14} color="#16a34a" />
          <span>Membership Tiers</span>
        </div>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            margin: '0 0 10px',
          }}
        >
          Choose Your Work Membership Plan
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
          Upgrade your account tier to increase your daily task limit, unlock lucrative AI evaluation categories, and get up to{' '}
          <strong style={{ color: '#16a34a' }}>2.5x higher pay</strong> per task.
        </p>
      </div>

      {/* Minimalistic Flashcards Grid */}
      <div className="flashcard-grid">
        {plans.map((plan) => {
          const isSelected = selectedPlanSlug === plan.slug;
          const isPopular = plan.slug === 'PRO';

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanSlug(plan.slug)}
              className={`flashcard ${isSelected ? 'selected' : ''}`}
            >
              {/* Optional Most Popular Ribbon */}
              {isPopular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-11px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                    whiteSpace: 'nowrap',
                    zIndex: 2,
                  }}
                >
                  Most Popular
                </div>
              )}

              {/* Card Top / Title */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    {plan.name}
                  </span>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: isSelected ? 'none' : '1.5px solid #cbd5e1',
                      backgroundColor: isSelected ? '#16a34a' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                {/* Price Display */}
                <div style={{ margin: '14px 0 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      KES {plan.priceKes.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>/ mo</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
                    (${plan.priceUsd} USD)
                  </div>
                </div>

                {/* Compact Flashcard Spec Box */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Daily tasks:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {plan.maxDailyTasks > 500 ? 'Unlimited' : `${plan.maxDailyTasks} / day`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Earnings:</span>
                    <span style={{ fontWeight: 800, color: '#16a34a' }}>{plan.earningMultiplier}x rate</span>
                  </div>
                </div>

                {/* Bullet Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {plan.features.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#334155' }}>
                      <Check size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ lineHeight: 1.4 }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Minimalist Selection Button */}
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? 'none' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#16a34a' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 10px rgba(22, 163, 74, 0.25)' : 'none',
                }}
              >
                {isSelected ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Selected Plan</span>
                  </>
                ) : (
                  <span>Select Plan</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Minimalist M-Pesa Checkout Card */}
      {currentSelectedPlan && currentSelectedPlan.priceKes > 0 && (
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '28px 24px',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '18px', borderBottom: '1px solid #f1f5f9', marginBottom: '20px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
                flexShrink: 0,
              }}
            >
              <Smartphone size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 3px' }}>
                Instant M-Pesa STK Push
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Upgrading to <strong style={{ color: '#16a34a' }}>{currentSelectedPlan.name}</strong> for{' '}
                <strong style={{ color: '#0f172a' }}>KES {currentSelectedPlan.priceKes.toLocaleString()}</strong>
              </p>
            </div>
          </div>

          {/* Status: IDLE Form */}
          {paymentStatus === 'IDLE' && (
            <form onSubmit={handleInitiateSTK}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  M-Pesa Phone Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0712345678 or 254712345678"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#0f172a',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  />
                  <Smartphone size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                  <Shield size={12} color="#16a34a" />
                  <span>Secured by PayHero STK Push API integration.</span>
                </div>
              </div>

              {errorMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#dc2626',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isInitiating}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: isInitiating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => { if (!isInitiating) e.currentTarget.style.backgroundColor = '#15803d'; }}
                onMouseLeave={(e) => { if (!isInitiating) e.currentTarget.style.backgroundColor = '#16a34a'; }}
              >
                {isInitiating ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" />
                    <span>Connecting to M-Pesa...</span>
                  </>
                ) : (
                  <>
                    <span>Pay KES {currentSelectedPlan.priceKes.toLocaleString()} via M-Pesa</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Status: PENDING */}
          {paymentStatus === 'PENDING' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  border: '3px solid #dcfce7',
                  borderTopColor: '#16a34a',
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Check Your Phone!
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 auto 12px', maxWidth: '340px' }}>
                A live M-Pesa STK prompt has been sent to <strong style={{ color: '#16a34a' }}>{phone}</strong>. Please enter your M-Pesa PIN to complete payment.
              </p>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginBottom: '16px' }}>
                Waiting for M-Pesa confirmation... ({pollCount * 3}s)
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={async () => {
                    if (!paymentRef) return;
                    try {
                      const res = await fetch(`/api/payments/status/${paymentRef}`);
                      const data = await res.json();
                      if (data.status === 'COMPLETED') {
                        setPaymentStatus('SUCCESS');
                      } else if (data.status === 'FAILED') {
                        setPaymentStatus('FAILED');
                        setErrorMessage(data.failureReason || 'Payment was declined or timed out.');
                      }
                    } catch (e) {
                      console.error('Error verifying status:', e);
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={13} />
                  <span>I've Entered PIN (Verify)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('IDLE');
                    setPaymentRef(null);
                  }}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#f1f5f9',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Status: SUCCESS */}
          {paymentStatus === 'SUCCESS' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  margin: '0 auto 14px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Payment Received!
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>
                Your account has been instantly upgraded to <strong style={{ color: '#16a34a' }}>{currentSelectedPlan.name}</strong>.
              </p>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                style={{
                  padding: '11px 24px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Status: FAILED */}
          {paymentStatus === 'FAILED' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  margin: '0 auto 14px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                }}
              >
                <XCircle size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Payment Incomplete
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 18px' }}>
                {errorMessage || 'The payment request was cancelled or timed out.'}
              </p>
              <button
                type="button"
                onClick={() => setPaymentStatus('IDLE')}
                style={{
                  padding: '9px 20px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Scoped CSS for Flashcards Grid & Micro-animations */}
      <style jsx>{`
        .flashcard-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 36px;
          align-items: stretch;
        }

        .flashcard {
          position: relative;
          background-color: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 22px 18px 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .flashcard:hover {
          transform: translateY(-4px);
          border-color: #cbd5e1;
          box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.08);
        }

        .flashcard.selected {
          border-color: #16a34a;
          box-shadow: 0 10px 25px -4px rgba(22, 163, 74, 0.2);
          background-color: #ffffff;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        :global(.spin-icon) {
          animation: spin 0.8s linear infinite;
        }

        @media (max-width: 1100px) {
          .flashcard-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 720px) {
          .flashcard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
