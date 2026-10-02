'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getMyProfileFull() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('id, full_name, role, school_id, avatar_url')
    .eq('id', user.id)
    .single()

  return data ? { ...data, email: user.email } : null
}

export async function updateAvatarUrl(avatarUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function ensureAvatarBucket() {
  const admin = createAdminClient()
  const { data: bucket } = await admin.storage.getBucket('avatars')
  if (!bucket) {
    await admin.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
  }
}

// Atualiza o nome do usuário logado (aparece no painel e nos certificados).
export async function updateMyFullName(fullName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const nome = (fullName ?? '').replace(/\s+/g, ' ').trim()
  if (nome.length < 2) return { error: 'Digite seu nome (mínimo de 2 letras)' }
  if (nome.length > 100) return { error: 'Nome muito longo (máximo de 100 caracteres)' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('users')
    .update({ full_name: nome })
    .eq('id', user.id)

  if (error) return { error: 'Erro ao salvar: ' + error.message }

  revalidatePath('/dashboard', 'layout')
  return { success: true, fullName: nome }
}
