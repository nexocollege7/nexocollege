import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AvaliacoesAdmin } from './avaliacoes-admin'

export default async function AvaliacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role === 'student' || profile?.role === 'mentor_guest') redirect('/dashboard')

  return <AvaliacoesAdmin />
}
