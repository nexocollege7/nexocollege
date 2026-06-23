'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { getAnalyticsCompleto } from '@/app/actions/analytics-actions'

const VendasChart = dynamic(() => import('./vendas-chart'), {
  ssr: false,
  loading: () => <p style={{ color: '#555555', fontSize: '13px' }}>Carregando gráfico...</p>,
})

type Analytics = Awaited<ReturnType<typeof getAnalyticsCompleto>>

function formatBRL(valor: number): string {
  return `R$ ${valor.toFixed(2)}`
}

export default function AnalyticsSection({ corEscola }: { corEscola: string }) {
  const [periodo, setPeriodo] = useState<30 | 60 | 90>(30)
  const [dados, setDados] = useState<Analytics>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getAnalyticsCompleto(periodo).then((d) => {
      setDados(d)
      setLoading(false)
    })
  }, [periodo])

  if (loading && !dados) {
    return (
      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#555555', fontSize: '13px', margin: 0 }}>Carregando analytics...</p>
      </div>
    )
  }

  if (!dados) return null

  const kpis = [
    { label: 'Alunos com acesso ativo', value: dados.totalAlunosAtivos, color: '#60A5FA' },
    { label: 'Receita total', value: formatBRL(dados.receitaTotal), color: corEscola },
    { label: 'Cursos publicados', value: dados.totalCursosPublicados, color: '#7C4DFF' },
    { label: 'Taxa média de conclusão', value: `${dados.taxaMediaConclusao}%`, color: '#FACC15' },
  ]

  const totalMatriculas = dados.totalMatriculasAtivas + dados.totalMatriculasExpiradas
  const pctAtivas = totalMatriculas > 0 ? Math.round((dados.totalMatriculasAtivas / totalMatriculas) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ color: '#888888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
        📊 Analytics Gerencial
      </h2>

      {/* KPIs principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="cards-grid">
        {kpis.map((k) => (
          <div key={k.label} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '18px 20px' }}>
            <p style={{ color: '#888888', fontSize: '12px', margin: '0 0 8px' }}>{k.label}</p>
            <p style={{ fontSize: '24px', fontWeight: '700', color: k.color, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Cards secundários */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="matriculas-grid">
        {/* Receita por curso */}
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600', margin: '0 0 14px' }}>Receita por curso</h3>
          {dados.receitaPorCurso.length === 0 ? (
            <p style={{ color: '#555555', fontSize: '13px', margin: 0 }}>Nenhuma venda registrada ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dados.receitaPorCurso.map((c) => (
                <div key={c.courseId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#CCCCCC', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.titulo}</span>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: '#AEEA00', fontSize: '13px', fontWeight: '700', margin: 0 }}>{formatBRL(c.receita)}</p>
                    <p style={{ color: '#555555', fontSize: '11px', margin: 0 }}>Ticket médio: {formatBRL(c.ticketMedio)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mais inscritos */}
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600', margin: '0 0 14px' }}>Top 5 — mais inscritos</h3>
          {dados.maisInscritos.length === 0 ? (
            <p style={{ color: '#555555', fontSize: '13px', margin: 0 }}>Sem matrículas ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dados.maisInscritos.map((c, i) => (
                <div key={c.courseId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#CCCCCC', fontSize: '13px' }}>{i + 1}. {c.titulo}</span>
                  <span style={{ color: '#60A5FA', fontSize: '13px', fontWeight: '700' }}>{c.qtd}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maior conclusão */}
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600', margin: '0 0 14px' }}>Top 5 — maior taxa de conclusão</h3>
          {dados.maiorConclusao.length === 0 ? (
            <p style={{ color: '#555555', fontSize: '13px', margin: 0 }}>Sem matrículas ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dados.maiorConclusao.map((c, i) => (
                <div key={c.courseId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#CCCCCC', fontSize: '13px' }}>{i + 1}. {c.titulo}</span>
                  <span style={{ color: '#FACC15', fontSize: '13px', fontWeight: '700' }}>{c.taxa}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ativos vs expirados */}
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600', margin: '0 0 14px' }}>Matrículas ativas vs expiradas</h3>
          {totalMatriculas === 0 ? (
            <p style={{ color: '#555555', fontSize: '13px', margin: 0 }}>Sem matrículas ainda.</p>
          ) : (
            <>
              <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#2A2A2A' }}>
                <div style={{ width: `${pctAtivas}%`, backgroundColor: '#AEEA00' }} />
                <div style={{ width: `${100 - pctAtivas}%`, backgroundColor: '#FF4444' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ color: '#AEEA00', fontSize: '12px' }}>● Ativas: {dados.totalMatriculasAtivas}</span>
                <span style={{ color: '#FF4444', fontSize: '12px' }}>● Expiradas: {dados.totalMatriculasExpiradas}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gráfico de vendas */}
      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600', margin: 0 }}>Vendas no período</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[30, 60, 90].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p as 30 | 60 | 90)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                  border: periodo === p ? `1px solid ${corEscola}` : '1px solid #2A2A2A',
                  backgroundColor: periodo === p ? 'rgba(174,234,0,0.08)' : 'transparent',
                  color: periodo === p ? corEscola : '#888888',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {p}d
              </button>
            ))}
          </div>
        </div>
        <div style={{ width: '100%', height: '240px' }}>
          <VendasChart data={dados.grafico} periodo={periodo} corEscola={corEscola} />
        </div>
      </div>
    </div>
  )
}
