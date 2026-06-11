'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMyCourses() {
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
    .from('courses')
    .select('*')
    .eq('school_id', school.id)
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

  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!school) return { error: 'Escola não encontrada. Crie sua escola primeiro.' }

  const slug = formData.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { data, error } = await supabase
    .from('courses')
    .insert({
      school_id: school.id,
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
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/cursos')
  return { success: true }
}
