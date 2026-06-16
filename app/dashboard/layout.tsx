import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/layout/admin-layout'
import { getPendingDocuments } from '@/app/actions/legal-actions'

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
    .select('role, full_name, avatar_url, school_id')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'student'

  // Verificar se há documentos LGPD pendentes de aceite
  // Usa mesma lógica de aceitar-termos/page.tsx: null/desconhecido = 'school'
  const docRole = profile?.role === 'student' ? 'student' : 'school'
  const pendingDocs = await getPendingDocuments(user.id, docRole)
  if (pendingDocs.length > 0) {
    redirect('/aceitar-termos')
  }

  // Busca dados da escola para exibir logo no dashboard
  let schoolName: string | null = null
  let schoolLogoUrl: string | null = null
  let schoolSlug: string | null = null
  if (profile?.school_id) {
    const { data: school } = await adminClient
      .from('schools')
      .select('name, logo_url, slug')
      .eq('id', profile.school_id)
      .single()
    schoolName = school?.name ?? null
    schoolLogoUrl = school?.logo_url ?? null
    schoolSlug = school?.slug ?? null
  }

  return (
    <AdminLayout
      user={{
        email: user.email ?? '',
        role: role,
        full_name: profile?.full_name ?? '',
        avatar_url: profile?.avatar_url ?? null,
        school_name: schoolName,
        school_logo_url: schoolLogoUrl,
        school_slug: schoolSlug,
      }}
    >
      {children}
    </AdminLayout>
  )
}
