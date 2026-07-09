import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('cover') as File
    const mentorshipId = formData.get('mentorshipId') as string

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo selecionado' }, { status: 400 })
    }

    if (!mentorshipId) {
      return NextResponse.json({ error: 'mentorshipId obrigatório' }, { status: 400 })
    }

    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    const MAX_FILE_SIZE = 5 * 1024 * 1024

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WEBP.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo de 5MB.' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const [mentorshipResult, profileResult] = await Promise.all([
      adminClient.from('mentorships').select('school_id').eq('id', mentorshipId).single(),
      adminClient.from('users').select('school_id').eq('id', user.id).single(),
    ])

    if (
      !mentorshipResult.data ||
      !profileResult.data ||
      mentorshipResult.data.school_id !== profileResult.data.school_id
    ) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const ext = file.name.split('.').pop()
    const fileName = `${mentorshipId}-${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminClient.storage
      .from('mentorship-covers')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data } = adminClient.storage
      .from('mentorship-covers')
      .getPublicUrl(fileName)

    const { error: updateError } = await adminClient
      .from('mentorships')
      .update({ cover_url: data.publicUrl })
      .eq('id', mentorshipId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: data.publicUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[upload-mentorship-cover]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Erro ao fazer upload.' }, { status: 500 })
  }
}
