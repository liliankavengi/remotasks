'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  DollarSign,
  ShieldCheck,
  Send,
  History,
  Info
} from 'lucide-react';

interface Payout {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  accountDetails: string;
  createdAt: string;
  processedAt?: string;
  reference?: string;
}

export default function PayoutsPage() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [amount, setAmount] = useState<string>('10');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState('MPESA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const MIN_PAYOUT = 5.0;

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payouts');
      const data = await res.json();
      if (res.ok) {
        setWalletBalance(data.walletBalance || 0);
        setTotalEarned(data.totalEarned || 0);
        setTotalPaid(data.totalPaid || 0);
        setPayouts(data.payouts || []);
      }
    } catch (err) {
      console.error('Error fetching payout data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount < MIN_PAYOUT) {
      setMessage({ type: 'error', text: `Minimum withdrawal amount is $${MIN_PAYOUT.toFixed(2)}` });
      return;
    }

    if (numericAmount > walletBalance) {
      setMessage({ type: 'error', text: `Insufficient funds. Your balance is $${walletBalance.toFixed(2)}` });
      return;
    }

    if (!phone.trim()) {
      setMessage({ type: 'error', text: 'Please enter your M-Pesa phone number.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          paymentMethod: method,
          accountDetails: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit withdrawal request.');
      }

      setMessage({ type: 'success', text: data.message || 'Withdrawal requested successfully!' });
      setAmount('10');
      fetchPayoutData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Wallet & M-Pesa Withdrawals</h1>
        <p className="text-muted text-sm mt-1">
          Withdraw your verified task earnings directly to your M-Pesa mobile wallet.
        </p>
      </div>

      {/* Balance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Wallet Balance Card */}
        <div className="card p-6 bg-gradient-to-br from-emerald-950/40 via-card to-card border-emerald-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Available Balance</span>
            <Wallet className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-white my-1">
            ${walletBalance.toFixed(2)}
          </div>
          <p className="text-xs text-muted font-mono">
            ≈ KES {(walletBalance * 130).toLocaleString()} (Est. rate 1 USD = 130 KES)
          </p>
        </div>

        {/* Total Lifetime Earned */}
        <div className="card p-6 relative">
          <div className="flex items-center justify-between text-sky-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Earned</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-white my-1">
            ${totalEarned.toFixed(2)}
          </div>
          <p className="text-xs text-muted">From verified task completions</p>
        </div>

        {/* Total Paid Out */}
        <div className="card p-6 relative">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Paid Out</span>
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-white my-1">
            ${totalPaid.toFixed(2)}
          </div>
          <p className="text-xs text-muted">Processed to M-Pesa / Bank</p>
        </div>
      </div>

      {/* Main Grid: Request Form (Left) & History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request Payout Form */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handlePayoutSubmit} className="card p-6 space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              Request M-Pesa Payout
            </h2>

            {message && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Payout Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="input w-full text-xs"
              >
                <option value="MPESA">M-Pesa (Kenya)</option>
                <option value="AIRTEL_MONEY">Airtel Money</option>
                <option value="BANK_TRANSFER">Bank Transfer (SWIFT)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                M-Pesa Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0712345678 or 254712345678"
                className="input w-full text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Withdrawal Amount ($ USD) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min={MIN_PAYOUT}
                  max={walletBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input w-full text-xs pl-7 font-mono"
                  required
                />
                <span className="absolute left-3 top-2.5 text-muted text-xs">$</span>
              </div>
              <p className="text-[11px] text-muted mt-1 flex justify-between">
                <span>Min: ${MIN_PAYOUT.toFixed(2)}</span>
                <span>Max: ${walletBalance.toFixed(2)}</span>
              </p>
            </div>

            <div className="p-3 bg-zinc-900 rounded-lg text-xs space-y-1 text-muted border border-border">
              <div className="flex justify-between">
                <span>Est. M-Pesa Amount:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  KES {((parseFloat(amount) || 0) * 130).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Processing Fee:</span>
                <span className="text-zinc-400 font-mono">0% Free</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || walletBalance < MIN_PAYOUT}
              className="btn btn-primary w-full text-xs py-3"
            >
              {isSubmitting ? (
                'Submitting Request...'
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  Request M-Pesa Withdrawal
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Payout History Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-sky-400" />
              Payout History
            </h2>
          </div>

          {loading ? (
            <div className="card p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-loader h-12 w-full rounded" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <div className="card p-8 text-center space-y-3">
              <Info className="w-8 h-8 text-muted mx-auto" />
              <h3 className="font-bold text-white text-sm">No Payout Requests Yet</h3>
              <p className="text-muted text-xs">
                When you request a withdrawal, your transaction status will appear here.
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 border-b border-border text-muted font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Account</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payouts.map((po) => (
                      <tr key={po.id} className="hover:bg-zinc-900/40">
                        <td className="p-3 font-mono text-[11px] text-zinc-400">
                          {po.reference || po.id.slice(0, 8)}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-white">{po.method}</span>
                          <span className="text-[11px] text-muted block font-mono">
                            {po.accountDetails}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-emerald-400">
                          ${po.amount.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              po.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : po.status === 'FAILED'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted text-[11px] font-mono">
                          {new Date(po.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
