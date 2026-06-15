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
