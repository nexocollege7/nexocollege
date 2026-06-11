'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMySchool() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('schools')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  return data
}

export async function updateSchool(formData: {
  name: string
  description: string
  primary_color: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('schools')
    .update({
      name: formData.name,
      description: formData.description,
      primary_color: formData.primary_color,
      updated_at: new Date().toISOString(),
    })
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/escola')
  return { success: true }
}

export async function createSchool(formData: {
  name: string
  description: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const slug = formData.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { error } = await supabase
    .from('schools')
    .insert({
      name: formData.name,
      description: formData.description,
      slug: `${slug}-${Date.now()}`,
      owner_id: user.id,
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/escola')
  return { success: true }
}

export async function saveMpToken(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('schools')
    .update({ mp_access_token: token })
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/escola')
  return { success: true }
}

export async function getMpTokenStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { hasToken: false }

  const { data } = await supabase
    .from('schools')
    .select('mp_access_token')
    .eq('owner_id', user.id)
    .single()

  return { hasToken: !!(data?.mp_access_token) }
}

// Retorna o limite de cursos conforme o plano
function getLimitePorPlano(plan: string): number {
  if (plan === 'pro') return 10
  if (plan === 'enterprise') return Infinity
  return 1 // starter
}

// Verifica se a escola pode criar mais um curso
export async function verificarLimiteCurso(schoolId: string): Promise<{
  permitido: boolean
  plano: string
  usados: number
  limite: number
  mensagem?: string
}> {
  const supabase = await createClient()

  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('plan')
    .eq('id', schoolId)
    .single()

  if (schoolError || !school) {
    return { permitido: false, plano: 'starter', usados: 0, limite: 1, mensagem: 'Escola não encontrada.' }
  }

  const { count, error: countError } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)

  if (countError) {
    return { permitido: false, plano: school.plan, usados: 0, limite: 1, mensagem: 'Erro ao contar cursos.' }
  }

  const usados = count ?? 0
  const limite = getLimitePorPlano(school.plan)
  const permitido = usados < limite

  return {
    permitido,
    plano: school.plan,
    usados,
    limite,
    mensagem: permitido
      ? undefined
      : `Seu plano ${school.plan} permite no máximo ${limite} curso(s). Faça upgrade para continuar.`
  }
}
