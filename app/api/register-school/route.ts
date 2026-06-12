import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    + '-' + Date.now()
}

export async function POST(request: Request) {
  try {
    const { nome, email, password, nomeEscola } = await request.json()

    if (!nome || !email || !password || !nomeEscola) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: nome },
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'Este email já está cadastrado.' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Erro ao criar conta. Tente novamente.' }, { status: 500 })
    }

    const userId = authData.user.id
    const slug = gerarSlug(nomeEscola)

    // 2. Criar escola
    const { data: escola, error: escolaError } = await adminClient
      .from('schools')
      .insert({
        name: nomeEscola,
        slug,
        plan: 'starter',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (escolaError) {
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Erro ao criar escola. Tente novamente.' }, { status: 500 })
    }

    // 3. Verificar se perfil já existe (criado pelo trigger do Supabase)
    const { data: perfilExistente } = await adminClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (perfilExistente) {
      // Perfil já existe — apenas atualizar role e school_id
      const { error: updateError } = await adminClient
        .from('users')
        .update({
          full_name: nome,
          role: 'admin',
          school_id: escola.id,
        })
        .eq('id', userId)

      if (updateError) {
        await adminClient.auth.admin.deleteUser(userId)
        await adminClient.from('schools').delete().eq('id', escola.id)
        return NextResponse.json({ error: 'Erro ao configurar perfil. Tente novamente.' }, { status: 500 })
      }
    } else {
      // Perfil não existe — inserir
      const { error: insertError } = await adminClient
        .from('users')
        .insert({
          id: userId,
          full_name: nome,
          role: 'admin',
          school_id: escola.id,
          created_at: new Date().toISOString(),
        })

      if (insertError) {
        await adminClient.auth.admin.deleteUser(userId)
        await adminClient.from('schools').delete().eq('id', escola.id)
        return NextResponse.json({ error: 'Erro ao configurar perfil. Tente novamente.' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, slug })

  } catch (err) {
    console.log('ERRO GERAL:', err)
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
