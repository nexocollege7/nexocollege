'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Plano = {
  id: string
  nome: string
  preco: number
  precoMes: number
  periodo: string
  cor: string
  corBotao: string
  destaque: boolean
  recursos: string[]
}

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [loadingPrecos, setLoadingPrecos] = useState(true)
  const [erro, setErro] = useState('')
  const [planos, setPlanos] = useState<Plano[]>([])

  useEffect(() => {
    async function carregarPrecos() {
      const supabase = createClient()
      const { data } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', ['pro_price_yearly', 'enterprise_price_yearly'])

      const proAnual = Number(data?.find(d => d.key === 'pro_price_yearly')?.value || 2364)
      const enterpriseAnual = Number(data?.find(d => d.key === 'enterprise_price_yearly')?.value || 7164)

      setPlanos([
        {
          id: 'pro',
          nome: 'Pro',
          preco: proAnual,
          precoMes: Math.round(proAnual / 12),
          periodo: '/ano',
          cor: '#AEEA00',
          corBotao: '#AEEA00',
          destaque: true,
          recursos: [
            'Até 10 cursos',
            'Alunos ilimitados',
            'Vitrine personalizada',
            'Certificados automáticos',
            'Gateway próprio MP',
            'Suporte prioritário',
          ],
        },
        {
          id: 'enterprise',
          nome: 'Enterprise',
          preco: enterpriseAnual,
          precoMes: Math.round(enterpriseAnual / 12),
          periodo: '/ano',
          cor: '#7C4DFF',
          corBotao: '#7C4DFF',
          destaque: false,
          recursos: [
            'Cursos ilimitados',
            'Alunos ilimitados',
            'Vitrine personalizada',
            'Certificados automáticos',
            'Gateway próprio MP',
            'Suporte VIP',
          ],
        },
      ])
      setLoadingPrecos(false)
    }
    carregarPrecos()
  }, [])

  async function handleUpgrade(planoId: string) {
    setLoading(planoId)
    setErro('')
    try {
      const res = await fetch('/api/criar-preferencia-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: planoId }),
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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#F0F0F0', marginBottom: '12px' }}>
          Faça upgrade da sua escola
        </h1>
        <p style={{ color: '#888', fontSize: '16px' }}>
          Desbloqueie mais cursos e recursos para crescer
        </p>
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

      <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {planos.map(plano => (
          <div key={plano.id} style={{
            background: '#141414',
            border: `2px solid ${plano.destaque ? '#AEEA00' : '#222'}`,
            borderRadius: '20px', padding: '36px',
            flex: 1, minWidth: '260px', maxWidth: '360px',
            position: 'relative',
            boxShadow: plano.destaque ? '0 0 40px rgba(174,234,0,0.08)' : 'none',
          }}>
            {plano.destaque && (
              <div style={{
                position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                background: '#AEEA00', color: '#0D0D0D', fontSize: '11px', fontWeight: '900',
                padding: '4px 18px', borderRadius: '100px', whiteSpace: 'nowrap', letterSpacing: '0.07em',
              }}>
                MAIS POPULAR
              </div>
            )}

            <div style={{ fontSize: '13px', fontWeight: '700', color: plano.cor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
              {plano.nome}
            </div>
            <div style={{ fontSize: '42px', fontWeight: '900', color: '#F0F0F0', marginBottom: '4px' }}>
              R$ {plano.preco.toLocaleString('pt-BR')}
              <span style={{ fontSize: '16px', color: '#555', fontWeight: '400' }}>{plano.periodo}</span>
            </div>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '28px' }}>
              equivale a R$ {plano.precoMes.toLocaleString('pt-BR')}/mês
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
              {plano.recursos.map(r => (
                <div key={r} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#999' }}>
                  <span style={{ color: plano.cor, fontWeight: '900' }}>✓</span> {r}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgrade(plano.id)}
              disabled={loading !== null}
              style={{
                width: '100%', padding: '14px',
                background: loading === plano.id ? '#333' : plano.corBotao,
                color: '#0D0D0D', fontWeight: '800', fontSize: '15px',
                border: 'none', borderRadius: '12px',
                cursor: loading !== null ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
                opacity: loading !== null && loading !== plano.id ? 0.5 : 1,
              }}
            >
              {loading === plano.id ? 'Aguarde...' : `Assinar ${plano.nome}`}
            </button>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', color: '#333', fontSize: '13px', marginTop: '32px' }}>
        Pagamento seguro via Mercado Pago &nbsp;•&nbsp; Cancele quando quiser
      </p>
    </div>
  )
}
