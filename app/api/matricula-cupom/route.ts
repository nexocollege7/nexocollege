import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { matriculaValida } from '@/lib/enrollment'
import { verificarPermissao } from '@/lib/plan-permissions'

// Matricula o aluno em um curso pago quando ele aplica um cupom de 100% de desconto.
// Tudo é validado aqui no servidor — o navegador nunca decide que o curso é gratuito.
export async function POST(request: NextRequest) {
  try {
    const { courseId, couponCode } = await request.json()

    if (!courseId || !couponCode || typeof couponCode !== 'string') {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const adminClient = createAdminClient()

    const { data: course, error: courseError } = await adminClient
      .from('courses')
      .select('id, price, is_free, coupon_code, coupon_discount_percent, school_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    }

    if (course.is_free) {
      return NextResponse.json({ error: 'Este curso já é gratuito.' }, { status: 400 })
    }

    const { data: school } = await adminClient
      .from('schools')
      .select('plan, suspended_at')
      .eq('id', course.school_id)
      .single()

    if (school?.suspended_at) {
      return NextResponse.json({ error: 'Escola temporariamente indisponível.' }, { status: 403 })
    }

    const permissao = await verificarPermissao({ plan: school?.plan ?? null }, 'coupons')
    if (!permissao.allowed) {
      return NextResponse.json({ error: 'Cupons não disponíveis no plano desta escola.' }, { status: 403 })
    }

    if (!course.coupon_code || course.coupon_code.toUpperCase() !== couponCode.trim().toUpperCase()) {
      return NextResponse.json({ error: 'Cupom inválido.' }, { status: 400 })
    }

    if (Number(course.coupon_discount_percent) < 100) {
      return NextResponse.json({ error: 'Este cupom não libera o curso gratuitamente.' }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + 365 * 86_400_000).toISOString()

    const { data: existing } = await adminClient
      .from('enrollments')
      .select('id, status, expires_at')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existing) {
      if (matriculaValida(existing)) {
        return NextResponse.json({ success: true, already: true })
      }
      const { error: renewError } = await adminClient
        .from('enrollments')
        .update({ status: 'active', expires_at: expiresAt })
        .eq('id', existing.id)
      if (renewError) return NextResponse.json({ error: renewError.message }, { status: 500 })
      return NextResponse.json({ success: true, renewed: true })
    }

    const { error: enrollError } = await adminClient
      .from('enrollments')
      .insert({
        student_id: user.id,
        course_id: courseId,
        school_id: course.school_id,
        status: 'active',
        expires_at: expiresAt,
      })

    if (enrollError) return NextResponse.json({ error: enrollError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
