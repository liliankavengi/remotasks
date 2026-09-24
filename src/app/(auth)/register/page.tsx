'use client';
// src/app/(auth)/register/page.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import GoogleAccountModal from '@/components/GoogleAccountModal';
import { CheckCircle2, Smartphone, DollarSign, Globe, ArrowLeft } from 'lucide-react';

const COUNTRIES = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia', 'Nigeria', 'Ghana', 'South Africa', 'United Kingdom', 'United States', 'Canada', 'Australia', 'Other'];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', country: 'Kenya', referralCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error');
    if (authError) {
      if (authError === 'Configuration') {
        setError('Google Sign-Up configuration error. Please choose your email directly.');
      } else if (authError === 'AccessDenied') {
        setError('Google Sign-Up was cancelled.');
      } else if (authError === 'OAuthCallback' || authError === 'OAuthSignin') {
        setError('Authentication issue. Please choose your email directly.');
      } else if (authError === 'OAuthAccountNotLinked') {
        setError('An account with this email already exists. Please log in with your password.');
      } else {
        setError(`Authentication notice: ${authError}`);
      }
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  function handleGoogleSignIn() {
    setError('');
    setShowGoogleModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          country: form.country,
          referralCode: form.referralCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/dashboard');
      } else {
        router.push('/login?registered=1');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 8 ? 1 : form.password.length < 12 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][pwStrength];
  const strengthColor = ['', 'var(--color-error)', 'var(--color-warning)', 'var(--color-primary)'][pwStrength];

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div>
          <div style={{display:'flex', alignItems:'center', gap:'var(--space-3)', marginBottom:'var(--space-12)'}}>
            <div style={{width:40, height:40, background:'rgba(255,255,255,0.2)', borderRadius:'var(--radius-md)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:'white'}}>R</div>
            <span style={{fontSize:'var(--text-xl)', fontWeight:800, color:'white'}}>Remotask</span>
          </div>
          <h2 style={{color:'white', fontSize:'var(--text-2xl)', fontWeight:800, lineHeight:1.25, marginBottom:'var(--space-4)'}}>
            Join Remotask and start earning today
          </h2>
          <p style={{color:'rgba(255,255,255,0.8)', fontSize:'var(--text-sm)', lineHeight:'var(--leading-relaxed)'}}>
            Create your free account and access hundreds of digital tasks. No experience required.
          </p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:'var(--space-3)'}}>
          {[
            { icon: <CheckCircle2 size={18} color="#34d399" />, text: 'Free to join — no credit card' },
            { icon: <Smartphone size={18} color="#60a5fa" />, text: 'Works on any device' },
            { icon: <DollarSign size={18} color="#fbbf24" />, text: 'Paid via M-Pesa' },
            { icon: <Globe size={18} color="#a78bfa" />, text: 'Available worldwide' },
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
          <div style={{marginBottom:'var(--space-6)'}}>
            <Link href="/" style={{display:'flex', alignItems:'center', gap:'var(--space-2)', color:'var(--color-text-3)', fontSize:'var(--text-sm)', marginBottom:'var(--space-5)'}}>
              <ArrowLeft size={16} /> Back to home
            </Link>
            <h1 className="auth-form-title">Create your account</h1>
            <p className="auth-form-subtitle">Free to join. Start completing tasks immediately.</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{marginBottom:'var(--space-4)'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Google Sign-Up Button */}
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
            <span>or sign up with email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <label className="input-label" htmlFor="name">Full Name <span className="required">*</span></label>
              <input
                id="name" name="name" type="text" className="input"
                placeholder="John Kamau" value={form.name}
                onChange={handleChange} required minLength={2}
              />
            </div>

            <div className="input-wrapper">
              <label className="input-label" htmlFor="email">Email Address <span className="required">*</span></label>
              <div className="input-group">
                <svg className="input-icon-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input
                  id="email" name="email" type="email" className="input has-left-icon"
                  placeholder="you@example.com" value={form.email}
                  onChange={handleChange} required
                />
              </div>
            </div>

            <div className="input-wrapper">
              <label className="input-label" htmlFor="phone">Phone Number <span style={{color:'var(--color-text-4)', fontSize:'var(--text-xs)'}}>(Optional)</span></label>
              <div className="input-group">
                <svg className="input-icon-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.7L6.5 2a1 1 0 0 1 1 .75l.72 3.5a1 1 0 0 1-.3 1L6.5 9a16 16 0 0 0 6.1 6.1l1.5-1.5a1 1 0 0 1 1-.3l3.5.72A1 1 0 0 1 19.5 15l-.5 1.92z"/></svg>
                <input
                  id="phone" name="phone" type="tel" className="input has-left-icon"
                  placeholder="0712 345 678" value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <span className="input-hint">For M-Pesa payouts. Format: 07XXXXXXXX or +254XXXXXXXXX</span>
            </div>

            <div className="two-col" style={{gap:'var(--space-4)'}}>
              <div className="input-wrapper">
                <label className="input-label" htmlFor="country">Country</label>
                <select id="country" name="country" className="select" value={form.country} onChange={handleChange}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-wrapper">
                <label className="input-label" htmlFor="referralCode">Referral Code <span style={{color:'var(--color-text-4)', fontSize:'var(--text-xs)'}}>(Optional)</span></label>
                <input
                  id="referralCode" name="referralCode" type="text" className="input"
                  placeholder="Enter code" value={form.referralCode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-wrapper">
              <label className="input-label" htmlFor="password">Password <span className="required">*</span></label>
              <div className="input-group">
                <svg className="input-icon-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  id="password" name="password" type={showPass ? 'text' : 'password'}
                  className="input has-left-icon has-right-icon"
                  placeholder="Min. 8 characters" value={form.password}
                  onChange={handleChange} required minLength={8}
                />
                <button type="button" className="input-icon-right" style={{background:'none', border:'none', cursor:'pointer', padding:4}} onClick={() => setShowPass(!showPass)}>
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {form.password.length > 0 && (
                <div style={{display:'flex', alignItems:'center', gap:'var(--space-2)', marginTop:4}}>
                  <div style={{display:'flex', gap:3, flex:1}}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{height:3, flex:1, borderRadius:99, background: i <= pwStrength ? strengthColor : 'var(--color-border)', transition:'background 0.2s'}}></div>
                    ))}
                  </div>
                  <span style={{fontSize:'var(--text-xs)', color: strengthColor, fontWeight:600}}>{strengthLabel}</span>
                </div>
              )}
            </div>

            <div className="input-wrapper">
              <label className="input-label" htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
              <input
                id="confirmPassword" name="confirmPassword" type={showPass ? 'text' : 'password'}
                className={`input ${form.confirmPassword && form.confirmPassword !== form.password ? 'error' : ''}`}
                placeholder="Repeat your password" value={form.confirmPassword}
                onChange={handleChange} required
              />
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <span className="input-error">Passwords do not match</span>
              )}
            </div>

            <button
              type="submit" id="register-btn"
              className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>

            <p style={{fontSize:'var(--text-xs)', color:'var(--color-text-3)', textAlign:'center', lineHeight:'var(--leading-relaxed)'}}>
              By creating an account, you agree to our{' '}
              <Link href="/terms" style={{color:'var(--color-primary)'}}>Terms of Service</Link>{' '}and{' '}
              <Link href="/privacy" style={{color:'var(--color-primary)'}}>Privacy Policy</Link>.
            </p>
          </form>

          <p style={{textAlign:'center', marginTop:'var(--space-6)', fontSize:'var(--text-sm)', color:'var(--color-text-3)'}}>
            Already have an account?{' '}
            <Link href="/login" style={{color:'var(--color-primary)', fontWeight:600}}>Sign in</Link>
          </p>
        </div>
      </div>

      {/* Google Account Selector Modal */}
      <GoogleAccountModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        title="Choose an account to register on Remotask"
      />
    </div>
  );
}
