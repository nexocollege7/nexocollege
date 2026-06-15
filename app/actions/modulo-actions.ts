'use server'

import { createClient } from '@/lib/supabase/server'

export async function getModulos(courseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modules')
    .select('*, lessons(*)')
    .eq('course_id', courseId)
    .order('position', { ascending: true })
  if (error) return []
  return data
}

export async function criarModulo(courseId: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: existing } = await supabase
    .from('modules')
    .select('position')
    .eq('course_id', courseId)
    .order('position', { ascending: false })
    .limit(1)
  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1
  const { data, error } = await supabase
    .from('modules')
    .insert({ course_id: courseId, title, position: nextPosition })
    .select()
    .single()
  if (error) return { error: error.message }
  return { data }
}

export async function deletarModulo(moduloId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', moduloId)
  if (error) return { error: error.message }
  return { success: true }
}
