'use client'

import { useEffect, useState } from 'react'
import { getAnaliseComercial } from '@/app/actions/master-actions'

export default function AnalisePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const result = await getAnaliseComercial()
      setData(result)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888888' }}>Carregando analise...</p>
    </div>
  )

  if (!data) return null

  const maxMes = Math.max(...data.meses.map((m: any) => m.count), 1)
  const totalPlano = data.porPlano.starter + data.porPlano.pro + data.porPlano.enterprise || 1

  const coresPlano = { starter: '#555555', pro: '#7C4DFF', enterprise: '#AEEA00' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>{`
        @media (max-width: 768px) {
          .analise-cards { grid-template-columns: repeat(2, 1fr) !important; }
          .analise-charts { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .analise-cards { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Analise Comercial</h1>
        <p style={{ color: '#888888', marginTop: '4px', fontSize: '14px' }}>Performance e crescimento da plataforma</p>
      </div>

      {/* Cards de performance */}
      <div className="analise-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total de Escolas', value: data.total, color: '#F0F0F0', sub: 'cadastradas' },
          { label: 'Escolas Pagas', value: data.pagas, color: '#AEEA00', sub: 'Pro + Enterprise' },
          { label: 'Taxa de Conversao', value: data.taxaConversao + '%', color: '#7C4DFF', sub: 'free para pago' },
          { label: 'Ticket Medio', value: 'R$ ' + data.ticketMedio, color: '#FACC15', sub: 'por escola paga' },
        ].map((card) => (
          <div key={card.label} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
            <p style={{ color: '#888888', fontSize: '13px', margin: '0 0 8px' }}>{card.label}</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: card.color, margin: '0 0 4px' }}>{card.value}</p>
            <p style={{ color: '#555555', fontSize: '12px', margin: 0 }}>{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="analise-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Grafico de barras — escolas por mes */}
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ color: '#F0F0F0', fontSize: '15px', fontWeight: '600', margin: '0 0 24px' }}>Novas escolas por mes</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px' }}>
            {data.meses.map((mes: any, i: number) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                <p style={{ color: '#AEEA00', fontSize: '12px', fontWeight: '700', margin: 0 }}>{mes.count || ''}</p>
                <div style={{
                  width: '100%',
                  height: mes.count > 0 ? Math.max((mes.count / maxMes) * 120, 8) + 'px' : '4px',
                  backgroundColor: mes.count > 0 ? '#AEEA00' : '#2A2A2A',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s ease',
                }} />
                <p style={{ color: '#555555', fontSize: '11px', margin: 0, textAlign: 'center' }}>{mes.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuicao por plano */}
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ color: '#F0F0F0', fontSize: '15px', fontWeight: '600', margin: '0 0 24px' }}>Distribuicao por plano</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(data.porPlano).map(([plano, count]: [string, any]) => {
              const pct = Math.round((count / totalPlano) * 100)
              const cor = coresPlano[plano as keyof typeof coresPlano]
              const labels: Record<string, string> = { starter: 'Starter (Gratis)', pro: 'Pro (R$197/mes)', enterprise: 'Enterprise (R$497/mes)' }
              return (
                <div key={plano}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <p style={{ color: '#CCCCCC', fontSize: '13px', margin: 0 }}>{labels[plano]}</p>
                    <p style={{ color: cor, fontSize: '13px', fontWeight: '700', margin: 0 }}>{count} escolas ({pct}%)</p>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#2A2A2A', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', backgroundColor: cor, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Receita mensal */}
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#111111', borderRadius: '10px', border: '1px solid #2A2A2A' }}>
            <p style={{ color: '#888888', fontSize: '12px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receita Mensal Atual</p>
            <p style={{ color: '#AEEA00', fontSize: '24px', fontWeight: '800', margin: 0 }}>R$ {data.receitaMensal.toLocaleString('pt-BR')}</p>
            <p style={{ color: '#555555', fontSize: '12px', margin: '4px 0 0' }}>Previsao anual: R$ {(data.receitaMensal * 12).toLocaleString('pt-BR')}</p>
          </div>
        </div>

      </div>
    </div>
  )
}
