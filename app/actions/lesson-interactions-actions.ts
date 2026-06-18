'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getLessonInteractions(lessonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { likeCount: 0, liked: false, favorited: false }

  const adminClient = createAdminClient()

  const [{ count: likeCount }, { data: myLike }, { data: myFavorite }] = await Promise.all([
    adminClient.from('lesson_likes').select('*', { count: 'exact', head: true }).eq('lesson_id', lessonId),
    adminClient.from('lesson_likes').select('id').eq('lesson_id', lessonId).eq('user_id', user.id).maybeSingle(),
    adminClient.from('lesson_favorites').select('id').eq('lesson_id', lessonId).eq('user_id', user.id).maybeSingle(),
  ])

  return {
    likeCount: likeCount ?? 0,
    liked: !!myLike,
    favorited: !!myFavorite,
  }
}

export async function toggleLessonLike(lessonId: string): Promise<{ error: string } | { liked: boolean; count: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const adminClient = createAdminClient()

  const { data: existing } = await adminClient
    .from('lesson_likes')
    .select('id')
    .eq('lesson_id', lessonId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await adminClient.from('lesson_likes').delete().eq('id', existing.id)
  } else {
    await adminClient.from('lesson_likes').insert({ lesson_id: lessonId, user_id: user.id })
  }

  const { count } = await adminClient
    .from('lesson_likes')
    .select('*', { count: 'exact', head: true })
    .eq('lesson_id', lessonId)

  return { liked: !existing, count: count ?? 0 }
}

export async function toggleLessonFavorite(lessonId: string): Promise<{ error: string } | { favorited: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const adminClient = createAdminClient()

  const { data: existing } = await adminClient
    .from('lesson_favorites')
    .select('id')
    .eq('lesson_id', lessonId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await adminClient.from('lesson_favorites').delete().eq('id', existing.id)
    return { favorited: false }
  }

  await adminClient.from('lesson_favorites').insert({ lesson_id: lessonId, user_id: user.id })
  return { favorited: true }
}

export async function getMeusFavoritos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()

  const { data: favoritos } = await adminClient
    .from('lesson_favorites')
    .select('id, lesson_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!favoritos?.length) return []

  const lessonIds = favoritos.map((f) => f.lesson_id)

  const { data: lessons } = await adminClient
    .from('lessons')
    .select('id, title, course_id')
    .in('id', lessonIds)

  const courseIds = [...new Set((lessons || []).map((l) => l.course_id))]
  const { data: courses } = courseIds.length
    ? await adminClient.from('courses').select('id, title, thumbnail_url').in('id', courseIds)
    : { data: [] as any[] }

  const lessonsMap = new Map((lessons || []).map((l) => [l.id, l]))
  const coursesMap = new Map((courses || []).map((c) => [c.id, c]))

  return favoritos
    .map((f) => {
      const lesson = lessonsMap.get(f.lesson_id)
      if (!lesson) return null
      const course = coursesMap.get(lesson.course_id)
      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        courseId: lesson.course_id,
        courseTitle: course?.title ?? '—',
        courseThumbnail: course?.thumbnail_url ?? null,
      }
    })
    .filter((f): f is NonNullable<typeof f> => f !== null)
}
