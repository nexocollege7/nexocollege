'use client'

import { useEffect, useState } from 'react'
import { getMasterStats } from '@/app/actions/master-actions'
import { Building2, Users, BookOpen, DollarSign, GraduationCap } from 'lucide-react'

export default function MasterDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getMasterStats()
      setStats(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
      <p style={{ color: '#888888' }}>Carregando...</p>
    </div>
  )

  const cards = [
    { label: 'Escolas Ativas', value: stats.totalEscolas, icon: Building2, iconColor: '#AEEA00', iconBg: '#1A2E00' },
    { label: 'Total de Alunos', value: stats.totalAlunos, icon: Users, iconColor: '#60A5FA', iconBg: '#1E3A5F' },
    { label: 'Total de Cursos', value: stats.totalCursos, icon: BookOpen, iconColor: '#FACC15', iconBg: '#2E2100' },
    { label: 'Receita da Plataforma', value: `R$ ${stats.receitaTotal.toFixed(2)}`, icon: DollarSign, iconColor: '#7C4DFF', iconBg: '#1E0E3F' },
    { label: 'Escolas com Módulo Mentor', value: stats.totalEscolasMentor, icon: GraduationCap, iconColor: '#FF8A65', iconBg: '#3F1F0E' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>{`
        @media (max-width: 1024px) { .master-stats-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 768px) { .master-stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .master-stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
          Painel Master
        </h1>
        <p style={{ color: '#888888', marginTop: '4px', fontSize: '14px' }}>
          Visão geral da plataforma NexoCollege
        </p>
      </div>

      {/* Cards */}
      <div className="master-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
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
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
                {card.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Badge master */}
      <div style={{
        backgroundColor: '#1A0E3F',
        border: '1px solid #7C4DFF',
        borderRadius: '12px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <span style={{ fontSize: '32px' }}>⚡</span>
        <div>
          <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '15px', margin: 0 }}>
            Você está no Painel Master
          </p>
          <p style={{ color: '#888888', fontSize: '13px', margin: '4px 0 0' }}>
            Aqui você gerencia todas as escolas, professores e métricas globais da plataforma.
          </p>
        </div>
      </div>
    </div>
  )
}