'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

type CourseWithSchool = {
  id: string
  title: string
  total_lessons: number | null
  schools: { name: string } | null
}

export async function getMyCertificates() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('certificates')
    .select(`
      id,
      issued_at,
      unique_code,
      courses ( title ),
      schools ( name )
    `)
    .eq('student_id', user.id)
    .order('issued_at', { ascending: false })

  return data || []
}

export async function getCoursesWithProgress() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      course_id,
      courses (
        id,
        title,
        total_lessons,
        schools!courses_school_id_fkey ( name )
      )
    `)
    .eq('student_id', user.id)
    .eq('status', 'active')

  if (!enrollments?.length) return []

  const courseIds = enrollments.map((e) => e.course_id as string)

  const [progressResult, certsResult] = await Promise.all([
    supabase
      .from('lesson_progress')
      .select('course_id')
      .eq('student_id', user.id)
      .eq('is_completed', true)
      .in('course_id', courseIds),
    supabase
      .from('certificates')
      .select('course_id, unique_code, issued_at, id')
      .eq('student_id', user.id)
      .in('course_id', courseIds),
  ])

  const progress = progressResult.data ?? []
  const certs = certsResult.data ?? []

  return enrollments.map((enrollment) => {
    const course = enrollment.courses as unknown as CourseWithSchool | null
    const total = course?.total_lessons ?? 0
    const completed = progress.filter((p) => p.course_id === enrollment.course_id).length
    const cert = certs.find((c) => c.course_id === enrollment.course_id) ?? null

    return {
      enrollmentId: enrollment.id as string,
      courseId: enrollment.course_id as string,
      courseTitle: course?.title ?? '',
      schoolName: course?.schools?.name ?? '',
      totalLessons: total,
      completedLessons: completed,
      isComplete: total > 0 && completed >= total,
      certificate: cert as { id: string; unique_code: string; issued_at: string } | null,
    }
  })
}

export async function issueCertificate(courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Verificar se já tem certificado
  const { data: existing } = await supabase
    .from('certificates')
    .select('id, unique_code')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (existing) return { success: true, code: existing.unique_code, already: true }

  // Buscar curso
  const { data: course } = await supabase
    .from('courses')
    .select('school_id, title, total_lessons')
    .eq('id', courseId)
    .single()

  if (!course) return { error: 'Curso não encontrado' }

  // Verificar 100% de conclusão
  const total = course.total_lessons ?? 0
  if (total > 0) {
    const { count } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .eq('is_completed', true)

    if ((count ?? 0) < total) {
      return {
        error: `Conclua todas as aulas para liberar seu certificado (${count ?? 0}/${total} concluídas)`,
      }
    }
  }

  // Emitir certificado
  const { data, error } = await supabase
    .from('certificates')
    .insert({
      school_id: course.school_id,
      student_id: user.id,
      course_id: courseId,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/certificados')
  return { success: true, code: data.unique_code }
}

export async function getCertificadosGestao() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { total: 0, schoolName: '', ranking: [], linhas: [] }

  let schoolId: string | null = null
  const { data: ownedSchool } = await supabase.from('schools').select('id').eq('owner_id', user.id).single()
  if (ownedSchool) {
    schoolId = ownedSchool.id
  } else {
    const { data: profile } = await supabase.from('users').select('school_id').eq('id', user.id).single()
    schoolId = profile?.school_id ?? null
  }
  if (!schoolId) return { total: 0, schoolName: '', ranking: [], linhas: [] }

  const adminClient = createAdminClient()

  const [{ data: school }, { data: certificados }, { data: cursos }] = await Promise.all([
    adminClient.from('schools').select('name').eq('id', schoolId).single(),
    adminClient.from('certificates').select('id, student_id, course_id, issued_at, unique_code').eq('school_id', schoolId).order('issued_at', { ascending: false }),
    adminClient.from('courses').select('id, title').eq('school_id', schoolId),
  ])

  const cursosMap = new Map((cursos || []).map((c) => [c.id, c]))
  const studentIds = [...new Set((certificados || []).map((c) => c.student_id))]

  const { data: alunos } = studentIds.length
    ? await adminClient.from('users').select('id, full_name, avatar_url').in('id', studentIds)
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] }
  const alunosMap = new Map((alunos || []).map((a) => [a.id, a]))

  const rankingMap = new Map<string, number>()
  for (const c of certificados || []) {
    rankingMap.set(c.course_id, (rankingMap.get(c.course_id) || 0) + 1)
  }
  const ranking = [...rankingMap.entries()]
    .map(([courseId, qtd]) => ({ courseId, titulo: cursosMap.get(courseId)?.title ?? '—', qtd }))
    .sort((a, b) => b.qtd - a.qtd)

  const linhas = (certificados || []).map((c) => {
    const aluno = alunosMap.get(c.student_id)
    return {
      certificateId: c.id,
      studentId: c.student_id,
      studentName: aluno?.full_name ?? 'Aluno',
      avatarUrl: aluno?.avatar_url ?? null,
      courseId: c.course_id,
      courseTitle: cursosMap.get(c.course_id)?.title ?? '—',
      issuedAt: c.issued_at,
      code: c.unique_code,
    }
  })

  return {
    total: certificados?.length ?? 0,
    schoolName: school?.name ?? '',
    ranking,
    linhas,
  }
}

export async function getCertificateByCode(code: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('certificates')
    .select(`
      id,
      issued_at,
      unique_code,
      users ( full_name ),
      courses ( title ),
      schools ( name )
    `)
    .eq('unique_code', code)
    .single()
  return data
}
