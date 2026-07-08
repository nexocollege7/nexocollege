'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { verificarPermissao } from '@/lib/plan-permissions'

export async function getMyMentorshipAsGuest() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: mentorship } = await supabase
    .from('mentorships')
    .select('*')
    .eq('mentor_id', user.id)
    .maybeSingle()

  if (!mentorship) return null

  const [{ data: classes }, { data: cohorts }] = await Promise.all([
    supabase
      .from('mentorship_classes')
      .select('*')
      .eq('mentorship_id', mentorship.id)
      .order('position', { ascending: true }),
    supabase
      .from('mentorship_cohorts')
      .select('*')
      .eq('mentorship_id', mentorship.id)
      .order('created_at', { ascending: false }),
  ])

  const adminClient = createAdminClient()
  const { data: school } = await adminClient
    .from('schools')
    .select('name, logo_url, primary_color')
    .eq('id', mentorship.school_id)
    .single()

  const hasOpenCohort = (cohorts || []).some((c) => c.status === 'open')

  return {
    ...mentorship,
    school,
    classes: classes || [],
    cohorts: cohorts || [],
    hasOpenCohort,
  }
}

export async function getMyMentorshipsAsGuest() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: mentorships } = await supabase
    .from('mentorships')
    .select('*')
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false })

  if (!mentorships || mentorships.length === 0) return []

  const adminClient = createAdminClient()

  return Promise.all(
    mentorships.map(async (mentorship) => {
      const [{ data: classes }, { data: cohorts }, { data: school }] = await Promise.all([
        supabase
          .from('mentorship_classes')
          .select('*')
          .eq('mentorship_id', mentorship.id)
          .order('position', { ascending: true }),
        supabase
          .from('mentorship_cohorts')
          .select('*')
          .eq('mentorship_id', mentorship.id)
          .order('created_at', { ascending: false }),
        adminClient
          .from('schools')
          .select('name, logo_url, primary_color')
          .eq('id', mentorship.school_id)
          .single(),
      ])

      const hasOpenCohort = (cohorts || []).some((c) => c.status === 'open')

      return {
        ...mentorship,
        school,
        classes: classes || [],
        cohorts: cohorts || [],
        hasOpenCohort,
      }
    })
  )
}

export async function updateClassMaterialsAsGuest(classId: string, materialsUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: classRow } = await supabase
    .from('mentorship_classes')
    .select('mentorship_id')
    .eq('id', classId)
    .single()

  if (!classRow) return { error: 'Aula não encontrada' }

  const { data: mentorship } = await supabase
    .from('mentorships')
    .select('mentor_id')
    .eq('id', classRow.mentorship_id)
    .single()

  if (!mentorship || mentorship.mentor_id !== user.id) return { error: 'Acesso negado' }

  const { data: cohorts } = await supabase
    .from('mentorship_cohorts')
    .select('status')
    .eq('mentorship_id', classRow.mentorship_id)

  const temTurmaAberta = (cohorts || []).some((c) => c.status === 'open')
  if (!temTurmaAberta) {
    return { error: 'Sua turma foi encerrada. Não é mais possível editar materiais.' }
  }

  const { error } = await supabase
    .from('mentorship_classes')
    .update({ materials_url: materialsUrl.trim() || null })
    .eq('id', classId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/minha-mentoria')
  return { success: true }
}

export async function updateCohortLiveAsGuest(cohortId: string, formData: {
  liveUrl: string
  liveActive: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: cohort } = await supabase
    .from('mentorship_cohorts')
    .select('status, mentorship_id')
    .eq('id', cohortId)
    .single()

  if (!cohort) return { error: 'Turma não encontrada' }
  if (cohort.status !== 'open') return { error: 'Esta turma está encerrada.' }

  const { data: mentorship } = await supabase
    .from('mentorships')
    .select('mentor_id, school_id')
    .eq('id', cohort.mentorship_id)
    .single()

  if (!mentorship || mentorship.mentor_id !== user.id) return { error: 'Acesso negado' }

  if (formData.liveActive && !formData.liveUrl.trim()) {
    return { error: 'Cole o link da transmissão antes de iniciar' }
  }

  if (formData.liveActive) {
    const adminClient = createAdminClient()
    const { data: school } = await adminClient
      .from('schools')
      .select('plan')
      .eq('id', mentorship.school_id)
      .single()

    const permissao = await verificarPermissao({ plan: school?.plan ?? null }, 'live_events')
    if (!permissao.allowed) {
      return { error: 'Eventos ao vivo não disponíveis no plano desta escola.' }
    }
  }

  const { error } = await supabase
    .from('mentorship_cohorts')
    .update({ live_url: formData.liveUrl.trim(), live_active: formData.liveActive })
    .eq('id', cohortId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/minha-mentoria')
  return { success: true }
}
