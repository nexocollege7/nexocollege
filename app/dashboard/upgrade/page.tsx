'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Plano = {
  id: string
  slug: string
  nome: string
  preco: number
  maxCursos: number
  maxAlunos: number
  destaque: boolean
  recursos: string[]
}

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [loadingPrecos, setLoadingPrecos] = useState(true)
  const [erro, setErro] = useState('')
  const [planos, setPlanos] = useState<Plano[]>([])
  const [planoAtual, setPlanoAtual] = useState<string>('starter')

  useEffect(() => {
    async function carregarDados() {
      const supabase = createClient()

      // Buscar plano atual da escola
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('school_id')
          .eq('id', user.id)
          .single()

        if (profile?.school_id) {
          const { data: school } = await supabase
            .from('schools')
            .select('plan')
            .eq('id', profile.school_id)
            .single()
          if (school?.plan) setPlanoAtual(school.plan)
        }
      }

      // Buscar planos pagos da tabela plans
      const { data: planosDB } = await supabase
        .from('plans')
        .select('*')
        .in('slug', ['creator', 'pro', 'scale'])
        .eq('is_active', true)
        .order('price_yearly', { ascending: true })

      if (planosDB) {
        const recursosMap: Record<string, string[]> = {
          creator: [
            'Até 5 cursos',
            'Até 300 alunos',
            'Vitrine personalizada',
            'Certificados automáticos',
            'Cupons de desconto',
            'Depoimentos automáticos',
            'Gateway próprio MP',
            '1 colaborador',
          ],
          pro: [
            'Até 20 cursos',
            'Até 1.000 alunos',
            'Vitrine personalizada',
            'Certificados automáticos',
            'Cupons e depoimentos',
            'Eventos ao vivo',
            'Gateway próprio MP',
            '3 colaboradores',
            'Suporte prioritário',
          ],
          scale: [
            'Até 50 cursos',
            'Até 3.000 alunos',
            'Vitrine personalizada',
            'Certificados automáticos',
            'Cupons e depoimentos',
            'Eventos ao vivo',
            'Gateway próprio MP',
            'Domínio próprio',
            '10 colaboradores',
            'Suporte dedicado',
          ],
        }

        setPlanos(planosDB.map(p => ({
          id: p.id,
          slug: p.slug,
          nome: p.name,
          preco: Number(p.price_yearly),
          maxCursos: p.max_courses,
          maxAlunos: p.max_students,
          destaque: p.slug === 'pro',
          recursos: recursosMap[p.slug] || [],
        })))
      }

      setLoadingPrecos(false)
    }
    carregarDados()
  }, [])

  async function handleUpgrade(slug: string) {
    setLoading(slug)
    setErro('')
    try {
      const res = await fetch('/api/criar-preferencia-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: slug }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Erro ao criar pagamento.')
        setLoading(null)
        return
      }
      window.location.href = data.url
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setLoading(null)
    }
  }

  if (loadingPrecos) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <p style={{ color: '#888' }}>Carregando planos...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      <style>{`
        @media (max-width: 480px) {
          .upgrade-enterprise { flex-direction: column !important; padding: 24px 16px !important; }
          .upgrade-enterprise > div { min-width: unset !important; }
        }
      `}</style>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#F0F0F0', marginBottom: '12px' }}>
          Faça upgrade da sua escola
        </h1>
        <p style={{ color: '#888', fontSize: '16px' }}>
          Desbloqueie mais cursos e recursos para crescer
        </p>
        {planoAtual && (
          <div style={{ marginTop: '12px', display: 'inline-block', background: '#1a1a1a', border: '1px solid #333', borderRadius: '100px', padding: '6px 18px', fontSize: '13px', color: '#666' }}>
            Plano atual: <span style={{ color: '#AEEA00', fontWeight: '700', textTransform: 'capitalize' }}>{planoAtual}</span>
          </div>
        )}
      </div>

      {erro && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', borderRadius: '10px', padding: '12px 16px',
          marginBottom: '24px', textAlign: 'center', fontSize: '14px',
        }}>
          {erro}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {planos.map(plano => {
          const isAtual = planoAtual === plano.slug
          return (
            <div key={plano.slug} style={{
              background: '#141414',
              border: `2px solid ${plano.destaque ? '#AEEA00' : isAtual ? '#444' : '#222'}`,
              borderRadius: '20px', padding: '36px',
              flex: 1, minWidth: '260px', maxWidth: '320px',
              position: 'relative',
              boxShadow: plano.destaque ? '0 0 40px rgba(174,234,0,0.08)' : 'none',
            }}>
              {plano.destaque && !isAtual && (
                <div style={{
                  position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                  background: '#AEEA00', color: '#0D0D0D', fontSize: '11px', fontWeight: '900',
                  padding: '4px 18px', borderRadius: '100px', whiteSpace: 'nowrap', letterSpacing: '0.07em',
                }}>
                  ⭐ MAIS VENDIDO
                </div>
              )}
              {isAtual && (
                <div style={{
                  position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                  background: '#333', color: '#888', fontSize: '11px', fontWeight: '900',
                  padding: '4px 18px', borderRadius: '100px', whiteSpace: 'nowrap', letterSpacing: '0.07em',
                }}>
                  PLANO ATUAL
                </div>
              )}

              <div style={{ fontSize: '13px', fontWeight: '700', color: plano.destaque ? '#AEEA00' : '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                {plano.nome}
              </div>
              <div style={{ fontSize: '42px', fontWeight: '900', color: '#F0F0F0', marginBottom: '4px' }}>
                R$ {plano.preco.toLocaleString('pt-BR')}
                <span style={{ fontSize: '16px', color: '#555', fontWeight: '400' }}>/ano</span>
              </div>
              <div style={{ color: '#666', fontSize: '13px', marginBottom: '28px' }}>
                equivale a R$ {Math.round(plano.preco / 12).toLocaleString('pt-BR')}/mês
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                {plano.recursos.map(r => (
                  <div key={r} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#999' }}>
                    <span style={{ color: '#AEEA00', fontWeight: '900' }}>✓</span> {r}
                  </div>
                ))}
              </div>

              <button
                onClick={() => !isAtual && handleUpgrade(plano.slug)}
                disabled={loading !== null || isAtual}
                style={{
                  width: '100%', padding: '14px',
                  background: isAtual ? '#1e1e1e' : loading === plano.slug ? '#333' : plano.destaque ? '#AEEA00' : '#F0F0F0',
                  color: isAtual ? '#555' : '#0D0D0D',
                  fontWeight: '800', fontSize: '15px',
                  border: isAtual ? '1px solid #333' : 'none',
                  borderRadius: '12px',
                  cursor: isAtual || loading !== null ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                  opacity: loading !== null && loading !== plano.slug ? 0.5 : 1,
                }}
              >
                {isAtual ? 'Plano atual' : loading === plano.slug ? 'Aguarde...' : `Assinar ${plano.nome}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Enterprise */}
      <div className="upgrade-enterprise" style={{
        marginTop: '32px', background: 'linear-gradient(135deg, #141414, #1a1f00)',
        border: '1px solid #2a3500', borderRadius: '20px', padding: '36px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px',
      }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#AEEA00', marginBottom: '10px' }}>Enterprise</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#F0F0F0', marginBottom: '8px' }}>Para grandes operações</div>
          <div style={{ fontSize: '15px', color: '#666' }}>Cursos e alunos ilimitados. Suporte dedicado. Proposta sob medida.</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 32px', flex: 1, minWidth: '240px' }}>
          {['Cursos ilimitados', 'Alunos ilimitados', 'Domínio próprio', 'Gerente dedicado', 'SLA garantido', 'Onboarding personalizado'].map(r => (
            <div key={r} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', color: '#888' }}>
              <span style={{ color: '#AEEA00', fontWeight: '900' }}>✓</span> {r}
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', minWidth: '180px' }}>
          <div style={{ fontSize: '13px', color: '#555', marginBottom: '14px' }}>Preço sob consulta</div>
          <a href="mailto:contato@nexocollege.com.br" style={{
            display: 'inline-block', padding: '14px 28px',
            background: '#AEEA00', color: '#0D0D0D', fontWeight: '800',
            fontSize: '15px', borderRadius: '12px', textDecoration: 'none',
          }}>
            Falar com equipe
          </a>
        </div>
      </div>

      <p style={{ textAlign: 'center', color: '#333', fontSize: '13px', marginTop: '32px' }}>
        Pagamento seguro via Mercado Pago &nbsp;•&nbsp; Suporte em até 24h
      </p>
    </div>
  )
}
