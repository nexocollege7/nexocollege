import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { verificarPermissao } from '@/lib/plan-permissions'

export async function POST(request: NextRequest) {
  try {
    const { courseId, couponCode } = await request.json()

    if (!courseId || !couponCode) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: course, error } = await adminClient
      .from('courses')
      .select('price, is_free, coupon_code, coupon_discount_percent, school_id')
      .eq('id', courseId)
      .single()

    if (error || !course) {
      return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    }

    if (course.is_free) {
      return NextResponse.json({ error: 'Este curso é gratuito.' }, { status: 400 })
    }

    const { data: school } = await adminClient
      .from('schools')
      .select('plan')
      .eq('id', course.school_id)
      .single()

    const permissao = await verificarPermissao({ plan: school?.plan ?? null }, 'coupons')
    if (!permissao.allowed) {
      return NextResponse.json({ error: 'Cupons não disponíveis no plano desta escola.' }, { status: 403 })
    }

    if (!course.coupon_code || !course.coupon_discount_percent) {
      return NextResponse.json({ error: 'Cupom inválido.' }, { status: 400 })
    }

    if (course.coupon_code.toUpperCase() !== couponCode.trim().toUpperCase()) {
      return NextResponse.json({ error: 'Cupom inválido.' }, { status: 400 })
    }

    const originalPrice = Number(course.price)
    const discountPercent = course.coupon_discount_percent
    const finalPrice = Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100

    return NextResponse.json({
      valid: true,
      couponCode: course.coupon_code.toUpperCase(),
      discountPercent,
      originalPrice,
      finalPrice,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
