import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'
import { validateEmail, sendEmail } from '@/lib/email'

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

function sanitizeSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = await rateLimit(`${ip}:register-school`, RATE_LIMITS.default.limit, RATE_LIMITS.default.window)
  if (!success) return NextResponse.json({ error: 'Muitas requisições. Tente novamente em alguns instantes.' }, { status: 429 })
  const { success: canRegister } = await rateLimit(
    `${ip}:register-account`,
    3,
    86400
  )
  if (!canRegister) return NextResponse.json(
    { error: 'Limite de criação de contas atingido para este IP. Tente novamente em 24 horas.' },
    { status: 429 }
  )

  try {
    const { nome, email, password, nomeEscola, termosAceitos, slug: slugDesejado } = await request.json()

    if (!nome || !email || !password || !nomeEscola) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Por favor, informe um e-mail válido.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'A senha precisa ter pelo menos 8 caracteres.' }, { status: 400 })
    }

    if (!termosAceitos) {
      return NextResponse.json({ error: 'Voce precisa aceitar os termos de uso para continuar.' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Criação do usuário — o Supabase retorna erro "already registered" se o email
    // já existir, tratado logo abaixo. O pre-check via listUsers() foi removido pois
    // era O(n) com limite de 1000 usuários e desnecessário dado o tratamento de erro.
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
    const slugBase = slugDesejado ? (sanitizeSlug(slugDesejado) || gerarSlug(nomeEscola)) : gerarSlug(nomeEscola)

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
        registration_ip: ip ?? null,
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

    // Notificar master (AJUSTE 4A) — falha silenciosa para não bloquear o cadastro
    const masterEmail = process.env.MASTER_EMAIL
    if (masterEmail) {
      const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      sendEmail(
        masterEmail,
        'Nova escola cadastrada — NexoCollege',
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0D0D0D;color:#F0F0F0;padding:32px;border-radius:12px">
          <h2 style="color:#AEEA00;margin:0 0 24px">Nova escola cadastrada</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="color:#888;padding:8px 0;font-size:14px">Nome</td><td style="color:#F0F0F0;padding:8px 0;font-size:14px">${nomeEscola}</td></tr>
            <tr><td style="color:#888;padding:8px 0;font-size:14px">Slug</td><td style="color:#AEEA00;padding:8px 0;font-size:14px">${slug}</td></tr>
            <tr><td style="color:#888;padding:8px 0;font-size:14px">E-mail do dono</td><td style="color:#F0F0F0;padding:8px 0;font-size:14px">${email}</td></tr>
            <tr><td style="color:#888;padding:8px 0;font-size:14px">Plano</td><td style="color:#7C4DFF;padding:8px 0;font-size:14px">Starter</td></tr>
            <tr><td style="color:#888;padding:8px 0;font-size:14px">Data/hora</td><td style="color:#F0F0F0;padding:8px 0;font-size:14px">${dataHora}</td></tr>
          </table>
        </div>`
      ).catch(() => undefined)
    }

    return NextResponse.json({ success: true, slug })

  } catch {
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
