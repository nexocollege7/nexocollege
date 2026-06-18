import { createClient } from '@/lib/supabase/server'

export type PlanFeature = 'coupons' | 'reviews' | 'live_events' | 'custom_domain' | 'collaborators'

export type PermissaoPlano = {
  allowed: boolean
  upgradeRequired?: string
}

type PlanRow = {
  slug: string
  price_yearly: number
  can_use_coupons: boolean
  can_use_reviews: boolean
  can_use_live_events: boolean
  has_custom_domain: boolean
  max_collaborators: number
}

// Apenas os planos vendidos publicamente entram na sugestão de upgrade — 'enterprise' é acordo customizado.
const HIERARQUIA_PUBLICA = ['starter', 'creator', 'pro', 'scale']

function planPermiteFeature(plan: PlanRow, feature: PlanFeature): boolean {
  switch (feature) {
    case 'coupons':
      return plan.can_use_coupons
    case 'reviews':
      return plan.can_use_reviews
    case 'live_events':
      return plan.can_use_live_events
    case 'custom_domain':
      return plan.has_custom_domain
    case 'collaborators':
      return plan.max_collaborators > 0
  }
}

// Certificados, comentários e analytics são liberados para todos os planos e não passam por aqui.
export async function verificarPermissao(
  school: { plan: string | null },
  feature: PlanFeature
): Promise<PermissaoPlano> {
  const supabase = await createClient()
  const planSlug = school.plan ?? 'starter'

  const { data: plans } = await supabase
    .from('plans')
    .select('slug, price_yearly, can_use_coupons, can_use_reviews, can_use_live_events, has_custom_domain, max_collaborators')

  const planosDisponiveis = (plans ?? []) as PlanRow[]
  const planoAtual = planosDisponiveis.find((p) => p.slug === planSlug)

  if (planoAtual && planPermiteFeature(planoAtual, feature)) {
    return { allowed: true }
  }

  const proximoPlanoCompativel = planosDisponiveis
    .filter((p) => HIERARQUIA_PUBLICA.includes(p.slug))
    .sort((a, b) => a.price_yearly - b.price_yearly)
    .find((p) => planPermiteFeature(p, feature))

  return { allowed: false, upgradeRequired: proximoPlanoCompativel?.slug }
}
