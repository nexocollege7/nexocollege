import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CertificadosAluno } from './certificados-aluno'
import { CertificadosAdmin } from './certificados-admin'

export default async function CertificadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = profile?.role || 'student'

  if (role === 'student') return <CertificadosAluno />
  return <CertificadosAdmin />
}
