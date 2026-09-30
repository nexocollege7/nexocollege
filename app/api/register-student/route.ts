import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'
import { validateEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = await rateLimit(`${ip}:register-student`, RATE_LIMITS.default.limit, RATE_LIMITS.default.window)
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
    const { userId, email, fullName, schoolId } = await request.json()

    if (!userId || !schoolId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json({ error: 'Por favor, informe um e-mail válido.' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Validar que o userId existe no auth.users antes de prosseguir
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(userId)
    if (authError || !authUser?.user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Bloquear se o email já está cadastrado como admin ou owner de outra escola
    const { data: existingUser } = await adminClient
      .from('users')
      .select('role, school_id')
      .eq('id', userId)
      .single()

    if (existingUser?.role === 'admin' || existingUser?.role === 'owner') {
      return NextResponse.json({
        error: 'Este e-mail já está cadastrado como administrador de uma escola. Use um e-mail diferente para se cadastrar como aluno.',
      }, { status: 409 })
    }

    // Valida que a escola existe antes de associar
    const { data: school } = await adminClient
      .from('schools')
      .select('id')
      .eq('id', schoolId)
      .single()

    if (!school) {
      return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })
    }

    const { error } = await adminClient
      .from('users')
      .update({ school_id: schoolId, full_name: fullName, role: 'student' })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
