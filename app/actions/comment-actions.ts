'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

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

  const { data: course, error: courseErr } = await adminClient
    .from('courses')
    .select('school_id')
    .eq('id', lesson.course_id)
    .single()

  if (courseErr || !course?.school_id) return { error: 'Escola não encontrada' }

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
  if (!user) return []

  const adminClient = createAdminClient()

  let schoolId: string | null = null

  const { data: ownedSchool } = await adminClient
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

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

  if (!schoolId) return []

  const { data: comments, error: commentsErr } = await adminClient
    .from('lesson_comments')
    .select('id, content, created_at, reply_content, reply_at, user_id, lesson_id')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (commentsErr || !comments || comments.length === 0) return []

  const userIds = [...new Set(comments.map((c: any) => c.user_id as string))]
  const lessonIds = [...new Set(comments.map((c: any) => c.lesson_id as string))]

  const [usersResult, lessonsResult] = await Promise.all([
    adminClient.from('users').select('id, full_name').in('id', userIds),
    adminClient.from('lessons').select('id, title').in('id', lessonIds),
  ])

  const userMap = new Map((usersResult.data || []).map((u: any) => [u.id as string, u.full_name as string]))
  const lessonMap = new Map((lessonsResult.data || []).map((l: any) => [l.id as string, l.title as string]))

  return comments.map((c: any) => ({
    id: c.id as string,
    content: c.content as string,
    created_at: c.created_at as string,
    user_name: userMap.get(c.user_id) || 'Aluno',
    lesson_title: lessonMap.get(c.lesson_id) || 'Aula',
    reply_content: (c.reply_content as string) || null,
    reply_at: (c.reply_at as string) || null,
  }))
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
