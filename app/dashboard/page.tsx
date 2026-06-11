import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/layout/admin-layout'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AdminLayout
      user={{ email: user.email || '', role: 'owner' }}
      title="Dashboard"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Total de Alunos</p>
          <p className="text-3xl font-bold text-white">0</p>
          <p className="text-gray-500 text-xs mt-1">Nenhum aluno ainda</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Cursos Ativos</p>
          <p className="text-3xl font-bold text-white">0</p>
          <p className="text-gray-500 text-xs mt-1">Nenhum curso ainda</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Receita Total</p>
          <p className="text-3xl font-bold text-white">R$ 0</p>
          <p className="text-gray-500 text-xs mt-1">Nenhuma venda ainda</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Certificados</p>
          <p className="text-3xl font-bold text-white">0</p>
          <p className="text-gray-500 text-xs mt-1">Nenhum emitido ainda</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">
          Bem-vindo ao NexoCollege! 🎉
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Sua plataforma está configurada e pronta para crescer.
          Nas próximas sprints vamos adicionar cursos, alunos, pagamentos e muito mais.
        </p>
        <div className="mt-4 flex gap-3">
          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg px-4 py-2">
            <p className="text-blue-400 text-xs font-medium">Sprint 3 em andamento</p>
            <p className="text-white text-sm font-semibold">Layout Base</p>
          </div>
          <div className="bg-gray-800 rounded-lg px-4 py-2">
            <p className="text-gray-500 text-xs font-medium">Próxima sprint</p>
            <p className="text-gray-300 text-sm font-semibold">Banco de Dados</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
