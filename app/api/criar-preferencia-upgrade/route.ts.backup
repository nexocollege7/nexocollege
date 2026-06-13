import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PLANOS_NOMES: Record<string, string> = {
  pro: 'NexoCollege Pro — Plano Anual',
  enterprise: 'NexoCollege Enterprise — Plano Anual',
}

const PLANOS_KEYS: Record<string, string> = {
  pro: 'pro_price_yearly',
  enterprise: 'enterprise_price_yearly',
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

    // Buscar escola do usuário via adminClient (bypassa RLS)
    const adminClient = createAdminClient()
    console.log('user.id:', user.id)
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single()

    console.log('profile:', JSON.stringify(profile))
    console.log('profileError:', JSON.stringify(profileError))

    if (!profile?.school_id) {
      return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })
    }

    // Buscar valor do plano na tabela platform_settings
    const { data: setting } = await adminClient
      .from('platform_settings')
      .select('value')
      .eq('key', PLANOS_KEYS[plano])
      .single()

    if (!setting?.value) {
      return NextResponse.json({ error: 'Valor do plano não configurado. Contate o suporte.' }, { status: 400 })
    }

    const preco = Number(setting.value)
    if (isNaN(preco) || preco <= 0) {
      return NextResponse.json({ error: 'Valor do plano inválido.' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexocollege.com.br'

    // Usar token do MASTER para receber o pagamento
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
      }
    })

    return NextResponse.json({ url: result.init_point })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    console.error('Upgrade MP Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
