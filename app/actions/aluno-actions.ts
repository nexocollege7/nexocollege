'use server'

import { createClient } from '@/lib/supabase/server'

export async function getMeuscursos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      enrolled_at,
      expires_at,
      course_id,
      courses (
        id,
        title,
        description,
        thumbnail_url,
        total_lessons,
        slug,
        school_id,
        schools!courses_school_id_fkey ( slug, name, primary_color )
      )
    `)
    .eq('student_id', user.id)
    .eq('status', 'active')

  return data || []
}

export async function getEscolasAoVivo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: matriculas } = await supabase
    .from('enrollments')
    .select('school_id')
    .eq('student_id', user.id)
    .eq('status', 'active')

  const schoolIds = [...new Set(
    (matriculas || [])
      .map((m: { school_id: string }) => m.school_id)
      .filter(Boolean)
  )]
  if (schoolIds.length === 0) return []

  const { data: escolas } = await supabase
    .from('schools')
    .select('slug, name')
    .in('id', schoolIds)
    .eq('live_active', true)

  return escolas || []
}

export async function getCourseWithLessons(courseId: string) {
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select(`
      *,
      schools!courses_school_id_fkey ( name, primary_color ),
      modules (
        id,
        title,
        position,
        lessons (
          id,
          title,
          type,
          video_url,
          content,
          duration_sec,
          position,
          is_free
        )
      )
    `)
    .eq('id', courseId)
    .single()

  return course
}

export async function getLessonProgress(studentId: string, courseId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
  return data || []
}

export async function markLessonComplete(lessonId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      student_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      is_completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'student_id,lesson_id' })

  if (error) return { error: error.message }
  return { success: true }
}
