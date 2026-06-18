'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { matriculaValida } from '@/lib/enrollment'

export async function addLessonComment(lessonId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  if (!content.trim()) return { error: 'Comentário vazio' }

  const adminClient = createAdminClient()

  const { data: lesson, error: lessonErr } = await adminClient
    .from('lessons')
    .select('course_id')
    .eq('id', lessonId)
    .single()

  if (lessonErr || !lesson?.course_id) return { error: 'Aula não encontrada' }

  const courseId = lesson.course_id

  const { data: course, error: courseErr } = await adminClient
    .from('courses')
    .select('school_id')
    .eq('id', courseId)
    .single()

  if (courseErr || !course?.school_id) return { error: 'Escola não encontrada' }

  // Verificar matrícula ativa no curso antes de permitir comentário
  const { data: enrollment } = await adminClient
    .from('enrollments')
    .select('id, status, expires_at')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .in('payment_status', ['paid', 'manual'])
    .maybeSingle()

  if (!enrollment || !matriculaValida(enrollment)) return { error: 'Você não está matriculado neste curso.' }

  const { error: insertErr } = await adminClient
    .from('lesson_comments')
    .insert({
      lesson_id: lessonId,
      user_id: user.id,
      school_id: course.school_id,
      content: content.trim(),
    })

  if (insertErr) return { error: insertErr.message }

  revalidatePath('/dashboard/aprender', 'layout')
  return { success: true }
}

export async function getAllSchoolComments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('[getAllSchoolComments] sem sessão de usuário')
    return []
  }

  const adminClient = createAdminClient()

  let schoolId: string | null = null

  const { data: ownedSchool } = await adminClient
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (ownedSchool) {
    schoolId = ownedSchool.id
  } else {
    const { data: profile } = await adminClient
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single()
    schoolId = profile?.school_id ?? null
  }

  if (!schoolId) {
    console.error('[getAllSchoolComments] schoolId não encontrado para user', user.id)
    return []
  }

  const { data: comments, error: commentsErr } = await adminClient
    .from('lesson_comments')
    .select('id, content, created_at, reply_content, reply_at, user_id, lesson_id')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (commentsErr) {
    console.error('[getAllSchoolComments] erro na query:', commentsErr)
    return []
  }

  if (!comments || comments.length === 0) return []

  const userIds = [...new Set(comments.map((c: any) => c.user_id as string))]
  const lessonIds = [...new Set(comments.map((c: any) => c.lesson_id as string))]

  const [usersResult, lessonsResult] = await Promise.all([
    adminClient.from('users').select('id, full_name').in('id', userIds),
    adminClient.from('lessons').select('id, title, course_id').in('id', lessonIds),
  ])

  const courseIds = [...new Set((lessonsResult.data || []).map((l: any) => l.course_id as string).filter(Boolean))]
  const { data: coursesData } = await adminClient
    .from('courses')
    .select('id, title')
    .in('id', courseIds)

  const userMap = new Map((usersResult.data || []).map((u: any) => [u.id as string, u.full_name as string]))
  const courseMap = new Map((coursesData || []).map((c: any) => [c.id as string, c.title as string]))
  const lessonMap = new Map((lessonsResult.data || []).map((l: any) => [
    l.id as string,
    { title: l.title as string, course_id: l.course_id as string },
  ]))

  return comments.map((c: any) => {
    const lesson = lessonMap.get(c.lesson_id)
    return {
      id: c.id as string,
      content: c.content as string,
      created_at: c.created_at as string,
      user_name: userMap.get(c.user_id) || 'Aluno',
      lesson_title: lesson?.title || 'Aula',
      course_title: courseMap.get(lesson?.course_id || '') || '',
      reply_content: (c.reply_content as string) || null,
      reply_at: (c.reply_at as string) || null,
    }
  })
}

export async function getPendingCommentsCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const adminClient = createAdminClient()

  const { data: ownedSchool } = await adminClient
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  let schoolId: string | null = ownedSchool?.id ?? null

  if (!schoolId) {
    const { data: profile } = await adminClient
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single()
    schoolId = profile?.school_id ?? null
  }

  if (!schoolId) return 0

  const { count } = await adminClient
    .from('lesson_comments')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .is('reply_content', null)

  return count ?? 0
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const adminClient = createAdminClient()

  // Verificar que o comentário pertence a uma escola do usuário
  const { data: comment } = await adminClient
    .from('lesson_comments')
    .select('school_id')
    .eq('id', commentId)
    .single()

  if (!comment) return { error: 'Comentário não encontrado' }

  const { data: ownedSchool } = await adminClient
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .eq('id', comment.school_id)
    .maybeSingle()

  if (!ownedSchool) return { error: 'Sem permissão' }

  const { error } = await adminClient
    .from('lesson_comments')
    .delete()
    .eq('id', commentId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function replyToComment(commentId: string, replyContent: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  if (!replyContent.trim()) return { error: 'Resposta não pode ser vazia' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('lesson_comments')
    .update({
      reply_content: replyContent.trim(),
      reply_at: new Date().toISOString(),
      replied_by: user.id,
    })
    .eq('id', commentId)

  if (error) return { error: error.message }
  return { success: true }
}
