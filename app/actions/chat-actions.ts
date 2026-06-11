'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getConversations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('messages')
    .select(`
      id, content, sent_at, is_read,
      sender:users!messages_sender_id_fkey ( id, full_name ),
      receiver:users!messages_receiver_id_fkey ( id, full_name ),
      courses ( id, title )
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('sent_at', { ascending: false })

  return data || []
}

export async function getMessages(courseId: string, otherId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('course_id', courseId)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
    .order('sent_at', { ascending: true })

  return data || []
}

export async function sendMessage(receiverId: string, courseId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: course } = await supabase
    .from('courses')
    .select('school_id')
    .eq('id', courseId)
    .single()

  if (!course) return { error: 'Curso não encontrado' }

  const { error } = await supabase
    .from('messages')
    .insert({
      school_id: course.school_id,
      course_id: courseId,
      sender_id: user.id,
      receiver_id: receiverId,
      content,
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/mensagens')
  return { success: true }
}

export async function getMyTeachers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('enrollments')
    .select(`
      courses (
        id, title, teacher_id,
        teacher:users!courses_teacher_id_fkey ( id, full_name )
      )
    `)
    .eq('student_id', user.id)
    .eq('status', 'active')

  return data || []
}

export async function getMyStudents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Busca mensagens recebidas pelo professor, agrupadas por aluno + curso
  const { data } = await supabase
    .from('messages')
    .select(`
      course_id,
      sender_id,
      sender:users!messages_sender_id_fkey ( id, full_name ),
      courses ( id, title )
    `)
    .eq('receiver_id', user.id)
    .order('sent_at', { ascending: false })

  if (!data) return []

  // Remove duplicatas — um item por aluno+curso
  const seen = new Set<string>()
  return data.filter((msg) => {
    const key = `${msg.sender_id}-${msg.course_id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
