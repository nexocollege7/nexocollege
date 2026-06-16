import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/layout/admin-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Master vai direto para /master
  const masterEmail = process.env.NEXT_PUBLIC_MASTER_EMAIL
  if (user.email === masterEmail) {
    redirect('/master')
  }

  // Busca o perfil real do banco
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('users')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'student'

  return (
    <AdminLayout
      user={{
        email: user.email ?? '',
        role: role,
        full_name: profile?.full_name ?? '',
        avatar_url: profile?.avatar_url ?? null,
      }}
    >
      {children}
    </AdminLayout>
  )
}
