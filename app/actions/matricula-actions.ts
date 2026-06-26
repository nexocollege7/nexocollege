'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { diasRestantes } from '@/lib/enrollment'

export type CursoEscola = {
  id: string
  title: string
  is_free: boolean
  price: number
}

export type CursoBasico = {
  id: string
  title: string
  total_lessons: number
}

export type LinhaAluno = {
  enrollmentId: string
  studentId: string
  fullName: string | null
  avatarUrl: string | null
  email: string
  courseId: string
  courseTitle: string
  enrolledAt: string
  progresso: number
  dias: number | null
  expirado: boolean
}

export async function getCursosEscola() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Tenta owner primeiro, depois collaborador (mesmo padrão de getEnrollments)
  let schoolId: string | null = null

  const { data: ownedSchool } = await supabase
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (ownedSchool) {
    schoolId = ownedSchool.id
  } else {
    const { data: profile } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single()
    schoolId = profile?.school_id ?? null
  }

  if (!schoolId) return []

  const { data } = await supabase
    .from('courses')
    .select('id, title, is_free, price')
    .eq('school_id', schoolId)
    .order('title')

  return data || []
}

export async function getEnrollments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!school) return []

  const { data } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      enrolled_at,
      student_id,
      payment_status,
      users!enrollments_student_id_fkey ( id, full_name, role ),
      courses ( id, title )
    `)
    .eq('school_id', school.id)
    .order('enrolled_at', { ascending: false })
    .limit(500)

  // Filtrar apenas alunos reais (excluir admin e collaborator)
  const alunosApenas = (data || []).filter((e: any) => {
    const role = e.users?.role
    return role === 'student' || role === null || role === undefined
  })

  return alunosApenas
}

export async function getAlunosGestao() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { totalAlunos: 0, totalAtivos: 0, cursos: [], linhas: [] }

  // owner primeiro, depois collaborator (mesmo padrão de getCursosEscola)
  let schoolId: string | null = null
  const { data: ownedSchool } = await supabase
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (ownedSchool) {
    schoolId = ownedSchool.id
  } else {
    const { data: profile } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single()
    schoolId = profile?.school_id ?? null
  }

  if (!schoolId) return { totalAlunos: 0, totalAtivos: 0, cursos: [], linhas: [] }

  const adminClient = createAdminClient()

  const [{ data: alunos }, { data: cursos }, { data: enrollments }] = await Promise.all([
    adminClient.from('users').select('id, full_name, avatar_url').eq('school_id', schoolId).eq('role', 'student'),
    adminClient.from('courses').select('id, title, total_lessons').eq('school_id', schoolId),
    adminClient.from('enrollments').select('id, student_id, course_id, enrolled_at, expires_at, payment_status').eq('school_id', schoolId).eq('status', 'active'),
  ])

  const cursosMap = new Map((cursos || []).map((c) => [c.id, c]))
  const alunosMap = new Map((alunos || []).map((a) => [a.id, a]))
  const studentIds = [...new Set((enrollments || []).map((e) => e.student_id))]

  const { data: progresso } = studentIds.length
    ? await adminClient.from('lesson_progress').select('student_id, course_id').in('student_id', studentIds).eq('is_completed', true)
    : { data: [] as any[] }

  const progressoCount = new Map<string, number>()
  for (const p of progresso || []) {
    const key = `${p.student_id}_${p.course_id}`
    progressoCount.set(key, (progressoCount.get(key) || 0) + 1)
  }

  const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map((authData?.users || []).map((u) => [u.id, u.email]))

  // Alunos com matrícula
  const linhasComMatricula = (enrollments || [])
    .filter((e) => alunosMap.has(e.student_id))
    .map((e) => {
      const aluno = alunosMap.get(e.student_id)!
      const curso = cursosMap.get(e.course_id)
      const total = curso?.total_lessons ?? 0
      const completas = progressoCount.get(`${e.student_id}_${e.course_id}`) ?? 0
      const progressoPercent = total > 0 ? Math.round((completas / total) * 100) : 0
      const dias = diasRestantes(e.expires_at)
      const expirado = dias !== null && dias <= 0

      return {
        enrollmentId: e.id,
        studentId: e.student_id,
        fullName: aluno.full_name,
        avatarUrl: aluno.avatar_url,
        email: emailMap.get(e.student_id) ?? '',
        courseId: e.course_id,
        courseTitle: curso?.title ?? '—',
        enrolledAt: e.enrolled_at,
        progresso: progressoPercent,
        dias,
        expirado,
      }
    })

  // Alunos sem nenhuma matrícula — aparecem na lista com dados zerados
  const studentIdsComMatricula = new Set(linhasComMatricula.map((l) => l.studentId))
  const linhasSemMatricula = (alunos || [])
    .filter((a) => !studentIdsComMatricula.has(a.id))
    .map((a) => ({
      enrollmentId: '',
      studentId: a.id,
      fullName: a.full_name,
      avatarUrl: a.avatar_url,
      email: emailMap.get(a.id) ?? '',
      courseId: '',
      courseTitle: 'Sem matrícula',
      enrolledAt: new Date().toISOString(),
      progresso: 0,
      dias: null,
      expirado: false,
    }))

  const linhas = [...linhasComMatricula, ...linhasSemMatricula]

  const studentsAtivos = new Set(linhasComMatricula.filter((l) => !l.expirado).map((l) => l.studentId))

  return {
    totalAlunos: alunos?.length ?? 0,
    totalAtivos: studentsAtivos.size,
    cursos: cursos || [],
    linhas,
  }
}

export async function enrollStudentByEmail(email: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!school) return { error: 'Escola não encontrada' }

  // Buscar usuário pelo email na tabela auth
  const { data: authUsers, error: authError } = await supabase
    .rpc('get_user_id_by_email', { email_input: email })

  if (authError || !authUsers) return { error: 'Usuário não encontrado com este email' }

  const studentId = authUsers

  // Garantir que existe na tabela users
  await supabase
    .from('users')
    .upsert({ id: studentId }, { onConflict: 'id' })

  // Criar matrícula
  const { error } = await supabase
    .from('enrollments')
    .insert({
      school_id: school.id,
      course_id: courseId,
      student_id: studentId,
      status: 'active',
      expires_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
    })

  if (error) {
    if (error.code === '23505') return { error: 'Aluno já matriculado neste curso' }
    return { error: error.message }
  }

  revalidatePath('/dashboard/alunos')
  return { success: true }
}

export async function revokeEnrollment(enrollmentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'canceled' })
    .eq('id', enrollmentId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/alunos')
  return { success: true }
}

export async function liberarCurso(studentId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!school) return { error: 'Escola não encontrada' }

  const { error } = await supabase
    .from('enrollments')
    .insert({
      school_id: school.id,
      course_id: courseId,
      student_id: studentId,
      status: 'active',
      payment_status: 'manual',
      expires_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
    })

  if (error) {
    if (error.code === '23505') return { error: 'Aluno já matriculado neste curso' }
    return { error: error.message }
  }

  revalidatePath('/dashboard/alunos')
  return { success: true }
}

export async function deletarMatriculaManual(enrollmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const adminClient = createAdminClient()

  const { data: school } = await adminClient
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!school) return { error: 'Escola não encontrada' }

  const { data: enrollment } = await adminClient
    .from('enrollments')
    .select('id, payment_status, school_id')
    .eq('id', enrollmentId)
    .single()

  if (!enrollment) return { error: 'Matrícula não encontrada' }
  if (enrollment.school_id !== school.id) return { error: 'Acesso negado' }
  // Apenas matrículas pagas via MP não podem ser removidas; null (legado) e 'manual' podem
  if (enrollment.payment_status === 'paid') return { error: 'Matrículas pagas não podem ser removidas manualmente' }

  const { error } = await adminClient
    .from('enrollments')
    .delete()
    .eq('id', enrollmentId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/alunos')
  return { success: true }
}

export async function estenderAcesso(enrollmentId: string, dias: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!school) return { error: 'Escola não encontrada' }

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, school_id, expires_at')
    .eq('id', enrollmentId)
    .single()

  if (!enrollment) return { error: 'Matrícula não encontrada' }
  if (enrollment.school_id !== school.id) return { error: 'Acesso negado' }

  const base = enrollment.expires_at && new Date(enrollment.expires_at) > new Date()
    ? new Date(enrollment.expires_at)
    : new Date()
  const novaData = new Date(base.getTime() + dias * 86_400_000)

  const { error } = await supabase
    .from('enrollments')
    .update({ expires_at: novaData.toISOString(), status: 'active' })
    .eq('id', enrollmentId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/alunos')
  return { success: true }
}

export async function getSchoolStudents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const schoolId = profile?.school_id
  if (!schoolId) return []

  const { data } = await supabase
    .from('users')
    .select('id, full_name, role, created_at')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  return data || []
}
