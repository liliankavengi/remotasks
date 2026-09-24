// src/app/page.tsx — Landing Page
import Link from 'next/link';
import CategoryIcon from '@/components/CategoryIcon';
import {
  Globe,
  Layers,
  CheckSquare,
  Smartphone,
  CreditCard,
  ShieldCheck,
  Check,
  ArrowRight,
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Surveys',              plan: 'Free',    count: 0, slug: 'surveys',             color: '#F0FDF4' },
  { name: 'Prompt Engineering',   plan: 'Pro',     count: 0, slug: 'prompt-engineering',  color: '#F5F3FF' },
  { name: 'AI Evaluation',        plan: 'Pro',     count: 0, slug: 'ai-evaluation',       color: '#EEF2FF' },
  { name: 'Data Annotation',      plan: 'Starter', count: 0, slug: 'data-annotation',     color: '#FFFBEB' },
  { name: 'Image Classification', plan: 'Free',    count: 0, slug: 'image-classification', color: '#FDF2F8' },
  { name: 'Text Classification',  plan: 'Free',    count: 0, slug: 'text-classification', color: '#ECFEFF' },
  { name: 'Web Research',         plan: 'Free',    count: 0, slug: 'web-research',        color: '#EFF6FF' },
  { name: 'Transcription',        plan: 'Starter', count: 0, slug: 'transcription',       color: '#F0FDFA' },
  { name: 'Content Writing',      plan: 'Pro',     count: 0, slug: 'content-writing',     color: '#EEF2FF' },
  { name: 'Translation',          plan: 'Starter', count: 0, slug: 'translation',         color: '#E0F2FE' },
  { name: 'Website Testing',      plan: 'Pro',     count: 0, slug: 'website-testing',     color: '#FFF7ED' },
  { name: 'AI Training',          plan: 'Pro',     count: 0, slug: 'ai-training',         color: '#F5F3FF' },
];

const STEPS = [
  { n: '1', title: 'Create Your Account', desc: 'Sign up in under 2 minutes. No credit card required to get started.' },
  { n: '2', title: 'Choose Your Plan',    desc: 'Start free or upgrade to unlock more task categories and higher earnings.' },
  { n: '3', title: 'Complete Tasks',      desc: 'Browse available tasks, complete them at your own pace from anywhere.' },
  { n: '4', title: 'Submit & Earn',       desc: 'Submit your work and receive payment to your M-Pesa after review.' },
];

const WHY_ITEMS = [
  { icon: <Globe size={28} color="#2563eb" />, title: 'Work From Anywhere',      desc: 'Complete tasks from your phone or computer. No commute required.' },
  { icon: <Layers size={28} color="#7c3aed" />, title: 'Multiple Task Categories', desc: '18+ task types across AI, surveys, research, writing, and more.' },
  { icon: <CheckSquare size={28} color="#059669" />, title: 'Clear Requirements', desc: 'Every task has transparent instructions, time estimates, and rewards.' },
  { icon: <Smartphone size={28} color="#ea580c" />, title: 'Mobile-Friendly',     desc: 'Optimized for Android and iPhone. Complete tasks anywhere.' },
  { icon: <CreditCard size={28} color="#0284c7" />, title: 'M-Pesa Payments',    desc: 'Get paid directly to your M-Pesa account. Fast and reliable.' },
  { icon: <ShieldCheck size={28} color="#16a34a" />, title: 'Secure Platform',    desc: 'Your data and earnings are protected with industry-standard security.' },
];

const FAQS = [
  { q: 'How do I get started?',             a: 'Create a free account, browse available tasks, and start completing them immediately. No payment required to join.' },
  { q: 'How much can I earn?',              a: 'Earnings vary by task type and complexity. Tasks typically range from KES 30 to KES 500+. Your total depends on how many tasks you complete.' },
  { q: 'How do I receive payment?',         a: 'Payments are sent via M-Pesa to the phone number on your account. You can request a payout once you reach the minimum threshold.' },
  { q: 'What is the minimum payout?',       a: 'The minimum payout amount is KES 500. Once your available balance reaches this amount, you can request a withdrawal.' },
  { q: 'Why do some tasks require a paid plan?', a: 'Certain task categories require more skill and deliver higher rewards. Premium plans unlock access to these categories and increase your daily task limits.' },
  { q: 'How long does task review take?',   a: 'Most submissions are reviewed within 24-48 hours. Once approved, your earnings become available for withdrawal immediately.' },
  { q: 'Can I create my own tasks?',        a: 'Yes! Pro and Business plan users can create tasks and surveys. Admins review and publish them to the marketplace.' },
  { q: 'Is Remotask available outside Kenya?', a: 'Remotask is available globally. However, M-Pesa payments currently serve Kenyan phone numbers. International payment options are coming soon.' },
];

export default function LandingPage() {
  return (
    <>
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <div className="sidebar-logo-mark">R</div>
          <span className="sidebar-logo-text">Remotask</span>
        </div>
        <div className="landing-nav-links">
          <a href="#categories" className="landing-nav-link">Tasks</a>
          <a href="#how-it-works" className="landing-nav-link">How It Works</a>
          <a href="#plans" className="landing-nav-link">Plans</a>
          <a href="#faq" className="landing-nav-link">FAQ</a>
        </div>
        <div className="landing-nav-ctas">
          <Link href="/login" className="btn btn-ghost btn-sm">Log In</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span style={{width:6,height:6,background:'var(--color-primary)',borderRadius:'50%',display:'inline-block'}}></span>
          Platform for Digital Workers
        </div>
        <h1 className="hero-title">
          Work Online. Complete Tasks.<br />
          <span>Get Rewarded.</span>
        </h1>
        <p className="hero-subtitle">
          Remotask connects people with digital tasks across surveys, research, AI evaluation, content, data and more. Earn money from anywhere.
        </p>
        <div className="hero-ctas">
          <Link href="/tasks" className="btn btn-primary btn-xl">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Find Tasks
          </Link>
          <Link href="/register" className="btn btn-secondary btn-xl" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>Create an Account</span>
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="hero-stats">
          <div className="text-center">
            <div className="hero-stat-value">18+</div>
            <div className="hero-stat-label">Task Categories</div>
          </div>
          <div style={{width:1,height:40,background:'var(--color-border)'}}></div>
          <div className="text-center">
            <div className="hero-stat-value">KES 30+</div>
            <div className="hero-stat-label">Per Task</div>
          </div>
          <div style={{width:1,height:40,background:'var(--color-border)'}}></div>
          <div className="text-center">
            <div className="hero-stat-value">M-Pesa</div>
            <div className="hero-stat-label">Fast Payouts</div>
          </div>
          <div style={{width:1,height:40,background:'var(--color-border)'}}></div>
          <div className="text-center">
            <div className="hero-stat-value">24h</div>
            <div className="hero-stat-label">Review Time</div>
          </div>
        </div>
      </section>

      {/* Task Categories */}
      <section id="categories" style={{background:'var(--color-bg)', padding:'var(--space-20) var(--space-8)'}}>
        <div style={{maxWidth:'var(--content-max)', margin:'0 auto'}}>
          <div className="section-header">
            <div className="section-label">Task Categories</div>
            <h2 className="section-title">Work You Can Do From Anywhere</h2>
            <p className="section-desc">From simple surveys to complex AI evaluation — find work that matches your skills and schedule.</p>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/tasks?category=${cat.slug}`} className="category-card">
                <div className="category-icon" style={{background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <CategoryIcon slug={cat.slug} size={20} />
                </div>
                <div>
                  <div className="category-name">{cat.name}</div>
                  <div className="category-count" style={{display:'flex', alignItems:'center', gap:6, marginTop:2}}>
                    <span className={`badge ${cat.plan === 'Free' ? 'badge-green' : cat.plan === 'Starter' ? 'badge-blue' : 'badge-purple'}`} style={{fontSize:10}}>
                      {cat.plan}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{background:'white', padding:'var(--space-20) var(--space-8)', borderTop:'1px solid var(--color-border)'}}>
        <div style={{maxWidth:'var(--content-max)', margin:'0 auto'}}>
          <div className="section-header">
            <div className="section-label">How It Works</div>
            <h2 className="section-title">Start Earning in 4 Simple Steps</h2>
            <p className="section-desc">Getting started with Remotask is quick and straightforward.</p>
          </div>
          <div className="two-col" style={{maxWidth:900, margin:'0 auto'}}>
            {STEPS.map(step => (
              <div key={step.n} className="step-card">
                <div className="step-number">{step.n}</div>
                <div>
                  <h4 style={{marginBottom:'var(--space-2)'}}>{step.title}</h4>
                  <p style={{fontSize:'var(--text-sm)', color:'var(--color-text-3)', lineHeight:'var(--leading-relaxed)'}}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Remotask */}
      <section id="why" style={{background:'var(--color-bg)', padding:'var(--space-20) var(--space-8)', borderTop:'1px solid var(--color-border)'}}>
        <div style={{maxWidth:'var(--content-max)', margin:'0 auto'}}>
          <div className="section-header">
            <div className="section-label">Why Remotask</div>
            <h2 className="section-title">Built for Serious Digital Workers</h2>
          </div>
          <div className="three-col">
            {WHY_ITEMS.map(item => (
              <div key={item.title} className="card" style={{padding:'var(--space-6)'}}>
                <div style={{marginBottom:'var(--space-4)', display:'flex', alignItems:'center'}}>{item.icon}</div>
                <h4 style={{marginBottom:'var(--space-2)'}}>{item.title}</h4>
                <p style={{fontSize:'var(--text-sm)', color:'var(--color-text-3)', lineHeight:'var(--leading-relaxed)'}}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" style={{background:'white', padding:'var(--space-20) var(--space-8)', borderTop:'1px solid var(--color-border)'}}>
        <div style={{maxWidth:'var(--content-max)', margin:'0 auto'}}>
          <div className="section-header">
            <div className="section-label">Access Plans</div>
            <h2 className="section-title">Choose Your Level of Access</h2>
            <p className="section-desc">Start free, upgrade when you're ready to unlock more tasks and higher earnings.</p>
          </div>
          <div className="plans-grid">
            {[
              { name: 'Free', price: 0, desc: 'Get started today', badge: null, features: ['5 tasks/day', '50 tasks/month', 'Basic categories (Surveys, Research, Classification)', 'M-Pesa payouts'] },
              { name: 'Starter', price: 299, desc: 'More categories & volume', badge: null, features: ['15 tasks/day', '150 tasks/month', 'Data annotation & transcription', 'Audio & content moderation', 'Survey creation (5/month)'] },
              { name: 'Pro', price: 799, desc: 'Full platform access', badge: 'Most Popular', features: ['50 tasks/day', '500 tasks/month', 'All 18+ categories', 'AI evaluation & prompt engineering', 'Task creation (5/month)', 'Survey creation (20/month)'] },
              { name: 'Business', price: 2499, desc: 'For power users', badge: null, features: ['100 tasks/day', '1,000 tasks/month', 'All categories + priority review', 'Advanced task creation (20/month)', 'Team features', 'Priority support'] },
            ].map(plan => (
              <div key={plan.name} className={`plan-card ${plan.badge ? 'popular' : ''}`}>
                {plan.badge && <div className="plan-badge">{plan.badge}</div>}
                <div className="plan-name">{plan.name}</div>
                <div className="plan-desc">{plan.desc}</div>
                <div className="plan-price">
                  {plan.price === 0 ? 'Free' : <><sub>KES</sub>{plan.price.toLocaleString()}</>}
                </div>
                <div className="plan-period">{plan.price === 0 ? 'Forever free' : 'per month'}</div>
                <div className="plan-features">
                  {plan.features.map(f => (
                    <div key={f} className="plan-feature-item">
                      <span className="plan-feature-check" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={12} />
                      </span>
                      {f}
                    </div>
                  ))}
                </div>
                <Link href={plan.price === 0 ? '/register' : '/upgrade'} className={`btn ${plan.badge ? 'btn-primary' : 'btn-outline-primary'} btn-full`}>
                  {plan.price === 0 ? 'Start for Free' : `Upgrade to ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{background:'var(--color-bg)', padding:'var(--space-20) var(--space-8)', borderTop:'1px solid var(--color-border)'}}>
        <div style={{maxWidth:760, margin:'0 auto'}}>
          <div className="section-header">
            <div className="section-label">FAQ</div>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'var(--space-3)'}}>
            {FAQS.map((faq, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-question">
                  {faq.q}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6,9 12,15 18,9"/></svg>
                </summary>
                <div className="faq-answer">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{background:'var(--color-primary)', padding:'var(--space-20) var(--space-8)', textAlign:'center'}}>
        <h2 style={{color:'white', fontSize:'clamp(1.5rem, 3vw, 2.25rem)', fontWeight:800, letterSpacing:'-0.02em', marginBottom:'var(--space-4)'}}>
          Start Completing Tasks Today
        </h2>
        <p style={{color:'rgba(255,255,255,0.8)', fontSize:'var(--text-lg)', marginBottom:'var(--space-8)', maxWidth:480, margin:'0 auto var(--space-8)'}}>
          Join thousands of people earning online with Remotask. No experience required.
        </p>
        <div style={{display:'flex', gap:'var(--space-4)', justifyContent:'center', flexWrap:'wrap'}}>
          <Link href="/register" className="btn btn-xl" style={{background:'white', color:'var(--color-primary)', borderColor:'white'}}>
            Create Free Account
          </Link>
          <Link href="/tasks" className="btn btn-xl btn-outline-primary" style={{borderColor:'rgba(255,255,255,0.5)', color:'white'}}>
            Browse Tasks
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div style={{maxWidth:'var(--content-max)', margin:'0 auto'}}>
          <div className="footer-grid">
            <div className="footer-brand">
              <div style={{display:'flex', alignItems:'center', gap:'var(--space-3)', marginBottom:'var(--space-4)'}}>
                <div className="sidebar-logo-mark">R</div>
                <span style={{fontSize:'var(--text-xl)', fontWeight:800, color:'white'}}>Remotask</span>
              </div>
              <p>Work online, complete digital tasks, and earn money from anywhere. Powered by a fair, transparent task marketplace.</p>
            </div>
            <div className="footer-col">
              <h4>Platform</h4>
              <Link href="/tasks" className="footer-link">Find Tasks</Link>
              <Link href="/upgrade" className="footer-link">Plans & Pricing</Link>
              <Link href="/#how-it-works" className="footer-link">How It Works</Link>
              <Link href="/register" className="footer-link">Get Started</Link>
            </div>
            <div className="footer-col">
              <h4>Account</h4>
              <Link href="/login" className="footer-link">Log In</Link>
              <Link href="/register" className="footer-link">Create Account</Link>
              <Link href="/dashboard" className="footer-link">Dashboard</Link>
              <Link href="/earnings" className="footer-link">Earnings</Link>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <Link href="/terms" className="footer-link">Terms of Service</Link>
              <Link href="/privacy" className="footer-link">Privacy Policy</Link>
              <Link href="/payments-policy" className="footer-link">Payment Policy</Link>
              <Link href="/task-guidelines" className="footer-link">Task Guidelines</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Remotask. All rights reserved.</span>
            <span>support@remotask.co.ke</span>
          </div>
        </div>
      </footer>
    </>
  );
}
