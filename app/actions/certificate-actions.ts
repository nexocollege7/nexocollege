'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
      schools!courses_school_id_fkey ( name )
    `)
    .eq('student_id', user.id)
    .order('issued_at', { ascending: false })

  return data || []
}

export async function issueCertificate(courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Buscar school_id do curso
  const { data: course } = await supabase
    .from('courses')
    .select('school_id, title, total_lessons')
    .eq('id', courseId)
    .single()

  if (!course) return { error: 'Curso não encontrado' }

  // Verificar se já tem certificado
  const { data: existing } = await supabase
    .from('certificates')
    .select('id, unique_code')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (existing) return { success: true, code: existing.unique_code, already: true }

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
      schools!courses_school_id_fkey ( name )
    `)
    .eq('unique_code', code)
    .single()
  return data
}
