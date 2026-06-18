import Link from 'next/link'
import { Lock } from 'lucide-react'
import { PLAN_LABELS } from '@/lib/plan-features'

export function PlanLock({ upgradeRequired, mensagem }: { upgradeRequired?: string; mensagem?: string }) {
  const planoLabel = upgradeRequired ? PLAN_LABELS[upgradeRequired] ?? upgradeRequired : null

  return (
    <div style={{
      background: 'rgba(124,77,255,0.06)', border: '1px solid rgba(124,77,255,0.3)',
      borderRadius: '12px', padding: '24px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
    }}>
      <Lock size={24} color="#7C4DFF" />
      <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600', margin: 0 }}>
        {mensagem ?? (planoLabel ? `Disponível no plano ${planoLabel}` : 'Recurso não disponível no seu plano')}
      </p>
      <Link href="/dashboard/upgrade" style={{
        display: 'inline-block', background: '#7C4DFF', color: '#fff', borderRadius: '8px',
        padding: '10px 24px', textDecoration: 'none', fontWeight: '700', fontSize: '14px',
      }}>
        Fazer upgrade
      </Link>
    </div>
  )
}
