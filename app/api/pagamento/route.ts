import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})

export async function POST(request: NextRequest) {
  try {
    const { courseId, courseTitle, price, schoolSlug, courseSlug } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const preference = new Preference(client)

    const result = await preference.create({
      body: {
        items: [
          {
            id: courseId,
            title: courseTitle,
            quantity: 1,
            unit_price: Number(price),
            currency_id: 'BRL',
          }
        ],
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/sucesso?course=${courseId}`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/vitrine/${schoolSlug}/${courseSlug}`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/pendente`,
        },
        auto_return: 'approved',
        external_reference: `${courseId}|${user?.id || 'guest'}`,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pagamento/webhook`,
      }
    })

    return NextResponse.json({ url: result.init_point })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
