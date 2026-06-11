import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const payment = new Payment(client)
    const data = await payment.get({ id: body.data.id })

    if (data.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    const [courseId, studentId] = (data.external_reference || '').split('|')
    if (!courseId || !studentId || studentId === 'guest') {
      return NextResponse.json({ ok: true })
    }

    const supabase = await createClient()

    const { data: course } = await supabase
      .from('courses')
      .select('school_id, title')
      .eq('id', courseId)
      .single()

    if (!course) return NextResponse.json({ ok: true })

    // Criar matrícula automaticamente
    await supabase
      .from('enrollments')
      .upsert({
        school_id: course.school_id,
        course_id: courseId,
        student_id: studentId,
        status: 'active',
      }, { onConflict: 'course_id,student_id' })

    // Registrar pagamento
    await supabase
      .from('payments')
      .insert({
        school_id: course.school_id,
        student_id: studentId,
        course_id: courseId,
        amount: data.transaction_amount || 0,
        status: 'approved',
        method: 'pix',
        mp_payment_id: String(data.id),
        paid_at: new Date().toISOString(),
      })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
