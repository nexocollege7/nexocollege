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
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Carregando dashboard...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-white font-semibold">Bem-vindo ao NexoCollege!</p>
          <p className="text-gray-400 text-sm mt-1">Configure sua escola para começar.</p>
        </div>
      </div>
    )
  }

  const cards = [
    { label: 'Alunos Ativos', value: stats.totalAlunos, icon: Users, color: 'text-blue-400', bg: 'bg-blue-900' },
    { label: 'Cursos', value: stats.totalCursos, icon: BookOpen, color: 'text-green-400', bg: 'bg-green-900' },
    { label: 'Certificados', value: stats.totalCertificados, icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-900' },
    { label: 'Receita Total', value: `R$ ${stats.receita.toFixed(2)}`, icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-900' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Visão geral da sua escola</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-sm">{card.label}</p>
                <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matrículas recentes */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <h2 className="text-white font-semibold text-sm">Matrículas Recentes</h2>
          </div>
          {stats.matriculasRecentes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Nenhuma matrícula ainda</p>
          ) : (
            <div className="space-y-3">
              {stats.matriculasRecentes.map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{m.users?.full_name || 'Aluno'}</p>
                    <p className="text-gray-400 text-xs">{m.courses?.title}</p>
                  </div>
                  <p className="text-gray-500 text-xs">
                    {new Date(m.enrolled_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos pagamentos */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-purple-400" />
            <h2 className="text-white font-semibold text-sm">Últimos Pagamentos</h2>
          </div>
          {stats.pagamentos.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Nenhum pagamento ainda</p>
          ) : (
            <div className="space-y-3">
              {stats.pagamentos.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <p className="text-white text-sm">Aprovado</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">R$ {Number(p.amount).toFixed(2)}</p>
                    <p className="text-gray-500 text-xs">
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
