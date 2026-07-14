'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { verificarPermissao, type PlanFeature, type PermissaoPlano } from '@/lib/plan-permissions'

export async function getMySchool(schoolId?: string) {
  const adminClient = createAdminClient()

  if (schoolId) {
    const { data } = await adminClient
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single()
    return data
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

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

export async function verificarPermissaoFeature(feature: PlanFeature, schoolId?: string): Promise<PermissaoPlano> {
  const school = await getMySchool(schoolId)
  if (!school) return { allowed: false }
  return verificarPermissao(school, feature)
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

export async function savePixSettings(formData: {
  pix_key: string
  pix_holder_name: string
  whatsapp_contact: string
  pending_expiration_days: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }
  if (!user.email_confirmed_at) return { error: 'Confirme seu email antes de cadastrar formas de pagamento.' }

  const adminClient = createAdminClient()

  const { data: school } = await adminClient
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!school) return { error: 'Escola não encontrada' }

  const { error } = await adminClient
    .from('schools')
    .update({
      pix_key: formData.pix_key.trim() || null,
      pix_holder_name: formData.pix_holder_name.trim() || null,
      whatsapp_contact: formData.whatsapp_contact.trim() || null,
      pending_expiration_days: formData.pending_expiration_days,
      updated_at: new Date().toISOString(),
    })
    .eq('id', school.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/escola')
  return { success: true }
}

export async function updateLiveStatus(liveUrl: string, liveActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  if (liveActive && !liveUrl.trim()) {
    return { error: 'Cole o link da transmissão antes de iniciar' }
  }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { error: 'Escola nao encontrada' }

  if (liveActive) {
    const { data: school } = await adminClient
      .from('schools')
      .select('plan')
      .eq('id', profile.school_id)
      .single()

    const permissao = await verificarPermissao({ plan: school?.plan ?? null }, 'live_events')
    if (!permissao.allowed) {
      return { error: 'Eventos ao vivo não disponíveis no seu plano. Faça upgrade para continuar.' }
    }
  }

  const { error } = await adminClient
    .from('schools')
    .update({
      live_url: liveUrl.trim(),
      live_active: liveActive,
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

  // Limite de 3 escolas por IP
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? headersList.get('x-real-ip')
    ?? null

  if (ip) {
    const { count } = await adminClient
      .from('schools')
      .select('*', { count: 'exact', head: true })
      .eq('registration_ip', ip)

    if ((count ?? 0) >= 3) {
      return { error: 'Limite de cadastros atingido para este endereço.' }
    }
  }

  // 1. Cria a escola com owner_id preenchido
  const { data: school, error } = await adminClient
    .from('schools')
    .insert({
      name: formData.name,
      description: formData.description,
      slug: `${slug}-${Date.now()}`,
      owner_id: user.id,
      registration_ip: ip,
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
  if (!user.email_confirmed_at) return { error: 'Confirme seu email antes de cadastrar formas de pagamento.' }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { error: 'Escola nao encontrada' }

  const updateData: { mp_access_token: string; mp_public_key?: string } = { mp_access_token: token }
  if (publicKey) updateData.mp_public_key = publicKey

  const { error } = await adminClient
    .from('schools')
    .update(updateData)
    .eq('id', profile.school_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/escola')
  return { success: true }
}

export async function getMpTokenStatus(schoolId?: string) {
  const adminClient = createAdminClient()

  if (schoolId) {
    const { data } = await adminClient
      .from('schools')
      .select('mp_access_token, mp_public_key')
      .eq('id', schoolId)
      .single()
    return {
      hasToken: !!(data?.mp_access_token),
      hasPublicKey: !!(data?.mp_public_key),
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { hasToken: false, hasPublicKey: false }

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
    hasPublicKey: !!(data?.mp_public_key),
  }
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

  const { data: planRow } = await supabase
    .from('plans')
    .select('max_courses')
    .eq('slug', school.plan ?? 'starter')
    .maybeSingle()

  const usados = count ?? 0
  const limite = planRow?.max_courses ?? 1
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

  // Registrar domínio no Vercel automaticamente
  if (cleanDomain) {
    try {
      const vercelToken = process.env.VERCEL_API_TOKEN
      const vercelProjectId = process.env.VERCEL_PROJECT_ID
      if (vercelToken && vercelProjectId) {
        await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/domains`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: cleanDomain }),
        })
      }
    } catch (e) {
      console.error('[saveCustomDomain] Vercel API error:', e)
      // Não bloqueia o fluxo — domínio foi salvo no banco
    }
  }

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

// ─── LIVE NATIVA (Daily.co) ────────────────────────────────────────────────

export async function startNativeLive(payload: {
  visibility: 'public' | 'restricted'
  courseIds: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { error: 'Escola não encontrada' }

  const { data: school } = await adminClient
    .from('schools')
    .select('plan')
    .eq('id', profile.school_id)
    .single()

  const permissao = await verificarPermissao({ plan: school?.plan ?? null }, 'live_native')
  if (!permissao.allowed) {
    return { error: 'Live nativa disponível apenas no plano Scale ou superior.' }
  }

  // Criar room no Daily.co
  const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer \${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      privacy: 'private',
      properties: {
        enable_chat: false,
        enable_screenshare: false,
        start_video_off: false,
        start_audio_off: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8 horas
      },
    }),
  })

  if (!dailyRes.ok) {
    return { error: 'Erro ao criar sala de transmissão. Tente novamente.' }
  }

  const dailyRoom = await dailyRes.json()

  // Encerrar live anterior se existir
  await adminClient
    .from('live_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('school_id', profile.school_id)
    .eq('status', 'live')

  // Criar nova sessão
  const { data: session, error: sessionError } = await adminClient
    .from('live_sessions')
    .insert({
      school_id: profile.school_id,
      daily_room_url: dailyRoom.url,
      daily_room_name: dailyRoom.name,
      status: 'live',
      live_type: 'native',
      visibility: payload.visibility,
    })
    .select()
    .single()

  if (sessionError || !session) return { error: 'Erro ao iniciar sessão.' }

  // Vincular cursos se restrito
  if (payload.visibility === 'restricted' && payload.courseIds.length > 0) {
    await adminClient
      .from('live_session_courses')
      .insert(payload.courseIds.map((courseId) => ({
        live_session_id: session.id,
        course_id: courseId,
      })))
  }

  // Gerar token do professor (owner)
  const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer \${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: dailyRoom.name,
        is_owner: true,
        user_name: 'Professor',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      },
    }),
  })

  const tokenData = await tokenRes.json()

  revalidatePath('/dashboard/ao-vivo')
  return {
    success: true,
    sessionId: session.id,
    roomUrl: dailyRoom.url,
    token: tokenData.token,
  }
}

export async function endNativeLive(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { error: 'Escola não encontrada' }

  // Encerrar sessão
  const { error } = await adminClient
    .from('live_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('school_id', profile.school_id)

  if (error) return { error: error.message }

  // Deletar comentários temporários
  await adminClient
    .from('live_comments')
    .delete()
    .eq('live_session_id', sessionId)

  revalidatePath('/dashboard/ao-vivo')
  return { success: true }
}

export async function sendLiveComment(payload: {
  sessionId: string
  message: string
  userName: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  if (!payload.message.trim() || payload.message.length > 500) {
    return { error: 'Mensagem inválida' }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('live_comments')
    .insert({
      live_session_id: payload.sessionId,
      user_id: user.id,
      user_name: payload.userName,
      message: payload.message.trim(),
    })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getActiveLiveSession(schoolId: string) {
  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .from('live_sessions')
    .select('id, daily_room_url, daily_room_name, status, live_type, visibility')
    .eq('school_id', schoolId)
    .eq('status', 'live')
    .single()

  return session ?? null
}

export async function generateViewerToken(roomName: string, userName: string) {
  const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer \${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: false,
        user_name: userName,
        start_video_off: true,
        start_audio_off: true,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      },
    }),
  })

  const tokenData = await tokenRes.json()
  return tokenData.token as string
}
