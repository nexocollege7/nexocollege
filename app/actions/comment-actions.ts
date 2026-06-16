'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getLessonComments(lessonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('lesson_comments')
    .select('id, content, created_at, users(full_name)')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true })

  return (data || []).map((c: any) => ({
    id: c.id as string,
    content: c.content as string,
    created_at: c.created_at as string,
    user_name: (c.users?.full_name as string) || 'Aluno',
  }))
}

export async function addLessonComment(lessonId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { error: 'Escola não encontrada' }

  const { error } = await supabase
    .from('lesson_comments')
    .insert({
      lesson_id: lessonId,
      user_id: user.id,
      school_id: profile.school_id,
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

  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return []

  const { data } = await adminClient
    .from('lesson_comments')
    .select('id, content, created_at, users(full_name), lessons(title)')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })

  return (data || []).map((c: any) => ({
    id: c.id as string,
    content: c.content as string,
    created_at: c.created_at as string,
    user_name: (c.users?.full_name as string) || 'Aluno',
    lesson_title: (c.lessons?.title as string) || 'Aula',
  }))
}
