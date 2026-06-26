import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getPendingDocuments } from '@/app/actions/legal-actions'
import { AceitarTermosClient } from './aceitar-client'

export default async function AceitarTermosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('users')
    .select('role, school_id')
    .eq('id', user.id)
    .single()

  // Usuário sem profile = foi deletado (escola excluída) — encerrar sessão
  if (!profile) redirect('/auth/signout?msg=escola-excluida')

  // Não-student com school_id definido: verificar se a escola ainda existe
  if (profile.role !== 'student' && profile.school_id) {
    const { data: escola } = await adminClient
      .from('schools')
      .select('id')
      .eq('id', profile.school_id)
      .single()
    if (!escola) redirect('/auth/signout?msg=escola-excluida')
  }

  const role = profile.role === 'student' ? 'student' : 'school'
  const pendingDocs = await getPendingDocuments(user.id, role)

  // Se não há documentos pendentes, redirecionar para o dashboard
  if (pendingDocs.length === 0) redirect('/dashboard')

  return <AceitarTermosClient docs={pendingDocs} />
}
