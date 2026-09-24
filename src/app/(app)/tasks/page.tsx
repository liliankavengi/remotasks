'use client';
// src/app/(app)/tasks/page.tsx — Task Marketplace

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { formatCurrency, DIFFICULTY_LABELS, PLAN_DISPLAY } from '@/lib/utils';
import { canAccessTask } from '@/lib/permissions';
import CategoryIcon from '@/components/CategoryIcon';
import { Lock, ArrowRight } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  slug: string;
  description: string;
  reward: number;
  estimatedMinutes: number;
  difficulty: string;
  totalSlots: number;
  filledSlots: number;
  requiredPlan: string;
  status: string;
  tags: string[];
  isDemo: boolean;
  category: { name: string; slug: string; icon: string | null };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  requiredPlan: string;
}

function TaskCard({ task, userPlan }: { task: Task; userPlan: string }) {
  const isLocked = !canAccessTask(userPlan as any, task.requiredPlan as any);
  const slotsLeft = task.totalSlots - task.filledSlots;
  const isFull = slotsLeft <= 0;
  const difficulty = DIFFICULTY_LABELS[task.difficulty] || { label: task.difficulty, badge: 'badge-gray' };
  const planDisplay = PLAN_DISPLAY[task.requiredPlan as keyof typeof PLAN_DISPLAY];

  return (
    <div className="task-card">
      {/* Demo badge */}
      {task.isDemo && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
          <span className="badge badge-yellow">Demo Task</span>
        </div>
      )}

      <div className="task-card-header">
        <span className="category-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <CategoryIcon slug={task.category.slug} size={14} />
          {task.category.name}
        </span>
        <span className={`badge ${difficulty.badge}`}>{difficulty.label}</span>
      </div>

      <div className="task-card-body">
        <h3 className="task-card-title">{task.title}</h3>
        <p className="task-card-desc">{task.description}</p>
      </div>

      <div className="task-card-meta">
        <div className="task-meta-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ~{task.estimatedMinutes} min
        </div>
        <div className="task-meta-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          {slotsLeft > 0 ? `${slotsLeft} slots` : 'Full'}
        </div>
        <div className="task-meta-item">
          <span className="reward">{formatCurrency(task.reward)}</span>
        </div>
        {task.requiredPlan !== 'FREE' && (
          <div className="task-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            {planDisplay?.label || task.requiredPlan}+
          </div>
        )}
      </div>

      <div className="task-card-footer">
        {isLocked ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>
              <Lock size={12} /> Requires {planDisplay?.label || task.requiredPlan}
            </div>
            <Link href="/upgrade" className="btn btn-outline-primary btn-sm">Upgrade</Link>
          </>
        ) : isFull ? (
          <>
            <span className="badge badge-gray">No Slots Available</span>
          </>
        ) : (
          <>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>
              {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left
            </div>
            <Link href={`/tasks/${task.id}/work`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Start Task <ArrowRight size={14} />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function TaskSkeleton() {
  return (
    <div className="task-card" style={{ minHeight: 240 }}>
      <div className="task-card-header">
        <div className="skeleton skeleton-text" style={{ width: 100 }}></div>
        <div className="skeleton skeleton-text" style={{ width: 60 }}></div>
      </div>
      <div className="task-card-body">
        <div className="skeleton skeleton-title" style={{ marginBottom: 8 }}></div>
        <div className="skeleton skeleton-text" style={{ marginBottom: 6 }}></div>
        <div className="skeleton skeleton-text" style={{ width: '70%' }}></div>
      </div>
      <div className="task-card-footer" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div className="skeleton skeleton-text" style={{ width: 80 }}></div>
        <div className="skeleton" style={{ width: 90, height: 32, borderRadius: 'var(--radius-md)' }}></div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const userPlan = user?.plan || 'FREE';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: LIMIT.toString(),
        sortBy,
      });
      if (search) params.set('search', search);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);

      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      setTasks(data.tasks);
      setTotal(data.pagination.total);
    } catch (e: any) {
      setError(e.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, selectedDifficulty, sortBy]);

  useEffect(() => {
    fetch('/api/tasks/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchTasks, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchTasks, search]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Find Tasks</div>
          <div className="page-desc">{total > 0 ? `${total} task${total !== 1 ? 's' : ''} available` : 'Browse the task marketplace'}</div>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4) var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
              <svg className="input-icon-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="search"
                className="input has-left-icon"
                placeholder="Search tasks..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                id="task-search"
              />
            </div>

            {/* Category filter */}
            <select
              className="select"
              style={{ width: 180 }}
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
              id="category-filter"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon || ''} {cat.name}</option>
              ))}
            </select>

            {/* Difficulty filter */}
            <select
              className="select"
              style={{ width: 160 }}
              value={selectedDifficulty}
              onChange={e => { setSelectedDifficulty(e.target.value); setPage(1); }}
              id="difficulty-filter"
            >
              <option value="">All Difficulties</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>

            {/* Sort */}
            <select
              className="select"
              style={{ width: 160 }}
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setPage(1); }}
              id="sort-filter"
            >
              <option value="newest">Newest First</option>
              <option value="reward_high">Highest Reward</option>
              <option value="reward_low">Lowest Reward</option>
              <option value="popular">Most Popular</option>
            </select>

            {(search || selectedCategory || selectedDifficulty) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setSearch(''); setSelectedCategory(''); setSelectedDifficulty(''); setPage(1); }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Plan notice if on free */}
        {userPlan === 'FREE' && (
          <div className="alert alert-info" style={{ marginBottom: 'var(--space-5)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Some tasks require a paid plan. <Link href="/upgrade" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Upgrade to unlock them <ArrowRight size={14} /></Link></span>
          </div>
        )}

        {/* Task Grid */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>
        )}

        {loading ? (
          <div className="tasks-grid">
            {Array.from({ length: 6 }).map((_, i) => <TaskSkeleton key={i} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <div className="empty-state-title">No tasks found</div>
            <div className="empty-state-desc">
              {search || selectedCategory || selectedDifficulty
                ? 'Try adjusting your filters or search term.'
                : 'No tasks are available right now. Check back soon.'}
            </div>
            <button className="btn btn-primary" onClick={fetchTasks}>Refresh Tasks</button>
          </div>
        ) : (
          <>
            <div className="tasks-grid">
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} userPlan={userPlan} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-8)' }}>
                <button
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pg = i + 1;
                  return (
                    <button key={pg} className={`page-btn ${page === pg ? 'active' : ''}`} onClick={() => setPage(pg)}>
                      {pg}
                    </button>
                  );
                })}
                <button
                  className="page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
