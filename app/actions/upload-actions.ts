'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function uploadThumbnail(courseId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const adminClient = createAdminClient()

  // Verifica que o curso pertence à escola do usuário autenticado
  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!school) return { error: 'Escola não encontrada' }

  const { data: course } = await adminClient
    .from('courses')
    .select('school_id')
    .eq('id', courseId)
    .single()

  if (!course || course.school_id !== school.id) return { error: 'Acesso negado' }

  const file = formData.get('thumbnail') as File

  if (!file || file.size === 0) return { error: 'Nenhum arquivo selecionado' }

  const ALLOWED_MIME_TYPES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  const MAX_FILE_SIZE = 5 * 1024 * 1024

  if (!ALLOWED_MIME_TYPES[file.type]) {
    return { error: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WEBP.' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'Arquivo muito grande. Máximo de 5MB.' }
  }

  const ext = ALLOWED_MIME_TYPES[file.type]
  const fileName = `${courseId}-${Date.now()}.${ext}`

  const { error: uploadError } = await adminClient.storage
    .from('course-thumbnails')
    .upload(fileName, file, { upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data } = adminClient.storage
    .from('course-thumbnails')
    .getPublicUrl(fileName)

  const { error: updateError } = await adminClient
    .from('courses')
    .update({ thumbnail_url: data.publicUrl })
    .eq('id', courseId)

  if (updateError) return { error: updateError.message }

  return { success: true, url: data.publicUrl }
}
