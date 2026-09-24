// src/lib/permissions.ts
// Centralized permission/access control — enforced server-side

export type PlanSlug = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE' | 'VIP';
export type Role = 'USER' | 'CREATOR' | 'REVIEWER' | 'ADMIN' | 'SUPER_ADMIN';

export const PLAN_HIERARCHY: Record<string, number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 2,
  VIP: 3,
  BUSINESS: 3,
  ENTERPRISE: 4,
};

export function planMeetsRequirement(userPlan: string, requiredPlan: string): boolean {
  const uLevel = PLAN_HIERARCHY[userPlan] ?? 0;
  const rLevel = PLAN_HIERARCHY[requiredPlan] ?? 0;
  return uLevel >= rLevel;
}

export function isAdmin(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isReviewer(role: string): boolean {
  return role === 'REVIEWER' || isAdmin(role);
}

export function isCreator(role: string): boolean {
  return role === 'CREATOR' || isAdmin(role);
}

// Can user access a task (based on plan)
export function canAccessTask(userPlan: string, requiredPlan: string): boolean {
  return planMeetsRequirement(userPlan, requiredPlan);
}

// Can user submit a task
export function canSubmitTask(userPlan: string, requiredPlan: string): boolean {
  return planMeetsRequirement(userPlan, requiredPlan);
}

// Can user create surveys
export function canCreateSurvey(userPlan: string, limit: number): boolean {
  return planMeetsRequirement(userPlan, 'STARTER') && limit > 0;
}

// Can user create tasks
export function canCreateTask(userPlan: string, limit: number): boolean {
  return planMeetsRequirement(userPlan, 'PRO') && limit > 0;
}

// Can user request a payout
export function canWithdraw(availableBalance: number, minPayout: number): boolean {
  return availableBalance >= minPayout;
}

// Can user access admin dashboard
export function canAccessAdmin(role: string): boolean {
  return isAdmin(role);
}

// Plan display names
export const PLAN_DISPLAY: Record<string, { name: string; color: string; badge: string }> = {
  FREE:       { name: 'Free Starter',       color: '#64748B', badge: 'badge-gray' },
  STARTER:    { name: 'Bronze Starter',    color: '#0EA5E9', badge: 'badge-blue' },
  PRO:        { name: 'Silver Pro',          color: '#16A34A', badge: 'badge-green' },
  VIP:        { name: 'Gold VIP',            color: '#F59E0B', badge: 'badge-amber' },
  BUSINESS:   { name: 'Business',           color: '#7C3AED', badge: 'badge-purple' },
  ENTERPRISE: { name: 'Platinum Enterprise', color: '#F59E0B', badge: 'badge-yellow' },
};
