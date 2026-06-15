'use client'

import { useEffect, useState } from 'react'
import { getEscolas } from '@/app/actions/master-actions'

const PLANOS: Record<string, { valor: number, label: string, cursos: string }> = {
  starter:    { valor: 0,      label: 'Starter',    cursos: 'até 1 curso' },
  creator:    { valor: 49.75,  label: 'Creator',    cursos: 'até 5 cursos' },
  pro:        { valor: 99.75,  label: 'Pro',         cursos: 'até 10 cursos' },
  scale:      { valor: 208.08, label: 'Scale',       cursos: 'até 25 cursos' },
  enterprise: { valor: 0,      label: 'Enterprise',  cursos: 'ilimitado' },
}

export default function FinanceiroPage() {
  const [escolas, setEscolas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getEscolas()
      setEscolas(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888888' }}>Carregando...</p>
    </div>
  )

  const escolasAtivas = escolas.filter((e) => e.is_active)
  const receitaMensal = escolasAtivas.reduce((acc, e) => acc + (PLANOS[e.plan]?.valor || 0), 0)
  const receitaAnual = receitaMensal * 12
  const totalPro = escolas.filter((e) => e.plan === 'pro').length
  const totalEnterprise = escolas.filter((e) => e.plan === 'enterprise').length
  const totalStarter = escolas.filter((e) => e.plan === 'starter' || !e.plan).length

  const cards = [
    { label: 'Receita Mensal', value: `R$ ${receitaMensal.toLocaleString('pt-BR')}`, sub: 'planos pagos ativos', color: '#AEEA00', bg: '#1A2E00' },
    { label: 'Previsao Anual', value: `R$ ${receitaAnual.toLocaleString('pt-BR')}`, sub: 'se mantiver os planos', color: '#7C4DFF', bg: '#1E0E3F' },
    { label: 'Escolas Pro', value: totalPro, sub: 'R$ 197/mes cada', color: '#60A5FA', bg: '#1E3A5F' },
    { label: 'Enterprise', value: totalEnterprise, sub: 'R$ 497/mes cada', color: '#FACC15', bg: '#2E2100' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Financeiro</h1>
        <p style={{ color: '#888888', marginTop: '4px', fontSize: '14px' }}>Visao financeira da plataforma</p>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {cards.map((card) => (
          <div key={card.label} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
            <p style={{ color: '#888888', fontSize: '13px', margin: '0 0 8px' }}>{card.label}</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: card.color, margin: '0 0 4px' }}>{card.value}</p>
            <p style={{ color: '#555555', fontSize: '12px', margin: 0 }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Resumo por plano */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {Object.entries(PLANOS).map(([key, plano]) => {
          const count = escolas.filter((e) => (e.plan || 'starter') === key).length
          return (
            <div key={key} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ color: '#F0F0F0', fontWeight: '700', fontSize: '15px', margin: 0 }}>{plano.label}</p>
                <span style={{ backgroundColor: '#7C4DFF22', color: '#7C4DFF', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>
                  {plano.valor === 0 ? 'Gratis' : `R$ ${plano.valor}/mes`}
                </span>
              </div>
              <p style={{ color: '#555555', fontSize: '12px', margin: '0 0 12px' }}>{plano.cursos}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>{count} escola{count !== 1 ? 's' : ''}</p>
                <p style={{ color: '#AEEA00', fontWeight: '700', fontSize: '15px', margin: 0 }}>
                  R$ {(count * plano.valor).toLocaleString('pt-BR')}/mes
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A', display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 140px', gap: '16px' }}>
          {['Escola', 'Plano', 'Mensalidade', 'Status', 'Gateway MP'].map((h) => (
            <p key={h} style={{ color: '#555555', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{h}</p>
          ))}
        </div>

        {escolas.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: '#555555', fontSize: '14px' }}>Nenhuma escola cadastrada ainda.</p>
          </div>
        ) : (
          <>
            {escolas.map((escola, index) => {
              const plano = PLANOS[escola.plan] || PLANOS.starter
              return (
                <div key={escola.id} style={{ padding: '16px 20px', borderBottom: index < escolas.length - 1 ? '1px solid #222222' : 'none', display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 140px', gap: '16px', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '500', margin: 0 }}>{escola.name}</p>
                    {escola.owner_name && <p style={{ color: '#555555', fontSize: '12px', margin: '2px 0 0' }}>{escola.owner_name}</p>}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', backgroundColor: '#1E0E3F', color: '#7C4DFF', display: 'inline-block' }}>
                    {plano.label}
                  </span>
                  <p style={{ color: plano.valor === 0 ? '#555555' : '#AEEA00', fontWeight: '700', fontSize: '14px', margin: 0 }}>
                    {plano.valor === 0 ? 'Gratis' : `R$ ${plano.valor}`}
                  </p>
                  <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', display: 'inline-block', backgroundColor: escola.is_active ? '#1A2E00' : '#2A1A1A', color: escola.is_active ? '#AEEA00' : '#FF5555' }}>
                    {escola.is_active ? 'Ativa' : 'Suspensa'}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', display: 'inline-block', backgroundColor: escola.has_mp_token ? '#1A2E00' : '#2A1A1A', color: escola.has_mp_token ? '#AEEA00' : '#888888' }}>
                    {escola.has_mp_token ? 'Configurado' : 'Pendente'}
                  </span>
                </div>
              )
            })}
            {/* Rodapé total */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #2A2A2A', display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 140px', gap: '16px', alignItems: 'center', backgroundColor: '#111111' }}>
              <p style={{ color: '#888888', fontSize: '13px', fontWeight: '600', margin: 0 }}>{escolas.length} escola{escolas.length !== 1 ? 's' : ''} no total</p>
              <span />
              <p style={{ color: '#AEEA00', fontSize: '15px', fontWeight: '800', margin: 0 }}>R$ {receitaMensal.toLocaleString('pt-BR')}/mes</p>
              <span />
              <span />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
