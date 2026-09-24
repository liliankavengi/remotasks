'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Lock,
  Send,
  HelpCircle,
  ShieldCheck,
  FileText,
  Sparkles,
  Info,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

interface Question {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING' | 'FILE_UPLOAD' | 'BOOLEAN';
  options: string[] | null;
  isRequired: boolean;
  stepOrder: number;
}

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  rewardAmount: number;
  currency: string;
  difficulty: string;
  estimatedMinutes: number;
  requiredPlan: string;
  status: string;
  isDemo: boolean;
  category: {
    name: string;
    slug: string;
  };
  questions: Question[];
}

interface Submission {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  rewardEarned: number;
  rejectionReason?: string;
  submissionData: Record<string, any>;
}

export default function TaskWorkPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [generalResponse, setGeneralResponse] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  useEffect(() => {
    if (task && task.estimatedMinutes) {
      setTimeRemaining(task.estimatedMinutes * 60);
    }
  }, [task]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || submitSuccess || submission) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, submitSuccess, submission]);

  const fetchTask = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load task details');
      }
      setTask(data.task);
      setSubmission(data.userSubmission);

      // Initialize default answers if questions exist
      if (data.task?.questions && data.task.questions.length > 0) {
        const initAnswers: Record<string, any> = {};
        data.task.questions.forEach((q: Question) => {
          initAnswers[q.id] = '';
        });
        setAnswers(initAnswers);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong loading this task');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    // Validate required questions
    if (task.questions && task.questions.length > 0) {
      for (const q of task.questions) {
        if (q.isRequired && (!answers[q.id] || answers[q.id].toString().trim() === '')) {
          alert(`Please answer the required question: "${q.questionText}"`);
          return;
        }
      }
    } else if (!generalResponse.trim() && !proofUrl.trim()) {
      alert('Please fill in your response or submit proof before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const submissionPayload = {
      taskId: task.id,
      submissionData: {
        answers,
        generalResponse: generalResponse.trim() || undefined,
        proofUrl: proofUrl.trim() || undefined,
        completedTimeSeconds: task.estimatedMinutes ? task.estimatedMinutes * 60 - (timeRemaining || 0) : undefined,
      },
    };

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresUpgrade) {
          if (confirm(`${data.error}\n\nWould you like to upgrade your plan now?`)) {
            router.push('/upgrade');
          }
          return;
        }
        throw new Error(data.error || 'Failed to submit task');
      }

      setSubmitSuccess(true);
      setSubmission(data.submission);
    } catch (err: any) {
      setError(err.message || 'Error submitting task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl">
        <div className="skeleton-loader h-8 w-48 mb-6" />
        <div className="card p-6 space-y-4">
          <div className="skeleton-loader h-10 w-3/4 mb-2" />
          <div className="skeleton-loader h-4 w-1/2 mb-6" />
          <div className="skeleton-loader h-40 w-full mb-4" />
          <div className="skeleton-loader h-12 w-32" />
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container py-12 max-w-2xl">
        <div className="card p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">Unable to Load Task</h2>
          <p className="text-muted text-sm">{error || 'Task not found or access denied.'}</p>
          <div className="pt-4">
            <Link href="/tasks" className="btn btn-secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl">
      {/* Header Breadcrumbs */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/tasks" className="text-muted hover:text-white text-sm flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Link>
        <span className="badge badge-secondary flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          {task.category.name}
        </span>
      </div>

      {/* Main Task Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main Workspace (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Header Card */}
          <div className="card p-6 relative overflow-hidden">
            {task.isDemo && (
              <div className="absolute top-3 right-3 bg-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Demo Task
              </div>
            )}
            <h1 className="text-2xl font-extrabold text-white mb-2">{task.title}</h1>
            <p className="text-muted text-sm leading-relaxed mb-4">{task.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <DollarSign className="w-4 h-4" />
                <span>Earn {task.currency} {task.rewardAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Est. {task.estimatedMinutes} mins</span>
              </div>
              <div className="badge badge-outline text-xs">
                Plan: {task.requiredPlan}
              </div>
            </div>
          </div>

          {/* Submission Status Banner if user already submitted */}
          {submission && !submitSuccess && (
            <div className={`card p-5 border-l-4 ${
              submission.status === 'APPROVED' ? 'border-l-emerald-500 bg-emerald-500/10' :
              submission.status === 'REJECTED' ? 'border-l-red-500 bg-red-500/10' :
              'border-l-amber-500 bg-amber-500/10'
            }`}>
              <div className="flex items-start gap-3">
                {submission.status === 'APPROVED' && <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />}
                {submission.status === 'REJECTED' && <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />}
                {submission.status === 'PENDING' && <Clock className="w-6 h-6 text-amber-400 shrink-0" />}
                <div>
                  <h3 className="font-bold text-white text-base">
                    {submission.status === 'APPROVED' ? 'Task Submission Approved!' :
                     submission.status === 'REJECTED' ? 'Task Submission Rejected' :
                     'Submission Under Review'}
                  </h3>
                  <p className="text-xs text-muted mt-1">
                    Submitted on {new Date(submission.submittedAt).toLocaleString()}
                  </p>
                  {submission.status === 'APPROVED' && (
                    <p className="text-sm text-emerald-400 font-semibold mt-2">
                      + {task.currency} {submission.rewardEarned.toFixed(2)} credited to your wallet balance.
                    </p>
                  )}
                  {submission.rejectionReason && (
                    <p className="text-xs text-red-300 mt-2 bg-red-950/50 p-2.5 rounded border border-red-500/20">
                      Reason: {submission.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success Overlay after fresh submit */}
          {submitSuccess && (
            <div className="card p-8 text-center bg-gradient-to-b from-emerald-950/40 to-card border border-emerald-500/30 animate-in fade-in space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Work Submitted Successfully!</h2>
              <p className="text-muted text-sm max-w-md mx-auto">
                Your response has been recorded. Our automated review system or admin team will verify your submission shortly.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <Link href="/tasks" className="btn btn-primary">
                  Explore More Tasks
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
                <Link href="/dashboard" className="btn btn-secondary">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}

          {/* Task Work Form (Only show if not submitted or resubmitting) */}
          {!submission && !submitSuccess && (
            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Task Workplace & Form
                </h2>
                {timeRemaining !== null && (
                  <div className="text-xs font-mono bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800 text-sky-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Time left: {formatTimer(timeRemaining)}
                  </div>
                )}
              </div>

              {/* Render Structured Questions if available */}
              {task.questions && task.questions.length > 0 ? (
                <div className="space-y-6">
                  {task.questions.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                      <label className="block text-sm font-semibold text-white">
                        <span className="text-emerald-400 font-mono mr-1">{idx + 1}.</span>
                        {q.questionText}
                        {q.isRequired && <span className="text-red-400 ml-1">*</span>}
                      </label>

                      {/* Question Inputs */}
                      {q.questionType === 'MULTIPLE_CHOICE' && q.options && (
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                answers[q.id] === opt
                                  ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                                  : 'bg-zinc-950/50 border-zinc-800 text-muted hover:border-zinc-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                value={opt}
                                checked={answers[q.id] === opt}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                className="accent-emerald-500"
                              />
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {q.questionType === 'TEXT' && (
                        <textarea
                          rows={3}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          placeholder="Type your detailed response here..."
                          className="input w-full"
                          required={q.isRequired}
                        />
                      )}

                      {q.questionType === 'RATING' && (
                        <div className="flex items-center gap-2 pt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => handleAnswerChange(q.id, star)}
                              className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                                answers[q.id] === star
                                  ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20 scale-105'
                                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                              }`}
                            >
                              {star}
                            </button>
                          ))}
                          <span className="text-xs text-muted ml-2">
                            {answers[q.id] ? `${answers[q.id]} out of 5 stars` : 'Select rating'}
                          </span>
                        </div>
                      )}

                      {q.questionType === 'BOOLEAN' && (
                        <div className="flex items-center gap-4">
                          {['Yes', 'No'].map((val) => (
                            <button
                              type="button"
                              key={val}
                              onClick={() => handleAnswerChange(q.id, val)}
                              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                                answers[q.id] === val
                                  ? 'bg-emerald-500 text-zinc-950 font-bold'
                                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback General Work Input (Prompt engineering, data annotation, screenshot proof) */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-1.5">
                      Your Response / Completed Output <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={6}
                      value={generalResponse}
                      onChange={(e) => setGeneralResponse(e.target.value)}
                      placeholder="Enter the completed task output, generated prompt response, or evaluation notes..."
                      className="input w-full font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-1.5">
                      Proof URL / File Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or screenshot link"
                      className="input w-full"
                    />
                    <p className="text-xs text-muted mt-1">
                      If the task required external work (Google Docs, Figma, social post), paste the shared link here.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Your work is saved automatically upon submission.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary px-6"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      Submitting Work...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Submit Work & Claim Reward
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Sidebar — Instructions & Requirements (1 col) */}
        <div className="space-y-6">
          {/* Instructions Box */}
          <div className="card p-5 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              Task Instructions
            </h3>
            <div className="text-xs text-muted leading-relaxed space-y-2">
              {task.instructions ? (
                <div className="prose prose-invert text-xs whitespace-pre-line">
                  {task.instructions}
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-1.5">
                  <li>Read all questions and guidelines carefully before answering.</li>
                  <li>Ensure all submitted text is original and free of AI spam.</li>
                  <li>Incomplete submissions will be rejected during audit.</li>
                  <li>Rewards are credited upon verification by reviewers.</li>
                </ul>
              )}
            </div>
          </div>

          {/* Reward Summary */}
          <div className="card p-5 bg-gradient-to-br from-emerald-950/20 to-card border-emerald-500/20 space-y-3">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Payout Guarantee
            </div>
            <div className="text-2xl font-black text-white">
              {task.currency} {task.rewardAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted">
              Funds are held in escrow for this task and automatically released once approved.
            </p>
          </div>

          {/* Support / Guidelines */}
          <div className="text-xs text-muted space-y-2 px-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>24/7 Submission verification</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Instant retries if rejected with feedback</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
