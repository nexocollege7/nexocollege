import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { matriculaValida } from '@/lib/enrollment'
import { AprenderClient } from './aprender-client'

export default async function AprenderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') redirect('/dashboard')

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status, expires_at')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  if (!enrollment || !matriculaValida(enrollment)) {
    const { data: course } = await supabase
      .from('courses')
      .select('slug, schools!courses_school_id_fkey(slug)')
      .eq('id', courseId)
      .single()

    const schoolSlug = (course?.schools as any)?.slug
    const courseSlug = course?.slug

    redirect(
      schoolSlug && courseSlug
        ? `/vitrine/${schoolSlug}/${courseSlug}`
        : '/dashboard/meus-cursos'
    )
  }

  return <AprenderClient />
}
