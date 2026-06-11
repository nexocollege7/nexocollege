'use client'

import { useEffect, useState } from 'react'
import { getDashboardStats } from '@/app/actions/analytics-actions'
import { Users, BookOpen, Award, DollarSign, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getDashboardStats()
      setStats(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <p style={{ color: '#888888' }}>Carregando dashboard...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#F0F0F0', fontWeight: '600' }}>Bem-vindo ao NexoCollege!</p>
          <p style={{ color: '#888888', fontSize: '14px', marginTop: '4px' }}>Configure sua escola para começar.</p>
        </div>
      </div>
    )
  }

  const cards = [
    { label: 'Alunos Ativos', value: stats.totalAlunos, icon: Users, iconColor: '#60A5FA', iconBg: '#1E3A5F' },
    { label: 'Cursos', value: stats.totalCursos, icon: BookOpen, iconColor: '#AEEA00', iconBg: '#1A2E00' },
    { label: 'Certificados', value: stats.totalCertificados, icon: Award, iconColor: '#FACC15', iconBg: '#2E2100' },
    { label: 'Receita Total', value: `R$ ${stats.receita.toFixed(2)}`, icon: DollarSign, iconColor: '#7C4DFF', iconBg: '#1E0E3F' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#888888', marginTop: '4px', fontSize: '14px' }}>Visão geral da sua escola</p>
      </div>

      {/* Cards de métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #2A2A2A',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>{card.label}</p>
                <div style={{
                  width: '36px', height: '36px',
                  backgroundColor: card.iconBg,
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} color={card.iconColor} />
                </div>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>{card.value}</p>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Matrículas recentes */}
        <div style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={16} color="#AEEA00" />
            <h2 style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '14px', margin: 0 }}>Matrículas Recentes</h2>
          </div>
          {stats.matriculasRecentes.length === 0 ? (
            <p style={{ color: '#555555', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>Nenhuma matrícula ainda</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.matriculasRecentes.map((m: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '500', margin: 0 }}>{m.users?.full_name || 'Aluno'}</p>
                    <p style={{ color: '#888888', fontSize: '12px', margin: 0 }}>{m.courses?.title}</p>
                  </div>
                  <p style={{ color: '#555555', fontSize: '12px' }}>
                    {new Date(m.enrolled_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos pagamentos */}
        <div style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <DollarSign size={16} color="#7C4DFF" />
            <h2 style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '14px', margin: 0 }}>Últimos Pagamentos</h2>
          </div>
          {stats.pagamentos.length === 0 ? (
            <p style={{ color: '#555555', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>Nenhum pagamento ainda</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.pagamentos.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#AEEA00', borderRadius: '50%' }} />
                    <p style={{ color: '#F0F0F0', fontSize: '14px', margin: 0 }}>Aprovado</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '500', margin: 0 }}>R$ {Number(p.amount).toFixed(2)}</p>
                    <p style={{ color: '#555555', fontSize: '12px', margin: 0 }}>
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}