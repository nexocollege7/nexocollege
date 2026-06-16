import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { courseId } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Você precisa estar logado para comprar um curso.' }, { status: 401 })
    }

    // Busca preço e school_id diretamente do banco — nunca usa preço do cliente
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: course, error: courseError } = await adminClient
      .from('courses')
      .select('school_id, title, price, is_free')
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

    const result = await preference.create({
      body: {
        items: [
          {
            id: courseId,
            title: course.title,
            quantity: 1,
            unit_price: coursePrice,
            currency_id: 'BRL',
          }
        ],
        external_reference: `${courseId}|${user.id}`,
      }
    })

    return NextResponse.json({ url: result.init_point })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    console.error("MP Error FULL:", JSON.stringify(error, null, 2))
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
