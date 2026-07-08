import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId } = body
    const couponCode: string | undefined = body.couponCode

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Você precisa estar logado para comprar um curso.' }, { status: 401 })
    }

    const { success } = await rateLimit(`${getClientIp(request.headers)}:pagamento`, RATE_LIMITS.payment.limit, RATE_LIMITS.payment.window)
    if (!success) return NextResponse.json({ error: 'Muitas requisições. Tente novamente em alguns instantes.' }, { status: 429 })

    // Busca preço e school_id diretamente do banco — nunca usa preço do cliente
    const adminClient = createAdminClient()

    const { data: course, error: courseError } = await adminClient
      .from('courses')
      .select('school_id, title, price, is_free, coupon_code, coupon_discount_percent')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    if (course.is_free) {
      return NextResponse.json({ error: 'Este curso é gratuito.' }, { status: 400 })
    }

    const coursePrice = Number(course.price)
    if (!coursePrice || coursePrice <= 0) {
      return NextResponse.json({ error: 'Este curso não tem preço configurado.' }, { status: 400 })
    }

    // Aplicar cupom se fornecido — desconto vem sempre do banco, nunca do cliente
    let finalPrice = coursePrice
    let appliedCoupon = ''
    let appliedDiscount = 0

    if (couponCode && course.coupon_code && course.coupon_discount_percent) {
      if (course.coupon_code.toUpperCase() === couponCode.trim().toUpperCase()) {
        appliedDiscount = course.coupon_discount_percent
        finalPrice = Math.round(coursePrice * (1 - appliedDiscount / 100) * 100) / 100
        appliedCoupon = course.coupon_code.toUpperCase()
      }
    }

    // Busca o token da escola
    const { data: school, error: schoolError } = await adminClient
      .from('schools')
      .select('mp_access_token')
      .eq('id', course.school_id)
      .single()

    if (schoolError || !school?.mp_access_token) {
      return NextResponse.json(
        { error: 'Esta escola ainda não configurou o gateway de pagamento.' },
        { status: 400 }
      )
    }

    // Cria o client do MP com o token DA ESCOLA
    const mpClient = new MercadoPagoConfig({
      accessToken: school.mp_access_token
    })

    const preference = new Preference(mpClient)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexocollege.com.br'

    const result = await preference.create({
      body: {
        items: [
          {
            id: courseId,
            title: course.title,
            quantity: 1,
            unit_price: finalPrice,
            currency_id: 'BRL',
          }
        ],
        external_reference: `${courseId}|${user.id}|${appliedCoupon}|${appliedDiscount}`,
        statement_descriptor: "NEXOTECNOLOGIA",
        notification_url: `${baseUrl}/api/pagamento/webhook`,
      }
    })

    return NextResponse.json({ url: result.init_point })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    console.error("MP Error:", error instanceof Error ? { name: error.name, message: error.message } : String(error))
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
