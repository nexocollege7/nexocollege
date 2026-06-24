import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PLANOS_NOMES: Record<string, string> = {
  creator: 'NexoCollege Creator — Plano Anual',
  pro: 'NexoCollege Pro — Plano Anual',
  scale: 'NexoCollege Scale — Plano Anual',
}

export async function POST(request: NextRequest) {
  try {
    const { plano } = await request.json()

    if (!plano || !PLANOS_NOMES[plano]) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const adminClient = createAdminClient()

    // Buscar escola do usuário
    const { data: profile } = await adminClient
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single()

    if (!profile?.school_id) {
      return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })
    }

    // Buscar preço na tabela plans pelo slug
    const { data: planData } = await adminClient
      .from('plans')
      .select('price_yearly, name')
      .eq('slug', plano)
      .eq('is_active', true)
      .single()

    if (!planData?.price_yearly) {
      return NextResponse.json({ error: 'Plano não encontrado ou sem preço configurado.' }, { status: 400 })
    }

    const preco = Number(planData.price_yearly)
    if (isNaN(preco) || preco <= 0) {
      return NextResponse.json({ error: 'Valor do plano inválido.' }, { status: 400 })
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
            id: plano,
            title: PLANOS_NOMES[plano],
            quantity: 1,
            unit_price: preco,
            currency_id: 'BRL',
          }
        ],
        external_reference: `upgrade|${profile.school_id}|${plano}|${user.id}`,
        back_urls: {
          success: `${baseUrl}/pagamento/upgrade-sucesso?plano=${plano}`,
          failure: `${baseUrl}/dashboard/upgrade?erro=pagamento`,
          pending: `${baseUrl}/dashboard/upgrade?status=pendente`,
        },
        notification_url: `${baseUrl}/api/webhook-upgrade`,
      }
    })

    return NextResponse.json({ url: result.init_point })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    console.error('Upgrade MP Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
