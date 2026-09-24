'use client';
// src/app/(app)/dashboard/page.tsx

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { formatCurrency, formatRelativeTime, SUBMISSION_STATUS_LABELS, DIFFICULTY_LABELS } from '@/lib/utils';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  DollarSign,
  CreditCard,
  Search,
  ArrowUpRight,
  PenTool,
  Coins,
  Wallet,
  ArrowRight,
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalSubmissions: number;
    completedTasks: number;
    pendingTasks: number;
    availableTasks: number;
    totalEarnings: number;
    pendingEarnings: number;
    availableBalance: number;
    todayTasksCompleted: number;
    dailyTaskLimit: number;
    unreadNotifications: number;
  };
  subscription: {
    plan: string;
    planSlug: string;
    status: string;
    endDate: string | null;
    dailyTaskLimit: number;
    monthlyTaskLimit: number;
  } | null;
  recentSubmissions: Array<{
    id: string;
    status: string;
    reward: number | null;
    submittedAt: string;
    task: { title: string; reward: number; category: { name: string; slug: string } };
  }>;
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-change positive">{sub}</div>}
    </div>
  );
}

function SkeletonStats() {
  return (
    <div className="stats-grid">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="stat-card">
          <div className="skeleton skeleton-card" style={{height:44, width:44, borderRadius:'var(--radius-md)', marginBottom:'var(--space-4)'}}></div>
          <div className="skeleton skeleton-text" style={{width:'60%', marginBottom:8}}></div>
          <div className="skeleton skeleton-title" style={{width:'40%'}}></div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Failed to load dashboard. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const plan = user?.planName || 'Free';
  const planSlug = user?.plan || 'FREE';

  const dailyProgress = data ? Math.min((data.stats.todayTasksCompleted / data.stats.dailyTaskLimit) * 100, 100) : 0;

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">{greeting}, {firstName}</div>
          <div className="page-desc">Here's what's happening with your Remotask account.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link href="/tasks" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Search size={16} />
            Find Tasks
          </Link>
          {planSlug === 'FREE' && (
            <Link href="/upgrade" className="btn btn-outline-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpRight size={16} /> Upgrade Plan
            </Link>
          )}
        </div>
      </div>

      <div className="page-body">
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* Plan alert if on free */}
        {planSlug === 'FREE' && !loading && (
          <div className="alert alert-info" style={{ marginBottom: 'var(--space-6)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <strong>You&apos;re on the Free plan.</strong> Upgrade to unlock more task categories, higher daily limits, and better earnings.{' '}
              <Link href="/upgrade" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Upgrade now <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {loading ? <SkeletonStats /> : (
          <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
            <StatCard icon={<ClipboardList size={22} color="#16a34a" />} label="Available Tasks" value={data?.stats.availableTasks.toString() || '0'} color="#F0FDF4" />
            <StatCard icon={<CheckCircle2 size={22} color="#2563eb" />} label="Completed Tasks" value={data?.stats.completedTasks.toString() || '0'} color="#EFF6FF" />
            <StatCard icon={<Clock size={22} color="#d97706" />} label="Pending Review" value={data?.stats.pendingTasks.toString() || '0'} color="#FFFBEB" />
            <StatCard
              icon={<DollarSign size={22} color="#059669" />}
              label="Total Earnings"
              value={formatCurrency(data?.stats.totalEarnings || 0)}
              sub={data?.stats.pendingEarnings ? `KES ${data.stats.pendingEarnings} pending` : undefined}
              color="#F0FDF4"
            />
            <StatCard icon={<CreditCard size={22} color="#7c3aed" />} label="Available Balance" value={formatCurrency(data?.stats.availableBalance || 0)} color="#EDE9FE" />
          </div>
        )}

        <div className="two-col">
          {/* Daily Progress */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Today&apos;s Progress</h3>
              <span className="badge badge-green">{data?.stats.todayTasksCompleted || 0} / {data?.stats.dailyTaskLimit || 5} tasks</span>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${dailyProgress}%` }}></div>
                </div>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', marginBottom: 'var(--space-4)' }}>
                {dailyProgress >= 100
                  ? `You've reached today's limit of ${data?.stats.dailyTaskLimit} tasks.`
                  : `${(data?.stats.dailyTaskLimit || 5) - (data?.stats.todayTasksCompleted || 0)} tasks remaining today`
                }
              </p>
              {dailyProgress >= 100 && (
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Link href="/upgrade" className="btn btn-primary btn-sm">Upgrade for More</Link>
                </div>
              )}
              {dailyProgress < 100 && (
                <Link href="/tasks" className="btn btn-outline-primary btn-sm">
                  Find Tasks to Complete
                </Link>
              )}
            </div>
          </div>

          {/* Account Plan */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Current Plan</h3>
              <span className={`badge ${planSlug === 'FREE' ? 'badge-gray' : planSlug === 'STARTER' ? 'badge-blue' : planSlug === 'PRO' ? 'badge-green' : 'badge-purple'}`}>
                {plan}
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--color-text-3)' }}>Daily task limit</span>
                  <span style={{ fontWeight: 600 }}>{data?.subscription?.dailyTaskLimit || 5}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--color-text-3)' }}>Monthly task limit</span>
                  <span style={{ fontWeight: 600 }}>{data?.subscription?.monthlyTaskLimit || 50}</span>
                </div>
                {data?.subscription?.endDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--color-text-3)' }}>Renews</span>
                    <span style={{ fontWeight: 600 }}>{new Date(data.subscription.endDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
              {planSlug !== 'ENTERPRISE' && (
                <Link href="/upgrade" className="btn btn-primary btn-sm btn-full" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <ArrowUpRight size={16} /> Upgrade Plan
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginTop: 'var(--space-6)' }}>
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Link href="/tasks" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Search size={16} /> Find Tasks</Link>
              <Link href="/upgrade" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><ArrowUpRight size={16} /> Upgrade Plan</Link>
              <Link href="/surveys/create" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><PenTool size={16} /> Create Survey</Link>
              <Link href="/earnings" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Coins size={16} /> View Earnings</Link>
              <Link href="/payouts" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Wallet size={16} /> Request Payout</Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ marginTop: 'var(--space-6)' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Submissions</h3>
            <Link href="/task-history" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="card-body">
              {[1,2,3].map(i => (
                <div key={i} style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-divider)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                  <div className="skeleton skeleton-text" style={{ flex: 1 }}></div>
                  <div className="skeleton skeleton-text" style={{ width: 80 }}></div>
                </div>
              ))}
            </div>
          ) : data?.recentSubmissions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              </div>
              <div className="empty-state-title">No submissions yet</div>
              <div className="empty-state-desc">Complete your first task to see your submission history here.</div>
              <Link href="/tasks" className="btn btn-primary">Find Tasks</Link>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Category</th>
                    <th>Reward</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentSubmissions.map(sub => {
                    const statusInfo = SUBMISSION_STATUS_LABELS[sub.status] || { label: sub.status, badge: 'badge-gray' };
                    return (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 600, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sub.task.title}
                        </td>
                        <td><span className="category-chip">{sub.task.category.name}</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(sub.task.reward)}</td>
                        <td><span className={`badge ${statusInfo.badge}`}>{statusInfo.label}</span></td>
                        <td style={{ color: 'var(--color-text-3)' }}>{formatRelativeTime(sub.submittedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
