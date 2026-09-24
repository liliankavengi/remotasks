'use client';
// src/app/(auth)/login/page.tsx

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleAccountModal from '@/components/GoogleAccountModal';
import { ClipboardList, CreditCard, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error');
    if (authError) {
      if (authError === 'Configuration') {
        setError('Google Sign-In configuration error. Please select your email.');
      } else if (authError === 'AccessDenied') {
        setError('Google Sign-In was cancelled.');
      } else if (authError === 'OAuthCallback' || authError === 'OAuthSignin') {
        setError('Authentication issue. Please select your account directly.');
      } else if (authError === 'OAuthAccountNotLinked') {
        setError('An account with this email already exists. Please log in with your password.');
      } else {
        setError(`Authentication notice: ${authError}`);
      }
    }
  }, []);

  function handleGoogleSignIn() {
    setError('');
    setShowGoogleModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'Account suspended') {
          setError('Your account has been suspended. Please contact support.');
        } else {
          setError('Invalid email or password. Please try again.');
        }
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div>
          <div style={{display:'flex', alignItems:'center', gap:'var(--space-3)', marginBottom:'var(--space-12)'}}>
            <div style={{width:40, height:40, background:'rgba(255,255,255,0.2)', borderRadius:'var(--radius-md)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:'white'}}>R</div>
            <span style={{fontSize:'var(--text-xl)', fontWeight:800, color:'white'}}>Remotask</span>
          </div>
          <h2 style={{color:'white', fontSize:'var(--text-3xl)', fontWeight:800, lineHeight:1.2, marginBottom:'var(--space-4)'}}>
            Start earning from digital tasks today
          </h2>
          <p style={{color:'rgba(255,255,255,0.8)', fontSize:'var(--text-base)', lineHeight:'var(--leading-relaxed)'}}>
            Join thousands of people completing tasks and earning money online with Remotask.
          </p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:'var(--space-4)'}}>
          {[
            { icon: <ClipboardList size={20} color="#60a5fa" />, text: '18+ task categories' },
            { icon: <CreditCard size={20} color="#34d399" />, text: 'M-Pesa payments' },
            { icon: <Clock size={20} color="#fbbf24" />, text: 'Flexible schedule' },
            { icon: <ShieldCheck size={20} color="#a78bfa" />, text: 'Secure platform' },
          ].map(item => (
            <div key={item.text} style={{display:'flex', alignItems:'center', gap:'var(--space-3)', color:'rgba(255,255,255,0.9)'}}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
              <span style={{fontSize:'var(--text-sm)', fontWeight:500}}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div style={{marginBottom:'var(--space-8)'}}>
            <Link href="/" style={{display:'flex', alignItems:'center', gap:'var(--space-2)', color:'var(--color-text-3)', fontSize:'var(--text-sm)', marginBottom:'var(--space-6)'}}>
              <ArrowLeft size={16} /> Back to home
            </Link>
            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-subtitle">Sign in to your Remotask account to continue.</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{marginBottom:'var(--space-4)'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '20px',
              transition: 'background-color 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            color: 'var(--color-text-4)',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
            <span>or sign in with email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <label className="input-label" htmlFor="email">Email address</label>
              <div className="input-group">
                <svg className="input-icon-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input
                  id="email" type="email" className="input has-left-icon"
                  placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  required autoComplete="email"
                />
              </div>
            </div>

            <div className="input-wrapper">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <label className="input-label" htmlFor="password">Password</label>
                <Link href="/forgot-password" style={{fontSize:'var(--text-xs)', color:'var(--color-primary)', fontWeight:600}}>
                  Forgot password?
                </Link>
              </div>
              <div className="input-group">
                <svg className="input-icon-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  id="password" type={showPass ? 'text' : 'password'}
                  className="input has-left-icon has-right-icon"
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password"
                />
                <button
                  type="button" className="input-icon-right"
                  style={{background:'none', border:'none', cursor:'pointer', padding:4}}
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="submit" id="login-btn"
              className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{textAlign:'center', marginTop:'var(--space-6)', fontSize:'var(--text-sm)', color:'var(--color-text-3)'}}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{color:'var(--color-primary)', fontWeight:600}}>Create one free</Link>
          </p>
        </div>
      </div>

      {/* Google Account Selector Modal */}
      <GoogleAccountModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        title="Choose an account to sign in to Remotask"
      />
    </div>
  );
}
