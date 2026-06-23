'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { matriculaValida } from '@/lib/enrollment'
import { verificarPermissao } from '@/lib/plan-permissions'

export async function submitCourseReview(courseId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Depoimento vazio' }
  if (trimmed.length > 300) return { error: 'Depoimento deve ter no máximo 300 caracteres' }

  const adminClient = createAdminClient()

  const { data: enrollment } = await adminClient
    .from('enrollments')
    .select('id, status, expires_at')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .maybeSingle()

  if (!enrollment || !matriculaValida(enrollment)) return { error: 'Você não está matriculado neste curso.' }

  const { data: course } = await adminClient
    .from('courses')
    .select('school_id')
    .eq('id', courseId)
    .single()

  if (!course?.school_id) return { error: 'Curso não encontrado' }

  const { data: school } = await adminClient
    .from('schools')
    .select('plan')
    .eq('id', course.school_id)
    .single()

  const permissao = await verificarPermissao({ plan: school?.plan ?? null }, 'reviews')
  if (!permissao.allowed) return { error: 'Depoimentos não disponíveis no plano desta escola.' }

  const { data: profile } = await adminClient
    .from('users')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const { error } = await adminClient
    .from('course_reviews')
    .insert({
      school_id: course.school_id,
      course_id: courseId,
      student_id: user.id,
      content: trimmed,
      student_name: profile?.full_name || 'Aluno',
      student_avatar_url: profile?.avatar_url || null,
    })

  if (error) {
    if (error.code === '23505') return { error: 'Você já enviou um depoimento para este curso.' }
    return { error: error.message }
  }

  revalidatePath('/dashboard/depoimentos')
  return { success: true }
}

export async function getStudentReview(courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('course_reviews')
    .select('id, content, created_at')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .maybeSingle()

  return data
}

export async function getReviewsGestao() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { total: 0, linhas: [] }

  const adminClient = createAdminClient()

  let schoolId: string | null = null
  const { data: ownedSchool } = await adminClient.from('schools').select('id').eq('owner_id', user.id).maybeSingle()
  if (ownedSchool) {
    schoolId = ownedSchool.id
  } else {
    const { data: profile } = await adminClient.from('users').select('school_id').eq('id', user.id).single()
    schoolId = profile?.school_id ?? null
  }
  if (!schoolId) return { total: 0, linhas: [] }

  const { data: reviews } = await adminClient
    .from('course_reviews')
    .select('id, content, student_name, student_avatar_url, is_active, created_at, course_id')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (!reviews?.length) return { total: 0, linhas: [] }

  const courseIds = [...new Set(reviews.map((r) => r.course_id))]
  const { data: courses } = await adminClient.from('courses').select('id, title').in('id', courseIds)
  const courseMap = new Map((courses || []).map((c) => [c.id, c.title]))

  return {
    total: reviews.length,
    linhas: reviews.map((r) => ({
      id: r.id as string,
      content: r.content as string,
      studentName: r.student_name as string,
      studentAvatarUrl: r.student_avatar_url as string | null,
      isActive: r.is_active as boolean,
      createdAt: r.created_at as string,
      courseTitle: courseMap.get(r.course_id) ?? '—',
    })),
  }
}

export async function toggleReviewActive(reviewId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const adminClient = createAdminClient()

  const { data: review } = await adminClient.from('course_reviews').select('school_id').eq('id', reviewId).single()
  if (!review) return { error: 'Depoimento não encontrado' }

  const { data: ownedSchool } = await adminClient
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .eq('id', review.school_id)
    .maybeSingle()

  if (!ownedSchool) {
    const { data: profile } = await adminClient.from('users').select('school_id').eq('id', user.id).single()
    if (profile?.school_id !== review.school_id) return { error: 'Sem permissão' }
  }

  const { error } = await adminClient.from('course_reviews').update({ is_active: isActive }).eq('id', reviewId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/depoimentos')
  return { success: true }
}

export async function deleteReview(reviewId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('course_reviews')
    .delete()
    .eq('id', reviewId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/depoimentos')
  return { success: true }
}
