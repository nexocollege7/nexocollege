'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMySchool() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('schools')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  return data
}

export async function updateSchool(formData: {
  name: string
  description: string
  primary_color: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('schools')
    .update({
      name: formData.name,
      description: formData.description,
      primary_color: formData.primary_color,
      updated_at: new Date().toISOString(),
    })
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/escola')
  return { success: true }
}

export async function createSchool(formData: {
  name: string
  description: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const slug = formData.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { error } = await supabase
    .from('schools')
    .insert({
      name: formData.name,
      description: formData.description,
      slug: `${slug}-${Date.now()}`,
      owner_id: user.id,
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/escola')
  return { success: true }
}
