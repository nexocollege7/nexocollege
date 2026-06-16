'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createAnnouncement(title: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { error: 'Escola não encontrada' }
  if (!['admin', 'collaborator'].includes(profile.role)) return { error: 'Sem permissão' }

  const { error } = await adminClient
    .from('school_announcements')
    .insert({
      school_id: profile.school_id,
      title: title.trim(),
      content: content.trim(),
      created_by: user.id,
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/comunicados')
  return { success: true }
}

export async function getSchoolAnnouncements() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return []

  const { data } = await adminClient
    .from('school_announcements')
    .select('id, title, content, created_at, users(full_name)')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })

  return (data || []).map((a: any) => ({
    id: a.id as string,
    title: a.title as string,
    content: a.content as string,
    created_at: a.created_at as string,
    author: (a.users?.full_name as string) || 'Admin',
  }))
}

export async function getMyAnnouncements() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return []

  const { data } = await supabase
    .from('school_announcements')
    .select('id, title, content, created_at')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })

  return (data || []).map((a: any) => ({
    id: a.id as string,
    title: a.title as string,
    content: a.content as string,
    created_at: a.created_at as string,
  }))
}
