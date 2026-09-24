'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  AlertCircle
} from 'lucide-react';

interface Submission {
  id: string;
  taskId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rewardEarned: number;
  submittedAt: string;
  rejectionReason?: string;
  task: {
    id: string;
    title: string;
    currency: string;
    category: {
      name: string;
    };
  };
}

export default function TaskHistoryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/submissions');
      const data = await res.json();
      if (res.ok) {
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = submissions.filter((sub) => {
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    const matchesSearch = sub.task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.task.category.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalApprovedRewards = submissions
    .filter((s) => s.status === 'APPROVED')
    .reduce((acc, curr) => acc + curr.rewardEarned, 0);

  return (
    <div className="container py-8 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Task History & Submissions</h1>
          <p className="text-muted text-sm mt-1">
            Track all your completed microtasks, pending audits, and earned rewards.
          </p>
        </div>

        {/* Stats Summary Pill */}
        <div className="flex items-center gap-4 bg-zinc-900/80 p-3 rounded-xl border border-border">
          <div className="text-xs">
            <span className="text-muted block">Approved Pay:</span>
            <span className="font-extrabold text-emerald-400 text-sm">
              ${totalApprovedRewards.toFixed(2)}
            </span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-xs">
            <span className="text-muted block">Total Tasks:</span>
            <span className="font-extrabold text-white text-sm">{submissions.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search submitted tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted shrink-0" />
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-border text-xs w-full sm:w-auto">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'text-muted hover:text-white'
                }`}
              >
                {st.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submissions List / Table */}
      {loading ? (
        <div className="card p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-loader h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted mx-auto" />
          <h3 className="text-lg font-bold text-white">No Submissions Found</h3>
          <p className="text-muted text-xs max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No task submissions match your current filter settings.'
              : 'You haven\'t completed any tasks yet. Head over to the marketplace to get started!'}
          </p>
          <div className="pt-2">
            <Link href="/tasks" className="btn btn-primary">
              Browse Tasks Marketplace
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 border-b border-border text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Task</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Reward</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{sub.task.title}</div>
                      {sub.rejectionReason && (
                        <div className="text-[11px] text-red-400 mt-1">
                          Reason: {sub.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-muted">{sub.task.category.name}</td>
                    <td className="p-4 text-muted font-mono">
                      {new Date(sub.submittedAt).toLocaleDateString()}{' '}
                      <span className="text-[10px] text-zinc-500">
                        {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          sub.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : sub.status === 'REJECTED'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {sub.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                        {sub.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                        {sub.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-white">
                      {sub.task.currency} {sub.rewardEarned.toFixed(2)}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/tasks/${sub.taskId}/work`}
                        className="btn btn-secondary py-1 px-2.5 text-[11px] inline-flex items-center gap-1"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
