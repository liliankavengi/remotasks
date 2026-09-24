'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  DollarSign,
  Clock,
  Send,
  Layers,
  Sparkles,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CreateTaskPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [rewardAmount, setRewardAmount] = useState('1.50');
  const [totalSlots, setTotalSlots] = useState('20');
  const [estimatedMinutes, setEstimatedMinutes] = useState('15');
  const [requiredPlan, setRequiredPlan] = useState('FREE');
  const [difficulty, setDifficulty] = useState('MEDIUM');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/tasks/categories');
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
        if (data.categories?.length > 0) {
          setCategoryId(data.categories[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !categoryId) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          categoryId,
          description: description.trim(),
          instructions: instructions.trim() || undefined,
          rewardAmount: parseFloat(rewardAmount),
          totalSlots: parseInt(totalSlots, 10),
          estimatedMinutes: parseInt(estimatedMinutes, 10),
          requiredPlan,
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish task.');
      }

      alert('Task published successfully!');
      router.push('/tasks');
    } catch (err: any) {
      setError(err.message || 'Error publishing task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="text-xs text-muted hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="badge badge-secondary flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          Task Creator Studio
        </span>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <h1 className="text-xl font-black text-white">Create Microtask Project</h1>
          <p className="text-muted text-xs mt-1">
            Publish AI RLHF evaluation, prompt engineering, data annotation, or text verification tasks.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-white mb-1">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Rate Python Code Quality & Write Unit Test Prompts"
              className="input w-full text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Task Category <span className="text-red-400">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input w-full text-xs"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white mb-1">
            Summary Description <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of what workers will evaluate..."
            className="input w-full text-xs"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white mb-1">
            Detailed Step-by-Step Instructions & Guidelines
          </label>
          <textarea
            rows={5}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Provide specific guidelines, evaluation rubrics, or edge case criteria..."
            className="input w-full text-xs font-mono"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Reward ($ USD)
            </label>
            <input
              type="number"
              step="0.10"
              min="0.10"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              className="input w-full text-xs font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Total Slots
            </label>
            <input
              type="number"
              min="1"
              value={totalSlots}
              onChange={(e) => setTotalSlots(e.target.value)}
              className="input w-full text-xs font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Est. Minutes
            </label>
            <input
              type="number"
              min="1"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className="input w-full text-xs font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Required Plan
            </label>
            <select
              value={requiredPlan}
              onChange={(e) => setRequiredPlan(e.target.value)}
              className="input w-full text-xs"
            >
              <option value="FREE">FREE Starter</option>
              <option value="STARTER">Bronze Starter</option>
              <option value="PRO">Silver Pro</option>
              <option value="VIP">Gold VIP</option>
              <option value="ENTERPRISE">Platinum Enterprise</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary px-6 text-xs py-2.5 font-bold"
          >
            {isSubmitting ? (
              'Publishing Task...'
            ) : (
              <span className="flex items-center gap-1.5">
                <Send className="w-4 h-4" />
                Publish Task to Marketplace
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
