'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSchoolBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('schools')
    .select('*')
    .eq('slug', slug)
    .single()
  return data
}

export async function getPublishedCourses(schoolId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('id, title, description, price, is_free, slug, status, thumbnail_url, created_at')
    .eq('school_id', schoolId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  
  if (!data) return []

  const coursesWithLessons = await Promise.all(
    data.map(async (course) => {
      const { count } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)
      return { ...course, total_lessons: count || 0 }
    })
  )

  return coursesWithLessons
}

export async function getCourseBySlug(courseSlug: string, schoolId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', courseSlug)
    .eq('school_id', schoolId)
    .eq('status', 'published')
    .single()
  return data
}