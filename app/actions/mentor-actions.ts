'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { verificarPermissao } from '@/lib/plan-permissions'

async function getSchoolId(userId: string) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', userId)
    .single()

  if (error) console.error('getSchoolId error:', error.message)
  return data?.school_id || null
}

export async function getMyMentorships() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return []

  const { data } = await supabase
    .from('mentorships')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  return data || []
}

export async function getMentorship(id: string) {
  const supabase = await createClient()

  const { data: mentorship } = await supabase
    .from('mentorships')
    .select('*')
    .eq('id', id)
    .single()

  if (!mentorship) return null

  const { data: classes } = await supabase
    .from('mentorship_classes')
    .select('*')
    .eq('mentorship_id', id)
    .order('position', { ascending: true })

  return { ...mentorship, classes: classes || [] }
}

export async function getSchoolTeamMembers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return []

  const { data } = await supabase
    .from('users')
    .select('id, full_name, role')
    .eq('school_id', schoolId)
    .in('role', ['admin', 'collaborator'])
    .order('role', { ascending: true })

  return data || []
}

export async function createMentorship(formData: {
  title: string
  description: string
  price: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return { error: 'Escola não encontrada. Crie sua escola primeiro.' }

  const { data: school } = await supabase
    .from('schools')
    .select('mentor_module')
    .eq('id', schoolId)
    .single()

  if (!school?.mentor_module) {
    return { error: 'Módulo Mentor não está ativo nesta escola.' }
  }

  const slug = formData.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { data, error } = await supabase
    .from('mentorships')
    .insert({
      school_id: schoolId,
      title: formData.title,
      description: formData.description,
      price: formData.price || 0,
      slug: `${slug}-${Date.now()}`,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/mentorias')
  return { success: true, id: data.id }
}

export async function updateMentorship(id: string, formData: {
  title: string
  description: string
  price: number
  status: string
  mentor_id: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return { error: 'Escola não encontrada' }

  const { data: existing } = await supabase
    .from('mentorships')
    .select('school_id')
    .eq('id', id)
    .single()

  if (!existing || existing.school_id !== schoolId) {
    return { error: 'Acesso negado' }
  }

  const { error } = await supabase
    .from('mentorships')
    .update({
      title: formData.title,
      description: formData.description,
      price: formData.price || 0,
      status: formData.status,
      mentor_id: formData.mentor_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/mentorias')
  revalidatePath(`/dashboard/mentorias/${id}`)
  return { success: true }
}

export async function deleteMentorship(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return { error: 'Escola não encontrada' }

  const { data: existing } = await supabase
    .from('mentorships')
    .select('school_id')
    .eq('id', id)
    .single()

  if (!existing || existing.school_id !== schoolId) {
    return { error: 'Acesso negado' }
  }

  const { error } = await supabase.from('mentorships').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/mentorias')
  return { success: true }
}

export async function criarAulaMentoria(
  mentorshipId: string,
  formData: { title: string; summary: string; scheduledAt: string | null; materialsUrl: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return { error: 'Escola não encontrada' }

  const { data: mentorship } = await supabase
    .from('mentorships')
    .select('school_id')
    .eq('id', mentorshipId)
    .single()

  if (!mentorship || mentorship.school_id !== schoolId) {
    return { error: 'Acesso negado' }
  }

  const { data: existing } = await supabase
    .from('mentorship_classes')
    .select('position')
    .eq('mentorship_id', mentorshipId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1

  const { data, error } = await supabase
    .from('mentorship_classes')
    .insert({
      mentorship_id: mentorshipId,
      title: formData.title,
      summary: formData.summary || null,
      scheduled_at: formData.scheduledAt || null,
      materials_url: formData.materialsUrl || null,
      position: nextPosition,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/mentorias/${mentorshipId}`)
  return { data }
}

export async function deletarAulaMentoria(classId: string, mentorshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return { error: 'Escola não encontrada' }

  const { data: mentorship } = await supabase
    .from('mentorships')
    .select('school_id')
    .eq('id', mentorshipId)
    .single()

  if (!mentorship || mentorship.school_id !== schoolId) {
    return { error: 'Acesso negado' }
  }

  const { error } = await supabase
    .from('mentorship_classes')
    .delete()
    .eq('id', classId)
    .eq('mentorship_id', mentorshipId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/mentorias/${mentorshipId}`)
  return { success: true }
}

export async function ensureMentorshipCoversBucket() {
  const admin = createAdminClient()
  const { data: bucket } = await admin.storage.getBucket('mentorship-covers')
  if (!bucket) {
    await admin.storage.createBucket('mentorship-covers', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
  }
}

export async function getCohorts(mentorshipId: string) {
  const supabase = await createClient()

  const { data: cohorts } = await supabase
    .from('mentorship_cohorts')
    .select('*')
    .eq('mentorship_id', mentorshipId)
    .order('created_at', { ascending: false })

  if (!cohorts || cohorts.length === 0) return []

  const { data: enrollments } = await supabase
    .from('mentorship_enrollments')
    .select('cohort_id')
    .in('cohort_id', cohorts.map((c) => c.id))

  const countMap = new Map<string, number>()
  for (const e of enrollments || []) {
    countMap.set(e.cohort_id, (countMap.get(e.cohort_id) || 0) + 1)
  }

  return cohorts.map((c) => ({ ...c, enrolled_count: countMap.get(c.id) || 0 }))
}

export async function createCohort(mentorshipId: string, formData: {
  maxStudents: number
  enrollmentStart: string | null
  enrollmentEnd: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return { error: 'Escola não encontrada' }

  const { data: mentorship } = await supabase
    .from('mentorships')
    .select('school_id')
    .eq('id', mentorshipId)
    .single()

  if (!mentorship || mentorship.school_id !== schoolId) {
    return { error: 'Acesso negado' }
  }

  const { data, error } = await supabase
    .from('mentorship_cohorts')
    .insert({
      mentorship_id: mentorshipId,
      max_students: formData.maxStudents || 0,
      enrollment_start: formData.enrollmentStart,
      enrollment_end: formData.enrollmentEnd,
      status: 'open',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/mentorias/${mentorshipId}`)
  return { data: { ...data, enrolled_count: 0 } }
}

export async function closeCohort(cohortId: string, mentorshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return { error: 'Escola não encontrada' }

  const { data: mentorship } = await supabase
    .from('mentorships')
    .select('school_id')
    .eq('id', mentorshipId)
    .single()

  if (!mentorship || mentorship.school_id !== schoolId) {
    return { error: 'Acesso negado' }
  }

  const { error } = await supabase
    .from('mentorship_cohorts')
    .update({ status: 'archived', live_active: false })
    .eq('id', cohortId)
    .eq('mentorship_id', mentorshipId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/mentorias/${mentorshipId}`)
  return { success: true }
}

export async function updateCohortLive(cohortId: string, mentorshipId: string, formData: {
  liveUrl: string
  liveActive: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return { error: 'Escola não encontrada' }

  const { data: mentorship } = await supabase
    .from('mentorships')
    .select('school_id')
    .eq('id', mentorshipId)
    .single()

  if (!mentorship || mentorship.school_id !== schoolId) {
    return { error: 'Acesso negado' }
  }

  if (formData.liveActive && !formData.liveUrl.trim()) {
    return { error: 'Cole o link da transmissão antes de iniciar' }
  }

  if (formData.liveActive) {
    const { data: school } = await supabase
      .from('schools')
      .select('plan')
      .eq('id', schoolId)
      .single()

    const permissao = await verificarPermissao({ plan: school?.plan ?? null }, 'live_events')
    if (!permissao.allowed) {
      return { error: 'Eventos ao vivo não disponíveis no seu plano. Faça upgrade para continuar.' }
    }
  }

  const { error } = await supabase
    .from('mentorship_cohorts')
    .update({ live_url: formData.liveUrl.trim(), live_active: formData.liveActive })
    .eq('id', cohortId)
    .eq('mentorship_id', mentorshipId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/mentorias/${mentorshipId}`)
  return { success: true }
}

export async function enrollFreeMentorship(cohortId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: cohort } = await supabase
    .from('mentorship_cohorts')
    .select('id, mentorship_id, max_students, status, enrollment_start, enrollment_end')
    .eq('id', cohortId)
    .single()

  if (!cohort) return { error: 'Turma não encontrada' }
  if (cohort.status !== 'open') return { error: 'Esta turma não está com inscrições abertas.' }

  const now = new Date()
  if (cohort.enrollment_start && now < new Date(cohort.enrollment_start)) {
    return { error: 'As inscrições ainda não começaram.' }
  }
  if (cohort.enrollment_end && now > new Date(cohort.enrollment_end)) {
    return { error: 'As inscrições já encerraram.' }
  }

  const { data: mentorship } = await supabase
    .from('mentorships')
    .select('price')
    .eq('id', cohort.mentorship_id)
    .single()

  if (!mentorship || Number(mentorship.price) > 0) {
    return { error: 'Esta mentoria não é gratuita.' }
  }

  const { count } = await supabase
    .from('mentorship_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)

  if ((count ?? 0) >= cohort.max_students) {
    return { error: 'Vagas esgotadas para esta turma.' }
  }

  const { error } = await supabase
    .from('mentorship_enrollments')
    .insert({
      cohort_id: cohortId,
      student_id: user.id,
      payment_status: 'manual',
    })

  if (error) {
    if (error.code === '23505') return { error: 'Você já está inscrito nesta turma.' }
    return { error: error.message }
  }

  revalidatePath('/dashboard/minhas-mentorias')
  return { success: true }
}

export async function getMyMentorshipEnrollments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('mentorship_enrollments')
    .select(`
      id,
      enrolled_at,
      mentorship_cohorts (
        id, status, live_url, live_active,
        mentorships ( id, title, description, cover_url, slug,
          mentorship_classes ( id, title, summary, scheduled_at, materials_url, position )
        )
      )
    `)
    .eq('student_id', user.id)
    .order('enrolled_at', { ascending: false })

  return data || []
}

export async function getProfessorOnlineStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('mentorship_enrollments')
    .select(`
      mentorship_cohorts (
        live_active,
        mentorships ( title )
      )
    `)
    .eq('student_id', user.id)

  return (data || [])
    .map((e: any) => e.mentorship_cohorts)
    .filter((c: any) => c?.live_active)
    .map((c: any) => ({ mentorshipTitle: c.mentorships?.title as string }))
}

export async function criarComentarioAula(classId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Comentário vazio' }
  if (trimmed.length > 1000) return { error: 'Comentário deve ter no máximo 1000 caracteres' }

  const { data, error } = await supabase
    .from('mentorship_comments')
    .insert({
      class_id: classId,
      student_id: user.id,
      content: trimmed,
    })
    .select('id, content, created_at, student_id')
    .single()

  if (error) return { error: error.message }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return { data: { ...data, student_name: profile?.full_name || 'Aluno' } }
}

export async function getComentariosAula(classId: string) {
  const supabase = await createClient()

  const { data: comments } = await supabase
    .from('mentorship_comments')
    .select('id, content, created_at, student_id')
    .eq('class_id', classId)
    .order('created_at', { ascending: true })

  if (!comments?.length) return []

  const studentIds = [...new Set(comments.map((c) => c.student_id))]
  const { data: profiles } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', studentIds)

  const nameMap = new Map((profiles || []).map((p) => [p.id, p.full_name]))

  return comments.map((c) => ({ ...c, student_name: nameMap.get(c.student_id) || 'Aluno' }))
}
