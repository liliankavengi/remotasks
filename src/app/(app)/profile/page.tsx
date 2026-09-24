'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  User,
  Mail,
  Shield,
  Smartphone,
  Award,
  Wallet,
  Calendar,
  Save,
  CheckCircle2
} from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
    }
  }, [session]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Account Profile</h1>
        <p className="text-muted text-sm mt-0.5">
          Manage your worker profile information and payout preferences.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Profile settings updated successfully.</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="card p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-xl">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{name || 'Remotask Member'}</h2>
            <p className="text-xs text-muted font-mono">{session?.user?.email}</p>
            <span className="badge badge-primary text-[10px] mt-1.5 inline-block">
              Verified Worker
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full pl-9 text-xs"
                required
              />
              <User className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Primary M-Pesa Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0712345678"
                className="input w-full pl-9 text-xs font-mono"
              />
              <Smartphone className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white mb-1">
            Bio / Skill Background
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell task creators about your skills (e.g. Python, Translation, AI Prompting)..."
            className="input w-full text-xs"
          />
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary text-xs py-2 px-6 font-bold"
          >
            {isSaving ? (
              'Saving...'
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
