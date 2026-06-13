'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
      users!enrollments_student_id_fkey ( id, full_name, role ),
      courses ( id, title )
    `)
    .eq('school_id', school.id)
    .order('enrolled_at', { ascending: false })

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
