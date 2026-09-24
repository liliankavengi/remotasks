'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  HelpCircle,
  DollarSign,
  Users,
  Send,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface QuestionInput {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING' | 'BOOLEAN';
  options: string[];
  isRequired: boolean;
}

export default function CreateSurveyPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardAmount, setRewardAmount] = useState('0.50');
  const [totalSlots, setTotalSlots] = useState('50');
  const [targetAudience, setTargetAudience] = useState('');

  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      id: 'q_1',
      questionText: 'How frequently do you use AI productivity tools?',
      questionType: 'MULTIPLE_CHOICE',
      options: ['Daily', 'Weekly', 'Rarely', 'Never'],
      isRequired: true,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        questionText: '',
        questionType: 'MULTIPLE_CHOICE',
        options: ['Option 1', 'Option 2'],
        isRequired: true,
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert('Survey must contain at least 1 question.');
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof QuestionInput, value: any) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qId: string, optIdx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      })
    );
  };

  const addOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        return { ...q, options: [...q.options, `Option ${q.options.length + 1}`] };
      })
    );
  };

  const removeOption = (qId: string, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (q.options.length <= 2) return q;
        return { ...q, options: q.options.filter((_, i) => i !== optIdx) };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError('Please provide survey title and description.');
      return;
    }

    for (const q of questions) {
      if (!q.questionText.trim()) {
        setError('All questions must have non-empty text.');
        return;
      }
    }

    const numericReward = parseFloat(rewardAmount);
    const numericSlots = parseInt(totalSlots, 10);

    if (isNaN(numericReward) || numericReward < 0.1) {
      setError('Reward per respondent must be at least $0.10.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          rewardAmount: numericReward,
          totalSlots: numericSlots,
          targetAudience: targetAudience.trim() || undefined,
          questions: questions.map((q) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.questionType === 'MULTIPLE_CHOICE' ? q.options : undefined,
            isRequired: q.isRequired,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create survey');
      }

      alert('Survey published successfully to the marketplace!');
      router.push('/tasks');
    } catch (err: any) {
      setError(err.message || 'An error occurred creating survey.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedBudget = (parseFloat(rewardAmount) || 0) * (parseInt(totalSlots, 10) || 0);

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="text-xs text-muted hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="badge badge-primary flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          Survey & Poll Creator
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Survey Basic Details Card */}
        <div className="card p-6 space-y-4">
          <h1 className="text-xl font-black text-white">Create New Survey / Research Task</h1>
          <p className="text-muted text-xs">
            Design targeted questions for our worker community and collect verified responses.
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Survey Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI Workflow & Prompting Preferences Survey 2026"
              className="input w-full text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Short Description & Purpose <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the background and guidelines for respondents..."
              className="input w-full text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Reward per Respondent ($ USD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min="0.10"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  className="input w-full text-xs pl-7 font-mono"
                  required
                />
                <DollarSign className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Total Response Slots
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  value={totalSlots}
                  onChange={(e) => setTotalSlots(e.target.value)}
                  className="input w-full text-xs pl-8 font-mono"
                  required
                />
                <Users className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Est. Total Budget
              </label>
              <div className="input w-full text-xs font-bold text-emerald-400 bg-zinc-950/80 flex items-center">
                ${estimatedBudget.toFixed(2)} USD
              </div>
            </div>
          </div>
        </div>

        {/* Question Builder Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              Survey Questions ({questions.length})
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Question
            </button>
          </div>

          {questions.map((q, idx) => (
            <div key={q.id} className="card p-5 space-y-4 relative border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Question #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeQuestion(q.id)}
                  className="text-zinc-500 hover:text-red-400 text-xs p-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={q.questionText}
                    onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)}
                    placeholder="Enter question text..."
                    className="input w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <select
                    value={q.questionType}
                    onChange={(e) => updateQuestion(q.id, 'questionType', e.target.value)}
                    className="input w-full text-xs"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice (Radio)</option>
                    <option value="TEXT">Short / Long Text Response</option>
                    <option value="RATING">5-Star Rating Scale</option>
                    <option value="BOOLEAN">Yes / No Toggle</option>
                  </select>
                </div>
              </div>

              {/* Multiple Choice Options Builder */}
              {q.questionType === 'MULTIPLE_CHOICE' && (
                <div className="pl-4 border-l-2 border-emerald-500/30 space-y-2">
                  <label className="block text-[11px] font-semibold text-muted">
                    Answer Options:
                  </label>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                        className="input text-xs py-1 px-2.5 flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(q.id, optIdx)}
                        className="text-zinc-600 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(q.id)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold pt-1 block"
                  >
                    + Add Option
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions Footer */}
        <div className="card p-4 flex items-center justify-between">
          <p className="text-xs text-muted">
            Published surveys appear immediately in the worker task feed.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary px-6 text-xs py-2.5 font-bold"
          >
            {isSubmitting ? (
              'Publishing Survey...'
            ) : (
              <span className="flex items-center gap-1.5">
                <Send className="w-4 h-4" />
                Publish Survey to Marketplace
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
