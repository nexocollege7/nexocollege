import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Bem-vindo ao NexoCollege! 🎉
        </h1>
        <p className="text-gray-400 mb-2">
          Você está logado como:
        </p>
        <p className="text-blue-400 font-medium text-lg">
          {user.email}
        </p>
        <p className="text-gray-500 text-sm mt-6">
          Dashboard em construção — Sprint 5
        </p>
      </div>
    </div>
  )
}
