import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/layout/admin-layout'
import { getPendingDocuments } from '@/app/actions/legal-actions'
import { unstable_cache } from 'next/cache'

const getLayoutData = (userId: string) =>
  unstable_cache(
    async () => {
      const adminClient = createAdminClient()

      const { data: profile } = await adminClient
        .from('users')
        .select('role, full_name, avatar_url, school_id')
        .eq('id', userId)
        .single()

      let schoolName: string | null = null
      let schoolLogoUrl: string | null = null
      let schoolSlug: string | null = null
      let schoolPlan: string | null = null

      if (profile?.school_id) {
        const { data: school } = await adminClient
          .from('schools')
          .select('name, logo_url, slug, plan')
          .eq('id', profile.school_id)
          .single()
        schoolName = school?.name ?? null
        schoolLogoUrl = school?.logo_url ?? null
        schoolSlug = school?.slug ?? null
        schoolPlan = school?.plan ?? null
      }

      return { profile, schoolName, schoolLogoUrl, schoolSlug, schoolPlan }
    },
    [`layout-data-${userId}`],
    { revalidate: 300, tags: [`user-${userId}`] }
  )()

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
  const masterEmail = process.env.MASTER_EMAIL
  if (user.email === masterEmail) {
    redirect('/master')
  }

  const { profile, schoolName, schoolLogoUrl, schoolSlug, schoolPlan } = await getLayoutData(user.id)

  // Usuário sem profile = foi deletado (escola excluída) — encerrar sessão
  if (!profile) redirect('/auth/signout?msg=escola-excluida')

  // Não-student com school_id definido mas escola não existe mais — encerrar sessão
  if (profile.role !== 'student' && profile.school_id && !schoolName) {
    redirect('/auth/signout?msg=escola-excluida')
  }

  const role = profile.role || 'student'
  const docRole = role === 'student' ? 'student' : 'school'
  const pendingDocs = await getPendingDocuments(user.id, docRole)
  if (pendingDocs.length > 0) {
    redirect('/aceitar-termos')
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
        school_plan: schoolPlan,
      }}
    >
      {children}
    </AdminLayout>
  )
}
