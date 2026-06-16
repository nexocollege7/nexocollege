import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { validateEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  if (!checkRateLimit(`register-student:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 1 hora.' },
      { status: 429 }
    )
  }

  try {
    // Verificar sessão do usuário
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { userId, email, fullName, schoolId } = await request.json()

    if (!userId || !schoolId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json({ error: 'Por favor, informe um e-mail válido.' }, { status: 400 })
    }

    // Usuário autenticado só pode atualizar seu próprio perfil
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Operação não permitida' }, { status: 403 })
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
