'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function uploadThumbnail(courseId: string, formData: FormData) {
  const adminClient = createAdminClient()
  const file = formData.get('thumbnail') as File

  if (!file || file.size === 0) return { error: 'Nenhum arquivo selecionado' }

  const ext = file.name.split('.').pop()
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
