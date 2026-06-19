export const MENTOR_MODULE_PRICE_YEARLY = 1597

export const MENTOR_MODULE_ELIGIBLE_PLANS = ['creator', 'pro', 'scale', 'enterprise']

export function elegivelParaMentorModule(plan: string | null | undefined): boolean {
  return MENTOR_MODULE_ELIGIBLE_PLANS.includes(plan ?? 'starter')
}
