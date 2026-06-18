'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getSchoolBySlug(slug: string) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('schools')
    .select('id, name, slug, logo_url, description, primary_color, is_active, featured_course_id, featured_course_ids')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  if (error) console.error('[vitrine] getSchoolBySlug error for slug=' + slug + ':', error.message, error.code)
  return data
}

export async function getPublishedCourses(schoolId: string) {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('courses')
    .select('id, title, description, price, is_free, slug, status, thumbnail_url, created_at, lessons(count)')
    .eq('school_id', schoolId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (!data) return []

  return data.map((course: any) => {
    const { lessons, ...rest } = course
    return { ...rest, total_lessons: lessons?.[0]?.count || 0 }
  })
}

export async function getCourseBySlug(courseSlug: string, schoolId: string) {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('courses')
    .select('*')
    .eq('slug', courseSlug)
    .eq('school_id', schoolId)
    .eq('status', 'published')
    .single()
  return data
}

export async function getActiveReviews(schoolId: string) {
  const adminClient = createAdminClient()
  const { data: reviews } = await adminClient
    .from('course_reviews')
    .select('id, content, student_name, student_avatar_url, course_id, created_at')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!reviews?.length) return []

  const courseIds = [...new Set(reviews.map((r) => r.course_id))]
  const { data: courses } = await adminClient.from('courses').select('id, title').in('id', courseIds)
  const courseMap = new Map((courses || []).map((c) => [c.id, c.title]))

  return reviews.map((r) => ({
    id: r.id as string,
    content: r.content as string,
    studentName: r.student_name as string,
    studentAvatarUrl: r.student_avatar_url as string | null,
    courseTitle: courseMap.get(r.course_id) ?? '',
  }))
}
