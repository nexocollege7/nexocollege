export type PlanFeature = 'coupons' | 'reviews' | 'live_events' | 'custom_domain' | 'collaborators'

export type PermissaoPlano = {
  allowed: boolean
  upgradeRequired?: string
}

export const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  creator: 'Creator',
  pro: 'Pro',
  scale: 'Scale',
  enterprise: 'Enterprise',
}
