'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSchoolBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('schools')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data
}

export async function getPublishedCourses(schoolId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('school_id', schoolId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  return data || []
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
