export type PlanFeature = 'coupons' | 'reviews' | 'live_events' | 'live_native' | 'custom_domain' | 'collaborators' | 'ai_assistant'

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
