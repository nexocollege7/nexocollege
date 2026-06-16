import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

function gerarSlug(nome: string): string {
  // Normalizar: remover acentos e caracteres especiais
  const palavras = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)

  // Juntar palavras até o limite de 20 caracteres (palavra completa)
  let slug = ''
  for (const palavra of palavras) {
    if ((slug + palavra).length > 20) break
    slug += palavra
  }

  return slug || palavras[0].slice(0, 20)
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  if (!checkRateLimit(`register-school:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 1 hora.' },
      { status: 429 }
    )
  }

  try {
    const { nome, email, password, nomeEscola, termosAceitos } = await request.json()

    if (!nome || !email || !password || !nomeEscola) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, { status: 400 })
    }

    if (!termosAceitos) {
      return NextResponse.json({ error: 'Voce precisa aceitar os termos de uso para continuar.' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: nome },
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'Este email ja esta cadastrado.' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Erro ao criar conta. Tente novamente.' }, { status: 500 })
    }

    const userId = authData.user.id
    const slugBase = gerarSlug(nomeEscola)

    // Garantir slug único
    let slug = slugBase
    let tentativa = 1
    while (true) {
      const { data: existente } = await adminClient
        .from('schools')
        .select('id')
        .eq('slug', slug)
        .single()
      if (!existente) break
      slug = slugBase + tentativa
      tentativa++
    }

    const { data: escola, error: escolaError } = await adminClient
      .from('schools')
      .insert({
        name: nomeEscola,
        slug,
        plan: 'starter',
        owner_id: userId,
        terms_accepted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (escolaError) {
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Erro ao criar escola. Tente novamente.' }, { status: 500 })
    }

    const { data: perfilExistente } = await adminClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (perfilExistente) {
      const { error: updateError } = await adminClient
        .from('users')
        .update({ full_name: nome, role: 'admin', school_id: escola.id })
        .eq('id', userId)

      if (updateError) {
        await adminClient.auth.admin.deleteUser(userId)
        await adminClient.from('schools').delete().eq('id', escola.id)
        return NextResponse.json({ error: 'Erro ao configurar perfil. Tente novamente.' }, { status: 500 })
      }
    } else {
      const { error: insertError } = await adminClient
        .from('users')
        .insert({ id: userId, full_name: nome, role: 'admin', school_id: escola.id, created_at: new Date().toISOString() })

      if (insertError) {
        await adminClient.auth.admin.deleteUser(userId)
        await adminClient.from('schools').delete().eq('id', escola.id)
        return NextResponse.json({ error: 'Erro ao configurar perfil. Tente novamente.' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, slug })

  } catch {
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
