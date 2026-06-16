'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// Busca escola pelo school_id do perfil do usuário
export async function getMySchool() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  const { data } = await adminClient
    .from('schools')
    .select('*')
    .eq('id', profile.school_id)
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
  if (!user) return { error: 'Nao autenticado' }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { error: 'Escola nao encontrada' }

  const { error } = await adminClient
    .from('schools')
    .update({
      name: formData.name,
      description: formData.description,
      primary_color: formData.primary_color,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.school_id)

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
  if (!user) return { error: 'Nao autenticado' }

  const slug = formData.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const adminClient = createAdminClient()

  // 1. Cria a escola com owner_id preenchido
  const { data: school, error } = await adminClient
    .from('schools')
    .insert({
      name: formData.name,
      description: formData.description,
      slug: `${slug}-${Date.now()}`,
      owner_id: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // 2. Atualiza o school_id no perfil do usuário
  const { error: profileError } = await adminClient
    .from('users')
    .update({ school_id: school.id })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  revalidatePath('/dashboard/escola')
  return { success: true }
}

export async function saveMpToken(token: string, publicKey?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { error: 'Escola nao encontrada' }

  const updateData: any = { mp_access_token: token }
  if (publicKey) updateData.mp_public_key = publicKey

  const { error } = await adminClient
    .from('schools')
    .update(updateData)
    .eq('id', profile.school_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/escola')
  return { success: true }
}

export async function getMpTokenStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { hasToken: false, hasPublicKey: false }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { hasToken: false, hasPublicKey: false }

  const { data } = await adminClient
    .from('schools')
    .select('mp_access_token, mp_public_key')
    .eq('id', profile.school_id)
    .single()

  return { 
    hasToken: !!(data?.mp_access_token),
    hasPublicKey: !!(data?.mp_public_key)
  }
}

function getLimitePorPlano(plan: string): number {
  if (plan === 'creator') return 5
  if (plan === 'pro') return 10
  if (plan === 'scale') return 25
  if (plan === 'enterprise') return Infinity
  return 1 // starter
}

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
    return { permitido: false, plano: 'starter', usados: 0, limite: 1, mensagem: 'Escola nao encontrada.' }
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
      : `Seu plano ${school.plan} permite no maximo ${limite} curso(s). Faca upgrade para continuar.`
  }
}

export async function updateMyName(fullName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('users')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function getMyName() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return data?.full_name || ''
}

export async function saveCustomDomain(domain: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { error: 'Escola nao encontrada' }

  const cleanDomain = domain
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')

  const { error } = await adminClient
    .from('schools')
    .update({ custom_domain: cleanDomain || null })
    .eq('id', profile.school_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/escola')
  return { success: true, domain: cleanDomain }
}

export async function updateSchoolLogoUrl(logoUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { error: 'Escola nao encontrada' }

  const { error } = await adminClient
    .from('schools')
    .update({ logo_url: logoUrl })
    .eq('id', profile.school_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/escola')
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function ensureSchoolLogosBucket() {
  const admin = createAdminClient()
  const { data: bucket } = await admin.storage.getBucket('school-logos')
  if (!bucket) {
    await admin.storage.createBucket('school-logos', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    })
  }
}

export async function saveOwnerContact(ownerName: string, ownerPhone: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { error: 'Escola nao encontrada' }

  const { error } = await adminClient
    .from('schools')
    .update({
      owner_name: ownerName,
      owner_phone: ownerPhone,
    })
    .eq('id', profile.school_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/escola')
  return { success: true }
}
