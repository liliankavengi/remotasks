'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Layers,
  FileCheck,
  AlertCircle,
  Search,
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalTasks: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  pendingPayouts: number;
  totalRevenueKes: number;
}

interface PendingSubmission {
  id: string;
  submittedAt: string;
  submissionData: Record<string, any>;
  user: {
    id: string;
    name: string;
    email: string;
  };
  task: {
    id: string;
    title: string;
    rewardAmount: number;
    currency: string;
  };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  subscriptions: Array<{
    plan: {
      name: string;
      slug: string;
    };
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'users'>('reviews');

  // Reviewing modal state
  const [reviewingSub, setReviewingSub] = useState<PendingSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setPendingSubmissions(data.pendingSubmissions || []);
        setUsers(data.recentUsers || []);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (submissionId: string, action: 'APPROVE' | 'REJECT') => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to review submission');
      }

      alert(`Submission ${action.toLowerCase()}d successfully!`);
      setReviewingSub(null);
      setRejectionReason('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Error executing review action.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl">
        <div className="skeleton-loader h-10 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-loader h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Admin Command Center
          </h1>
          <p className="text-muted text-sm mt-0.5">
            Platform governance, task auditing, and submission moderation.
          </p>
        </div>
        <div className="badge badge-primary px-3 py-1 text-xs">
          Role: System Administrator
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-center text-amber-400 mb-1">
            <span className="text-xs font-bold uppercase">Pending Audit</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.pendingSubmissions || 0}
          </div>
          <p className="text-[11px] text-muted">Submissions awaiting review</p>
        </div>

        <div className="card p-5 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-center text-emerald-400 mb-1">
            <span className="text-xs font-bold uppercase">Total Revenue</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">
            KES {stats?.totalRevenueKes.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-muted">M-Pesa plan subscription income</p>
        </div>

        <div className="card p-5 border-l-4 border-l-sky-500">
          <div className="flex justify-between items-center text-sky-400 mb-1">
            <span className="text-xs font-bold uppercase">Registered Users</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.totalUsers || 0}</div>
          <p className="text-[11px] text-muted">Active task workforce</p>
        </div>

        <div className="card p-5 border-l-4 border-l-purple-500">
          <div className="flex justify-between items-center text-purple-400 mb-1">
            <span className="text-xs font-bold uppercase">Marketplace Tasks</span>
            <Layers className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.totalTasks || 0}</div>
          <p className="text-[11px] text-muted">Published project slots</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-border text-sm font-semibold gap-6">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'reviews'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-muted hover:text-white'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Submission Review Queue ({pendingSubmissions.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-muted hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          User & Plan Management ({users.length})
        </button>
      </div>

      {/* Tab 1: Submission Review Queue */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {pendingSubmissions.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-white text-base">Audit Queue Clear!</h3>
              <p className="text-xs text-muted">
                There are no pending submissions requiring review at this time.
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 border-b border-border text-muted font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Worker</th>
                      <th className="p-4">Task</th>
                      <th className="p-4">Submitted At</th>
                      <th className="p-4">Reward</th>
                      <th className="p-4 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pendingSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-zinc-900/40">
                        <td className="p-4">
                          <div className="font-bold text-white">{sub.user.name || 'Worker'}</div>
                          <div className="text-[11px] text-muted font-mono">{sub.user.email}</div>
                        </td>
                        <td className="p-4 font-semibold text-white max-w-xs truncate">
                          {sub.task.title}
                        </td>
                        <td className="p-4 text-muted font-mono">
                          {new Date(sub.submittedAt).toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-emerald-400">
                          {sub.task.currency} {sub.task.rewardAmount.toFixed(2)}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setReviewingSub(sub)}
                            className="btn btn-primary py-1 px-3 text-xs"
                          >
                            Inspect & Moderate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Management */}
      {activeTab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 border-b border-border text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Name & Email</th>
                  <th className="p-4">Current Plan</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900/40">
                    <td className="p-4">
                      <div className="font-bold text-white">{u.name || 'User'}</div>
                      <div className="text-[11px] text-muted font-mono">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="badge badge-secondary font-mono text-[10px]">
                        {u.subscriptions[0]?.plan?.name || 'FREE Starter'}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-sky-400 text-[11px]">
                      {u.role}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal Dialog */}
      {reviewingSub && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="card max-w-xl w-full p-6 space-y-4 border-emerald-500/30 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-white text-base">Moderate Submission</h3>
              <button
                onClick={() => setReviewingSub(null)}
                className="text-muted hover:text-white text-sm p-1 rounded transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Worker:</span>
                <span className="font-bold text-white">{reviewingSub.user.name} ({reviewingSub.user.email})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Task Title:</span>
                <span className="font-semibold text-white">{reviewingSub.task.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Payout:</span>
                <span className="font-bold text-emerald-400">${reviewingSub.task.rewardAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Submission Content Viewer */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Submitted Output Data:
              </label>
              <pre className="p-3 bg-zinc-950 rounded-lg text-xs font-mono text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap border border-zinc-800">
                {JSON.stringify(reviewingSub.submissionData, null, 2)}
              </pre>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Rejection Reason (Required if rejecting):
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete survey answers or invalid proof URL."
                className="input w-full text-xs"
              />
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => handleReviewAction(reviewingSub.id, 'REJECT')}
                disabled={isProcessing}
                className="btn btn-secondary bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs py-2 px-4"
              >
                Reject Submission
              </button>
              <button
                onClick={() => handleReviewAction(reviewingSub.id, 'APPROVE')}
                disabled={isProcessing}
                className="btn btn-primary text-xs py-2 px-5 font-bold"
              >
                Approve & Credit Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
