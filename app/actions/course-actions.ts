'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function getSchoolId(userId: string) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', userId)
    .single()

  if (error) console.error('getSchoolId error:', error.message)
  return data?.school_id || null
}

export async function getMyCourses() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return []

  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  return data || []
}

export async function getCourse(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function createCourse(formData: {
  title: string
  description: string
  price: number
  is_free: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return { error: 'Escola não encontrada. Crie sua escola primeiro.' }

  const slug = formData.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { data, error } = await supabase
    .from('courses')
    .insert({
      school_id: schoolId,
      teacher_id: user.id,
      title: formData.title,
      description: formData.description,
      price: formData.is_free ? 0 : formData.price,
      is_free: formData.is_free,
      slug: `${slug}-${Date.now()}`,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/cursos')
  return { success: true, id: data.id }
}

export async function updateCourse(id: string, formData: {
  title: string
  description: string
  price: number
  is_free: boolean
  status: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return { error: 'Escola não encontrada' }

  // Verificar que o curso pertence à escola do usuário
  const { data: existing } = await supabase
    .from('courses')
    .select('school_id')
    .eq('id', id)
    .single()

  if (!existing || existing.school_id !== schoolId) {
    return { error: 'Acesso negado' }
  }

  const { error } = await supabase
    .from('courses')
    .update({
      title: formData.title,
      description: formData.description,
      price: formData.is_free ? 0 : formData.price,
      is_free: formData.is_free,
      status: formData.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/cursos')
  return { success: true }
}

export async function deleteCourse(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const schoolId = await getSchoolId(user.id)
  if (!schoolId) return { error: 'Escola não encontrada' }

  // Verificar que o curso pertence à escola do usuário
  const { data: existing } = await supabase
    .from('courses')
    .select('school_id')
    .eq('id', id)
    .single()

  if (!existing || existing.school_id !== schoolId) {
    return { error: 'Acesso negado' }
  }

  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/cursos')
  return { success: true }
}
