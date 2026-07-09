import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

async function getSessionUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// DELETE — remover colaborador
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const { data: school } = await adminClient
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!school) return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })

  const { error } = await adminClient
    .from('school_collaborators')
    .delete()
    .eq('user_id', id)
    .eq('school_id', school.id)

  if (error) return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })

  return NextResponse.json({ success: true })
}

// PATCH — editar nome e/ou senha do colaborador
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as { name?: string; password?: string; avatar_url?: string }

  const { data: school } = await adminClient
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!school) return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })

  const { data: colab } = await adminClient
    .from('school_collaborators')
    .select('id')
    .eq('user_id', id)
    .eq('school_id', school.id)
    .single()

  if (!colab) return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })

  if (body.name) {
    await adminClient
      .from('school_collaborators')
      .update({ name: body.name })
      .eq('user_id', id)
      .eq('school_id', school.id)

    await adminClient
      .from('users')
      .update({ full_name: body.name })
      .eq('id', id)
  }

  if (body.avatar_url) {
    await adminClient
      .from('users')
      .update({ avatar_url: body.avatar_url })
      .eq('id', id)
  }

  if (body.password) {
    const { error } = await adminClient.auth.admin.updateUserById(id, { password: body.password })
    if (error) return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
