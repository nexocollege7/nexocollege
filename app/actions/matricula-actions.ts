'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

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
