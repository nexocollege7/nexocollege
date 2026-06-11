'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadThumbnail(courseId: string, formData: FormData) {
  const supabase = await createClient()
  const file = formData.get('thumbnail') as File

  if (!file || file.size === 0) return { error: 'Nenhum arquivo selecionado' }

  const ext = file.name.split('.').pop()
  const fileName = `${courseId}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('course-thumbnails')
    .upload(fileName, file, { upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage
    .from('course-thumbnails')
    .getPublicUrl(fileName)

  const { error: updateError } = await supabase
    .from('courses')
    .update({ thumbnail_url: data.publicUrl })
    .eq('id', courseId)

  if (updateError) return { error: updateError.message }

  return { success: true, url: data.publicUrl }
}