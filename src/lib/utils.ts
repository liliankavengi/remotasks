// src/lib/utils.ts

/** Simple class name joiner without clsx dependency */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Format currency */
export function formatCurrency(amount: number, currency = 'KES'): string {
  return `${currency} ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/** Format date */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-KE', options ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Format relative time */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24)   return `${hours}h ago`;
  if (days < 7)     return `${days}d ago`;
  return formatDate(d);
}

/** Get initials from name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

/** Truncate text */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '…';
}

/** Debounce */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Generate a random reference ID */
export function generateReference(prefix = 'RT'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/** Task status display */
export const TASK_STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  DRAFT:          { label: 'Draft',          badge: 'badge-gray' },
  PENDING_REVIEW: { label: 'Pending Review', badge: 'badge-yellow' },
  PUBLISHED:      { label: 'Published',      badge: 'badge-green' },
  PAUSED:         { label: 'Paused',         badge: 'badge-orange' },
  COMPLETED:      { label: 'Completed',      badge: 'badge-blue' },
  EXPIRED:        { label: 'Expired',        badge: 'badge-gray' },
  REJECTED:       { label: 'Rejected',       badge: 'badge-red' },
};

/** Submission status display */
export const SUBMISSION_STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  DRAFT:        { label: 'Draft',        badge: 'badge-gray' },
  SUBMITTED:    { label: 'Submitted',    badge: 'badge-blue' },
  UNDER_REVIEW: { label: 'Under Review', badge: 'badge-yellow' },
  APPROVED:     { label: 'Approved',     badge: 'badge-green' },
  REJECTED:     { label: 'Rejected',     badge: 'badge-red' },
  PAID:         { label: 'Paid',         badge: 'badge-green' },
};

/** Payment status display */
export const PAYMENT_STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  PENDING:   { label: 'Pending',   badge: 'badge-yellow' },
  COMPLETED: { label: 'Completed', badge: 'badge-green' },
  FAILED:    { label: 'Failed',    badge: 'badge-red' },
  CANCELLED: { label: 'Cancelled', badge: 'badge-gray' },
  REFUNDED:  { label: 'Refunded',  badge: 'badge-blue' },
};

/** Difficulty display */
export const DIFFICULTY_LABELS: Record<string, { label: string; badge: string }> = {
  BEGINNER:     { label: 'Beginner',     badge: 'badge-green' },
  INTERMEDIATE: { label: 'Intermediate', badge: 'badge-yellow' },
  ADVANCED:     { label: 'Advanced',     badge: 'badge-orange' },
  EXPERT:       { label: 'Expert',       badge: 'badge-red' },
};

/** Plan display badges */
export const PLAN_DISPLAY: Record<string, { label: string; badge: string }> = {
  FREE:       { label: 'FREE Starter',        badge: 'badge-gray' },
  STARTER:    { label: 'Bronze Starter',     badge: 'badge-blue' },
  PRO:        { label: 'Silver Pro',          badge: 'badge-purple' },
  VIP:        { label: 'Gold VIP',            badge: 'badge-amber' },
  ENTERPRISE: { label: 'Platinum Enterprise', badge: 'badge-emerald' },
};

/** Category icons */
export const CATEGORY_ICONS: Record<string, string> = {
  surveys:             '📋',
  'survey-creation':   '✏️',
  'prompt-engineering': '⚡',
  'ai-evaluation':     '🤖',
  'data-annotation':   '🏷️',
  'image-classification': '🖼️',
  'text-classification': '📝',
  'content-moderation': '🛡️',
  'web-research':      '🔍',
  'data-collection':   '📊',
  transcription:       '🎙️',
  'search-relevance':  '🎯',
  'product-categorization': '🛒',
  'content-writing':   '✍️',
  'ai-training':       '🧠',
  'audio-evaluation':  '🎵',
  translation:         '🌐',
  'website-testing':    '💻',
};
