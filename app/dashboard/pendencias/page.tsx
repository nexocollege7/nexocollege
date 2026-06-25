import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPendingEnrollmentsBySchool } from '@/lib/pending-enrollments'
import { PendenciasAdmin } from './pendencias-admin'

export default async function PendenciasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  console.log('[pendencias] user.id:', user.id)

  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id, whatsapp_contact')
    .eq('owner_id', user.id)
    .single()
    .returns<{ id: string; whatsapp_contact: string | null }>()

  console.log('[pendencias] school result:', school, 'error:', schoolError)

  if (!school) redirect('/dashboard')

  const pendencias = await getPendingEnrollmentsBySchool(school.id)
  console.log('[pendencias] count:', pendencias.length, 'school.id:', school.id)

  const aguardandoLiberacao = pendencias.filter((p) => p.status === 'awaiting_release')
  const aguardandoPagamento = pendencias.filter((p) => p.status === 'awaiting_payment')

  return (
    <PendenciasAdmin
      aguardandoLiberacaoInicial={aguardandoLiberacao}
      aguardandoPagamentoInicial={aguardandoPagamento}
      whatsappContact={school.whatsapp_contact}
    />
  )
}
