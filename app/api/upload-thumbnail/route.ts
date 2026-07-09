import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('thumbnail') as File
    const courseId = formData.get('courseId') as string

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo selecionado' }, { status: 400 })
    }

    if (!courseId) {
      return NextResponse.json({ error: 'courseId obrigatório' }, { status: 400 })
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

    // Verificar que o curso pertence à escola do usuário
    const [courseResult, profileResult] = await Promise.all([
      adminClient.from('courses').select('school_id').eq('id', courseId).single(),
      adminClient.from('users').select('school_id').eq('id', user.id).single(),
    ])

    if (
      !courseResult.data ||
      !profileResult.data ||
      courseResult.data.school_id !== profileResult.data.school_id
    ) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const ext = file.name.split('.').pop()
    const fileName = `${courseId}-${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // VULN-03: Verificar magic bytes — não confiar apenas no MIME type declarado
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
    const isWebp = buffer.length > 11 && buffer.slice(8, 12).toString('ascii') === 'WEBP'
    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json({ error: 'Arquivo inválido. Use JPEG, PNG ou WEBP.' }, { status: 400 })
    }

    const { error: uploadError } = await adminClient.storage
      .from('course-thumbnails')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data } = adminClient.storage
      .from('course-thumbnails')
      .getPublicUrl(fileName)

    const { error: updateError } = await adminClient
      .from('courses')
      .update({ thumbnail_url: data.publicUrl })
      .eq('id', courseId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: data.publicUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
