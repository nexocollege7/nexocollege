'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getSchoolBySlug(slug: string) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('schools')
    .select('id, name, slug, logo_url, description, primary_color, is_active, featured_course_id, featured_course_ids, live_url, live_active, pix_key, pix_holder_name, whatsapp_contact, suspended_at')
    .eq('slug', slug)
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

  return data.map((course) => {
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

export async function getLiveStatus(schoolId: string) {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('schools')
    .select('live_url, live_active')
    .eq('id', schoolId)
    .single()

  return {
    liveActive: data?.live_active ?? false,
    liveUrl: data?.live_url ?? null,
  }
}

export async function getPublishedMentorships(schoolId: string) {
  const adminClient = createAdminClient()
  const { data: mentorships } = await adminClient
    .from('mentorships')
    .select('id, title, description, price, slug, cover_url, created_at')
    .eq('school_id', schoolId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (!mentorships?.length) return []

  const { data: cohorts } = await adminClient
    .from('mentorship_cohorts')
    .select('mentorship_id, status')
    .in('mentorship_id', mentorships.map((m) => m.id))
    .eq('status', 'open')

  const openMentorshipIds = new Set((cohorts || []).map((c) => c.mentorship_id))

  return mentorships.map((m) => ({ ...m, has_open_cohort: openMentorshipIds.has(m.id) }))
}

// Retorna apenas se a escola tem token MP configurado — sem expor o valor do token
export async function getSchoolHasMpToken(schoolId: string): Promise<boolean> {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('schools')
    .select('mp_access_token')
    .eq('id', schoolId)
    .single()
  return !!data?.mp_access_token
}

export async function getMentorshipBySlug(mentorshipSlug: string, schoolId: string) {
  const adminClient = createAdminClient()
  const { data: mentorship } = await adminClient
    .from('mentorships')
    .select('*')
    .eq('slug', mentorshipSlug)
    .eq('school_id', schoolId)
    .eq('status', 'published')
    .single()

  if (!mentorship) return null

  const [{ data: classes }, { data: cohorts }] = await Promise.all([
    adminClient
      .from('mentorship_classes')
      .select('*')
      .eq('mentorship_id', mentorship.id)
      .order('position', { ascending: true }),
    adminClient
      .from('mentorship_cohorts')
      .select('*')
      .eq('mentorship_id', mentorship.id)
      .order('created_at', { ascending: false }),
  ])

  const cohortIds = (cohorts || []).map((c) => c.id)
  const { data: enrollments } = cohortIds.length
    ? await adminClient.from('mentorship_enrollments').select('cohort_id').in('cohort_id', cohortIds)
    : { data: [] as { cohort_id: string }[] }

  const countMap = new Map<string, number>()
  for (const e of enrollments || []) {
    countMap.set(e.cohort_id, (countMap.get(e.cohort_id) || 0) + 1)
  }

  return {
    ...mentorship,
    classes: classes || [],
    cohorts: (cohorts || []).map((c) => ({ ...c, enrolled_count: countMap.get(c.id) || 0 })),
  }
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
