'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Plus,
  Clock,
  DollarSign,
  Users,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface Survey {
  id: string;
  title: string;
  description: string;
  rewardAmount: number;
  totalSlots: number;
  status: string;
  createdAt: string;
  creator: {
    name: string;
  };
  _count: {
    responses: number;
  };
}

export default function SurveysListPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/surveys');
      const data = await res.json();
      if (res.ok) {
        setSurveys(data.surveys || []);
      }
    } catch (err) {
      console.error('Failed to fetch surveys:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-emerald-400" />
            Surveys & Market Polls
          </h1>
          <p className="text-muted text-sm mt-0.5">
            Share your opinions on products and AI workflows to earn fast rewards.
          </p>
        </div>

        <Link
          href="/surveys/create"
          className="btn btn-primary text-xs py-2.5 px-4 inline-flex items-center gap-1.5 self-start sm:self-auto font-bold"
        >
          <Plus className="w-4 h-4" />
          Create Survey Task
        </Link>
      </div>

      {/* Grid of Surveys */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-loader h-48 rounded-xl" />
          ))}
        </div>
      ) : surveys.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <Sparkles className="w-12 h-12 text-muted mx-auto" />
          <h3 className="text-lg font-bold text-white">No Active Surveys</h3>
          <p className="text-muted text-xs max-w-sm mx-auto">
            Be the first to publish a research survey or check back soon for open respondent slots!
          </p>
          <div>
            <Link href="/surveys/create" className="btn btn-primary text-xs">
              Create First Survey
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <div key={survey.id} className="card p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
              <div>
                <div className="flex items-center justify-between text-xs text-muted mb-2">
                  <span className="badge badge-secondary text-[10px]">Survey</span>
                  <span className="font-mono text-[11px]">By {survey.creator.name || 'Admin'}</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{survey.title}</h3>
                <p className="text-xs text-muted leading-relaxed line-clamp-3 mb-4">
                  {survey.description}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-extrabold text-base">
                    ${survey.rewardAmount.toFixed(2)}
                  </span>
                  <span className="text-muted font-mono flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {survey._count.responses} / {survey.totalSlots} responses
                  </span>
                </div>

                <Link
                  href="/tasks"
                  className="btn btn-secondary w-full text-xs py-2 flex items-center justify-center gap-1"
                >
                  Take Survey
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
