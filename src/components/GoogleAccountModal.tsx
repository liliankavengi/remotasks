'use client';
// src/components/GoogleAccountModal.tsx

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { X, AlertCircle, Plus, ChevronRight, User, Trash2 } from 'lucide-react';

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

interface SavedGoogleAccount {
  email: string;
  name: string;
  avatarColor: string;
  initials: string;
  lastUsed: number;
}

const STORAGE_KEY = 'remotask_saved_google_accounts';

export default function GoogleAccountModal({
  isOpen,
  onClose,
  title = 'Choose your account to continue to Remotask',
}: GoogleAccountModalProps) {
  const router = useRouter();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedGoogleAccount[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');

  // Load user's own saved accounts from localStorage (no hardcoded accounts!)
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SavedGoogleAccount[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedAccounts(parsed);
          setShowCustomInput(false);
          return;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    // If no accounts saved yet on this machine, show input form directly
    setSavedAccounts([]);
    setShowCustomInput(true);
  }, [isOpen]);

  if (!isOpen) return null;

  function getInitials(name: string, email: string): string {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  }

  function getAvatarColor(email: string): string {
    const colors = [
      'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
      'linear-gradient(135deg, #FBBC05 0%, #EA4335 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
      'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
      'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  function saveAccount(email: string, name?: string) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const derivedName = name?.trim() ||
        cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      
      const newAccount: SavedGoogleAccount = {
        email: cleanEmail,
        name: derivedName,
        avatarColor: getAvatarColor(cleanEmail),
        initials: getInitials(derivedName, cleanEmail),
        lastUsed: Date.now(),
      };

      const existing = savedAccounts.filter((a) => a.email !== cleanEmail);
      const updated = [newAccount, ...existing].slice(0, 5);
      setSavedAccounts(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }

  function removeSavedAccount(e: React.MouseEvent, emailToRemove: string) {
    e.stopPropagation();
    try {
      const updated = savedAccounts.filter((a) => a.email !== emailToRemove);
      setSavedAccounts(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (updated.length === 0) {
        setShowCustomInput(true);
      }
    } catch {
      // Ignore
    }
  }

  async function handleAuthenticate(email: string, name?: string) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please provide a valid Google email address.');
      return;
    }

    setError('');
    setLoadingEmail(cleanEmail);

    try {
      const result = await signIn('credentials', {
        email: cleanEmail,
        name: name?.trim() || undefined,
        isGoogleAuth: 'true',
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'Account suspended') {
          setError('This account is suspended. Please contact support.');
        } else {
          setError(result.error || 'Sign-in failed. Please try again.');
        }
        setLoadingEmail(null);
      } else {
        saveAccount(cleanEmail, name);
        const params = new URLSearchParams(window.location.search);
        const destination = params.get('callbackUrl') || '/dashboard';
        window.location.href = destination;
      }
    } catch {
      setError('Connection failed. Please check your internet connection.');
      setLoadingEmail(null);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Please enter your Google email address.');
      return;
    }
    handleAuthenticate(emailInput, nameInput);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loadingEmail) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#181b24',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: '#ffffff',
          fontFamily: 'inherit',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#f3f4f6' }}>Google Sign-In</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={!!loadingEmail}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
            {showCustomInput ? 'Choose your Google Account' : 'Choose an account'}
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
            {title}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          {/* View 1: User's previously used accounts on this device (if any) */}
          {!showCustomInput && savedAccounts.length > 0 ? (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {savedAccounts.map((acc) => {
                  const isLoading = loadingEmail === acc.email;
                  return (
                    <div
                      key={acc.email}
                      onClick={() => handleAuthenticate(acc.email, acc.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        width: '100%',
                        padding: '12px 14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        cursor: loadingEmail ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!loadingEmail) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        if (!loadingEmail) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: acc.avatarColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                          color: '#ffffff',
                          flexShrink: 0,
                        }}
                      >
                        {acc.initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#f3f4f6' }}>{acc.name}</div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {acc.email}
                        </div>
                      </div>
                      {isLoading ? (
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                          }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            title="Remove from saved accounts"
                            onClick={(e) => removeSavedAccount(e, acc.email)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6b7280',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                          <ChevronRight size={18} style={{ color: '#6b7280' }} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Option to enter a different account */}
                <button
                  type="button"
                  disabled={!!loadingEmail}
                  onClick={() => {
                    setError('');
                    setEmailInput('');
                    setNameInput('');
                    setShowCustomInput(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: 'transparent',
                    border: '1px dashed rgba(255, 255, 255, 0.18)',
                    borderRadius: '10px',
                    cursor: loadingEmail ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!loadingEmail) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!loadingEmail) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      flexShrink: 0,
                    }}
                  >
                    <Plus size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#60a5fa' }}>
                      Use another account
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      Sign in with any email address
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* View 2: Direct Account Entry Form — user enters their own account */
            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Google Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. name@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={!!loadingEmail}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'; }}
                />
                <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
                  Enter any Google email address you want to use.
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Your Full Name <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lilian Kavengi"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  disabled={!!loadingEmail}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'; }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {savedAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setShowCustomInput(false);
                    }}
                    disabled={!!loadingEmail}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#e5e7eb',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!!loadingEmail}
                  style={{
                    flex: savedAccounts.length > 0 ? 2 : 1,
                    padding: '12px 14px',
                    backgroundColor: '#1a73e8',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loadingEmail ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {loadingEmail ? (
                    <>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#ffffff',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    'Continue with this account'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Google privacy & sharing notice */}
          <div
            style={{
              marginTop: '18px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '11px',
              color: '#9ca3af',
              lineHeight: 1.5,
              textAlign: 'center',
            }}
          >
            To continue, Google will share your name, email address, and profile picture with Remotask.
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
