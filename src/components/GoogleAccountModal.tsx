'use client';
// src/components/GoogleAccountModal.tsx

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { X, AlertCircle, Plus, ChevronRight } from 'lucide-react';

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function GoogleAccountModal({
  isOpen,
  onClose,
  title = 'Choose an account to continue to Remotask',
}: GoogleAccountModalProps) {
  const router = useRouter();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSelectAccount(email: string, name?: string) {
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    setError('');
    setLoadingEmail(email);

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
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
        onClose();
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Connection failed. Please try again.');
      setLoadingEmail(null);
    }
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customEmail) {
      setError('Please enter your email.');
      return;
    }
    handleSelectAccount(customEmail, customName);
  }

  const presetAccounts = [
    {
      name: 'Lilian Kavengi',
      email: 'kavengililian14@gmail.com',
      avatarColor: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
      initials: 'LK',
    },
    {
      name: 'Remotask Contributor',
      email: 'worker@remotask.co.ke',
      avatarColor: 'linear-gradient(135deg, #FBBC05 0%, #EA4335 100%)',
      initials: 'RC',
    },
  ];

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
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
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#f3f4f6' }}>Sign in with Google</span>
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
                fontSize: '18px',
                lineHeight: 1,
              }}
            >
              <X size={18} />
            </button>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
            Choose an account
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
        <div style={{ padding: '16px 24px 20px' }}>
          {!showCustomInput ? (
            <div>
              {/* Account list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {presetAccounts.map((acc) => {
                  const isLoading = loadingEmail === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={!!loadingEmail}
                      onClick={() => handleSelectAccount(acc.email, acc.name)}
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
                        <ChevronRight size={18} style={{ color: '#6b7280' }} />
                      )}
                    </button>
                  );
                })}

                {/* Use another account option */}
                <button
                  type="button"
                  disabled={!!loadingEmail}
                  onClick={() => setShowCustomInput(true)}
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
                      Use another Google account
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      Enter any email address to sign in instantly
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  disabled={!!loadingEmail}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  disabled={!!loadingEmail}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  disabled={!!loadingEmail}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
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
                <button
                  type="submit"
                  disabled={!!loadingEmail}
                  style={{
                    flex: 2,
                    padding: '10px 14px',
                    backgroundColor: '#2563eb',
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

          {/* Footer notice */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '11px',
              color: '#6b7280',
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
