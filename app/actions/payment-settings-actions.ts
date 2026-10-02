'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// Salva quais formas de pagamento a escola oferece aos alunos.
// Regras: só o dono da escola altera; pelo menos uma forma ativa;
// Mercado Pago exige credenciais salvas; PIX manual exige chave salva.
export async function savePaymentMethods(input: { mpEnabled: boolean; pixEnabled: boolean }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { error: 'Escola não encontrada' }
  if (profile.role !== 'admin' && profile.role !== 'owner') {
    return { error: 'Apenas o dono da escola pode alterar as formas de pagamento' }
  }

  const mp = input.mpEnabled === true
  const pix = input.pixEnabled === true
  if (!mp && !pix) return { error: 'Mantenha pelo menos uma forma de pagamento ativa' }

  const { data: school } = await adminClient
    .from('schools')
    .select('slug, mp_access_token, pix_key')
    .eq('id', profile.school_id)
    .single()

  if (!school) return { error: 'Escola não encontrada' }
  if (mp && !school.mp_access_token) return { error: 'Salve as credenciais do Mercado Pago antes de ativá-lo' }
  if (pix && !school.pix_key) return { error: 'Salve a chave PIX antes de ativar o pagamento manual' }

  const { error } = await adminClient
    .from('schools')
    .update({ payment_mp_enabled: mp, payment_pix_enabled: pix })
    .eq('id', profile.school_id)

  if (error) return { error: 'Erro ao salvar: ' + error.message }

  revalidatePath('/dashboard/escola')
  if (school.slug) revalidatePath(`/vitrine/${school.slug}`, 'layout')
  return { success: true }
}
