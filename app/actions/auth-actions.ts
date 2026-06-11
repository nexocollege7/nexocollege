'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createUserProfile(userId: string, fullName: string, role: 'student' | 'admin' = 'student') {
  const adminClient = createAdminClient()

  const { data: existing } = await adminClient
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (existing) return { success: true }

  const { error } = await adminClient
    .from('users')
    .insert({
      id: userId,
      full_name: fullName,
      role,
      created_at: new Date().toISOString(),
    })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getMyProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('id, full_name, role, school_id')
    .eq('id', user.id)
    .single()

  if (!data) {
    const adminClient = createAdminClient()
    await adminClient.from('users').insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email || 'Usuário',
      role: 'student',
      created_at: new Date().toISOString(),
    })
    return { id: user.id, full_name: user.email || 'Usuário', role: 'student', school_id: null }
  }

  return data
}
