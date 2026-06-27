import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { verificarPermissao, PLAN_LABELS } from '@/lib/plan-permissions'

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

// GET — listar colaboradores da escola
export async function GET() {
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: school } = await adminClient
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!school) return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })

  const { data, error } = await adminClient
    .from('school_collaborators')
    .select('*')
    .eq('school_id', school.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST — adicionar colaborador
export async function POST(req: NextRequest) {
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { name, email, password, permissions } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nome, email e senha são obrigatórios.' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  // Buscar escola do dono
  const { data: school } = await adminClient
    .from('schools')
    .select('id, plan')
    .eq('owner_id', user.id)
    .single()

  if (!school) return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })

  const permissao = await verificarPermissao({ plan: school.plan ?? null }, 'collaborators')
  if (!permissao.allowed) {
    const planoLabel = permissao.upgradeRequired ? PLAN_LABELS[permissao.upgradeRequired] ?? permissao.upgradeRequired : 'superior'
    return NextResponse.json({ error: `Colaboradores não disponíveis no seu plano. Faça upgrade para o plano ${planoLabel}.` }, { status: 403 })
  }

  const { data: planRow } = await adminClient
    .from('plans')
    .select('max_collaborators')
    .eq('slug', school.plan ?? 'starter')
    .maybeSingle()

  const limiteColaboradores = planRow?.max_collaborators ?? 0

  const { count } = await adminClient
    .from('school_collaborators')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', school.id)

  if ((count ?? 0) >= limiteColaboradores) {
    return NextResponse.json({ error: `Limite de ${limiteColaboradores} colaborador(es) do seu plano atingido.` }, { status: 400 })
  }

  // Busca usuário por email via REST API do GoTrue (O(1), sem paginação)
  // O SDK instalado não expõe getUserByEmail, mas o endpoint suporta filtro por email
  const authRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}&per_page=1`,
    { headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: process.env.SUPABASE_SERVICE_ROLE_KEY! } }
  )
  const authJson: { users?: { id: string; email: string }[] } = await authRes.json()
  const existingUser = authJson.users?.find(u => u.email === email) ?? null

  let collaboratorUserId: string

  if (existingUser) {
    // Usuário já existe — usar o id existente
    collaboratorUserId = existingUser.id
  } else {
    // Criar novo usuário
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })
    collaboratorUserId = newUser.user.id

    // Criar perfil em public.users
    await adminClient.from('users').upsert({
      id: collaboratorUserId,
      full_name: name,
      role: 'collaborator',
      school_id: school.id,
    }, { onConflict: 'id' })
  }

  // Verificar se já é colaborador desta escola
  const { data: existing } = await adminClient
    .from('school_collaborators')
    .select('id')
    .eq('school_id', school.id)
    .eq('user_id', collaboratorUserId)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Este email já é colaborador desta escola.' }, { status: 400 })
  }

  // Adicionar como colaborador
  const { data, error } = await adminClient
    .from('school_collaborators')
    .insert({
      school_id: school.id,
      user_id: collaboratorUserId,
      name,
      email,
      permissions: permissions ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
