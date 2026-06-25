import { createClient } from '@/lib/supabase/server'

export type PendingEnrollmentStatus =
  | 'awaiting_payment'
  | 'awaiting_release'
  | 'released'
  | 'refused'
  | 'expired'

export type PendingEnrollment = {
  id: string
  school_id: string
  student_id: string
  course_id: string
  payment_method: string
  status: PendingEnrollmentStatus
  receipt_url: string | null
  admin_note: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

export type PendingEnrollmentStudent = {
  id: string
  full_name: string | null
  email: string | null
}

export type PendingEnrollmentCourse = {
  id: string
  title: string
  thumbnail_url: string | null
}

export type PendingEnrollmentWithDetails = PendingEnrollment & {
  student: PendingEnrollmentStudent
  course: PendingEnrollmentCourse
}

const ACTIVE_STATUSES: PendingEnrollmentStatus[] = ['awaiting_payment', 'awaiting_release']

const WITH_DETAILS_SELECT = `
  id, school_id, student_id, course_id, payment_method, status,
  receipt_url, admin_note, expires_at, created_at, updated_at,
  student:users ( id, full_name, email ),
  course:courses ( id, title, thumbnail_url )
`

export async function getPendingEnrollmentsBySchool(
  schoolId: string
): Promise<PendingEnrollmentWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pending_enrollments')
    .select(WITH_DETAILS_SELECT)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .returns<PendingEnrollmentWithDetails[]>()

  if (error) console.error('[getPendingEnrollmentsBySchool] error:', error.message, error.code)

  return data ?? []
}

export async function getPendingEnrollmentsByStudent(
  studentId: string,
  schoolId: string
): Promise<PendingEnrollmentWithDetails[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pending_enrollments')
    .select(WITH_DETAILS_SELECT)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .returns<PendingEnrollmentWithDetails[]>()

  return data ?? []
}

export async function countActivePendingBySchool(schoolId: string): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('pending_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .in('status', ACTIVE_STATUSES)

  return count ?? 0
}

export async function getPendingEnrollmentById(
  id: string
): Promise<PendingEnrollmentWithDetails | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pending_enrollments')
    .select(WITH_DETAILS_SELECT)
    .eq('id', id)
    .maybeSingle()
    .returns<PendingEnrollmentWithDetails>()

  return data ?? null
}
