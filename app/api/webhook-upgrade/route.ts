import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // MP envia type=payment quando um pagamento é processado
    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    })

    const payment = new Payment(mpClient)
    const paymentData = await payment.get({ id: body.data.id })

    if (paymentData.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    // external_reference: "upgrade|school_id|plano|user_id"
    const ref = paymentData.external_reference || ''
    const parts = ref.split('|')

    if (parts[0] !== 'upgrade' || parts.length < 3) {
      return NextResponse.json({ ok: true })
    }

    const schoolId = parts[1]
    const plano = parts[2]

    if (!schoolId || !['pro', 'enterprise'].includes(plano)) {
      return NextResponse.json({ error: 'Referência inválida' }, { status: 400 })
    }

    // Atualizar plano da escola
    const { error } = await adminClient
      .from('schools')
      .update({ plan: plano })
      .eq('id', schoolId)

    if (error) {
      console.error('Erro ao atualizar plano:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar pagamento
    await adminClient.from('payments').insert({
      school_id: schoolId,
      amount: paymentData.transaction_amount,
      status: 'approved',
      mp_payment_id: String(paymentData.id),
      description: `Upgrade para plano ${plano}`,
    })

    console.log(`Escola ${schoolId} atualizada para plano ${plano}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook upgrade error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
