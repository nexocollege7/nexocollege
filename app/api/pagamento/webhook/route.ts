import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac } from 'crypto'

function validateMPSignature(
  xSignature: string,
  xRequestId: string,
  paymentId: string,
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhook/pagamento] MP_WEBHOOK_SECRET não configurado — requisição rejeitada')
    return false
  }

  const sigParts: Record<string, string> = {}
  for (const part of xSignature.split(',')) {
    const idx = part.indexOf('=')
    if (idx !== -1) sigParts[part.slice(0, idx).trim()] = part.slice(idx + 1).trim()
  }

  const ts = sigParts['ts']
  const v1 = sigParts['v1']

  if (!ts || !v1) {
    console.warn('[webhook/pagamento] x-signature malformado:', xSignature)
    return false
  }

  const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`
  const computed = createHmac('sha256', secret).update(manifest).digest('hex')
  return computed === v1
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const xSignature = request.headers.get('x-signature') || ''
    const xRequestId = request.headers.get('x-request-id') || ''
    const paymentId = String(body.data?.id || '')

    if (!validateMPSignature(xSignature, xRequestId, paymentId)) {
      console.error('[webhook/pagamento] Assinatura HMAC inválida — requisição rejeitada')
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    const payment = new Payment(client)
    const data = await payment.get({ id: body.data.id })

    if (data.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    const parts = (data.external_reference || '').split('|')
    const [courseId, studentId, couponUsed, discountUsed] = parts
    if (!courseId || !studentId || studentId === 'guest') {
      return NextResponse.json({ ok: true })
    }

    // Admin client bypasses RLS — webhook não tem sessão de usuário
    const adminClient = createAdminClient()

    const { data: course } = await adminClient
      .from('courses')
      .select('school_id, title')
      .eq('id', courseId)
      .single()

    if (!course) return NextResponse.json({ ok: true })

    // Criar matrícula automaticamente
    await adminClient
      .from('enrollments')
      .upsert({
        school_id: course.school_id,
        course_id: courseId,
        student_id: studentId,
        status: 'active',
        payment_status: 'paid',
        expires_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
      }, { onConflict: 'course_id,student_id' })

    // Registrar pagamento
    await adminClient
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
        ...(couponUsed ? { coupon_code: couponUsed, discount_percent: Number(discountUsed) || 0 } : {}),
      })

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    console.error('Webhook error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
