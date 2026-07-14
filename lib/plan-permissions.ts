import { createAdminClient } from '@/lib/supabase/admin'
import { unstable_cache } from 'next/cache'
import { type PlanFeature, type PermissaoPlano } from '@/lib/plan-features'

export type { PlanFeature, PermissaoPlano }
export { PLAN_LABELS } from '@/lib/plan-features'

type PlanRow = {
  slug: string
  price_yearly: number
  can_use_coupons: boolean
  can_use_reviews: boolean
  can_use_live_events: boolean
  can_use_live_native: boolean
  has_custom_domain: boolean
  max_collaborators: number
}

// Apenas os planos vendidos publicamente entram na sugestão de upgrade — 'enterprise' é acordo customizado.
const HIERARQUIA_PUBLICA = ['starter', 'creator', 'pro', 'scale']

// Dado global, não específico de usuário/escola — cliente admin evita cookies() dentro do escopo cacheado.
const getPlanosCacheados = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data: plans } = await supabase
      .from('plans')
      .select('slug, price_yearly, can_use_coupons, can_use_reviews, can_use_live_events, can_use_live_native, has_custom_domain, max_collaborators')

    return (plans ?? []) as PlanRow[]
  },
  ['plans-permissions'],
  { tags: ['plans'], revalidate: 86400 }
)

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
    case 'live_native':
      return plan.can_use_live_native
    case 'ai_assistant':
      return ['pro', 'scale', 'enterprise'].includes(plan.slug)
  }
}

// Certificados, comentários e analytics são liberados para todos os planos e não passam por aqui.
export async function verificarPermissao(
  school: { plan: string | null },
  feature: PlanFeature
): Promise<PermissaoPlano> {
  const planSlug = school.plan ?? 'starter'
  const planosDisponiveis = await getPlanosCacheados()
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
