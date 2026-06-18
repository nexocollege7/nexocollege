import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { elegivelParaMentorModule, MENTOR_MODULE_PRICE_YEARLY } from '@/lib/mentor-module'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const adminClient = createAdminClient()

    const { data: profile } = await adminClient
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single()

    if (!profile?.school_id) {
      return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })
    }

    const { data: school } = await adminClient
      .from('schools')
      .select('id, plan, mentor_module')
      .eq('id', profile.school_id)
      .single()

    if (!school) {
      return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })
    }

    if (!elegivelParaMentorModule(school.plan)) {
      return NextResponse.json({ error: 'O Módulo Mentor está disponível a partir do plano Creator.' }, { status: 400 })
    }

    if (school.mentor_module) {
      return NextResponse.json({ error: 'O Módulo Mentor já está ativo nesta escola.' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexocollege.com.br'

    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    })

    const preference = new Preference(mpClient)

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'mentor-module',
            title: 'NexoCollege — Módulo Mentor (Add-on Anual)',
            quantity: 1,
            unit_price: MENTOR_MODULE_PRICE_YEARLY,
            currency_id: 'BRL',
          }
        ],
        external_reference: `mentor-addon|${school.id}|${user.id}`,
        back_urls: {
          success: `${baseUrl}/pagamento/mentor-sucesso`,
          failure: `${baseUrl}/dashboard/mentor-module?erro=pagamento`,
          pending: `${baseUrl}/dashboard/mentor-module?status=pendente`,
        },
      }
    })

    return NextResponse.json({ url: result.init_point })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    console.error('Mentor addon MP Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
