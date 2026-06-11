'use server'

import { createClient } from '@/lib/supabase/server'

export async function criarAula(
  moduleId: string,
  courseId: string,
  title: string,
  videoUrl: string
) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('lessons')
    .select('position')
    .eq('module_id', moduleId)
    .order('position', { ascending: false })
    .limit(1)
  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      course_id: courseId,
      title,
      video_url: videoUrl,
      type: 'video',
      position: nextPosition,
      is_free: false,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  return { data }
}

export async function deletarAula(aulaId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', aulaId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function getAulasDoAluno(courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: modulos, error } = await supabase
    .from('modules')
    .select('*, lessons(id, title, video_url, position, is_free, type)')
    .eq('course_id', courseId)
    .order('position', { ascending: true })

  if (error || !modulos) return []

  if (user) {
    const { data: progresso } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed')
      .eq('user_id', user.id)

    const progressoMap = new Map(
      (progresso || []).map((p) => [p.lesson_id, p.completed])
    )

    return modulos.map((m) => ({
      ...m,
      lessons: (m.lessons || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((l: any) => ({
          ...l,
          completed: progressoMap.get(l.id) || false,
        })),
    }))
  }

  return modulos
}

export async function marcarAulaConcluida(lessonId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })

  if (error) return { error: error.message }
  return { success: true }
}