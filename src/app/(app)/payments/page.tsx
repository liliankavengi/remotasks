'use client';
// src/app/(app)/payments/page.tsx — User Payments & Billing History

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  providerTransactionId: string | null;
  createdAt: string;
  verifiedAt: string | null;
  planName: string;
  planSlug: string;
}

interface SubscriptionInfo {
  planName: string;
  planSlug: string;
  status: string;
  startDate: string;
  endDate: string | null;
  dailyTaskLimit: number;
  monthlyTaskLimit: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
        setSubscription(data.subscription || null);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#dcfce7',
              color: '#15803d',
            }}
          >
            <CheckCircle2 size={12} />
            <span>Completed</span>
          </span>
        );
      case 'PENDING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#fef3c7',
              color: '#b45309',
            }}
          >
            <Clock size={12} />
            <span>Pending</span>
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
            }}
          >
            <XCircle size={12} />
            <span>Failed</span>
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Payments & Billing
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Manage your membership tier, view M-Pesa STK push receipts, and check transaction history.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchPayments}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
          <Link
            href="/upgrade"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
            }}
          >
            <Sparkles size={14} />
            <span>Upgrade Plan</span>
          </Link>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px', marginBottom: '32px' }}>
        {/* Active Membership Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Active Subscription</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: '#dcfce7',
                color: '#15803d',
                padding: '3px 8px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
              }}
            >
              {subscription?.status || 'Active'}
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            {subscription?.planName || 'Free Starter'}
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
            Daily Task Limit: <strong style={{ color: '#0f172a' }}>{subscription?.dailyTaskLimit || 5} tasks</strong> • Monthly Limit:{' '}
            <strong style={{ color: '#0f172a' }}>{subscription?.monthlyTaskLimit || 50} tasks</strong>
          </p>
          <Link
            href="/upgrade"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#16a34a',
              textDecoration: 'none',
            }}
          >
            <span>Change or Upgrade Tier</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Payment Method Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Smartphone size={20} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>M-Pesa STK Push</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Instant Mobile Phone Billing</div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 14px' }}>
            All payments are processed securely via live M-Pesa STK Push prompt directly to your phone. Subscriptions activate immediately upon PIN confirmation.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
            <ShieldCheck size={14} />
            <span>Secured by PayHero Gateway</span>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 3px' }}>
              Transaction History
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Recent M-Pesa payments and confirmation status
            </p>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
            {payments.length} {payments.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 10px' }} />
            <div>Loading payment history...</div>
          </div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '50px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#f1f5f9',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <CreditCard size={24} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
              No payments yet
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '380px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              You are currently on the Free Starter plan. Upgrade your membership to unlock high-paying tasks and expanded daily limits.
            </p>
            <Link
              href="/upgrade"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>View Membership Plans</span>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Reference</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Plan</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Amount</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Phone</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const dateStr = new Date(p.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>
                        {p.reference}
                        {p.providerTransactionId && (
                          <div style={{ fontSize: '11px', color: '#16a34a', fontFamily: 'monospace', marginTop: '2px' }}>
                            M-Pesa: {p.providerTransactionId}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#0f172a', fontWeight: 600 }}>
                        {p.planName}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#0f172a', fontWeight: 700 }}>
                        KES {p.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#64748b', fontFamily: 'monospace' }}>
                        {p.phoneNumber}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {getStatusBadge(p.status)}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '12px' }}>
                        {dateStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        :global(.spin-icon) {
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}
