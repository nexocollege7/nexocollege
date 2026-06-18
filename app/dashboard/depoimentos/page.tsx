import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DepoimentosAdmin } from './depoimentos-admin'
import { verificarPermissao } from '@/lib/plan-permissions'
import { PlanLock } from '@/components/PlanLock'

export default async function DepoimentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role, school_id').eq('id', user.id).single()
  if (profile?.role === 'student') redirect('/dashboard')

  let schoolId = profile?.school_id ?? null
  if (!schoolId) {
    const { data: ownedSchool } = await supabase.from('schools').select('id').eq('owner_id', user.id).maybeSingle()
    schoolId = ownedSchool?.id ?? null
  }

  const { data: school } = schoolId
    ? await supabase.from('schools').select('plan').eq('id', schoolId).single()
    : { data: null }

  const permissao = await verificarPermissao({ plan: school?.plan ?? null }, 'reviews')
  if (!permissao.allowed) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto' }}>
        <PlanLock upgradeRequired={permissao.upgradeRequired} />
      </div>
    )
  }

  return <DepoimentosAdmin />
}
