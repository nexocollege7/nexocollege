'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getLessonComments(lessonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // adminClient bypassa a RLS que usa users.school_id (null para alunos matriculados pelo admin)
  const adminClient = createAdminClient()

  const { data } = await adminClient
    .from('lesson_comments')
    .select('id, content, created_at, reply_content, reply_at, users(full_name)')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true })

  return (data || []).map((c: any) => ({
    id: c.id as string,
    content: c.content as string,
    created_at: c.created_at as string,
    user_name: (c.users?.full_name as string) || 'Aluno',
    reply_content: (c.reply_content as string) || null,
    reply_at: (c.reply_at as string) || null,
  }))
}

export async function addLessonComment(lessonId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const adminClient = createAdminClient()

  // Busca school_id via lessons.course_id → courses.school_id
  // (não usa users.school_id que é null para alunos matriculados pelo admin)
  const { data: lessonData } = await adminClient
    .from('lessons')
    .select('courses(school_id)')
    .eq('id', lessonId)
    .single()

  const schoolId = (lessonData as any)?.courses?.school_id
  if (!schoolId) return { error: 'Escola não encontrada' }

  const { error } = await adminClient
    .from('lesson_comments')
    .insert({
      lesson_id: lessonId,
      user_id: user.id,
      school_id: schoolId,
      content: content.trim(),
    })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getAllSchoolComments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  // Tenta owner primeiro; fallback para collaborador (users.school_id)
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

  const { data } = await adminClient
    .from('lesson_comments')
    .select('id, content, created_at, reply_content, reply_at, users(full_name), lessons(title)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  return (data || []).map((c: any) => ({
    id: c.id as string,
    content: c.content as string,
    created_at: c.created_at as string,
    user_name: (c.users?.full_name as string) || 'Aluno',
    lesson_title: (c.lessons?.title as string) || 'Aula',
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
