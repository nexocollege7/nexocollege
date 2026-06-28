import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac, timingSafeEqual } from 'crypto'

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

  const tsNum = parseInt(ts, 10)
  if (isNaN(tsNum) || Date.now() / 1000 - tsNum > 300) {
    console.warn('[webhook/pagamento] timestamp expirado ou inválido:', ts)
    return false
  }

  const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`
  const computed = createHmac('sha256', secret).update(manifest).digest('hex')
  const computedBuf = Buffer.from(computed, 'hex')
  const v1Buf = Buffer.from(v1, 'hex')
  if (computedBuf.length !== v1Buf.length) return false
  return timingSafeEqual(computedBuf, v1Buf)
}

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

    // Admin client bypasses RLS — webhook não tem sessão de usuário
    const adminClient = createAdminClient()

    // Sempre usa o token master para buscar o pagamento no MP
    const accessToken = process.env.MP_ACCESS_TOKEN!

    const mpClient = new MercadoPagoConfig({ accessToken })
    const payment = new Payment(mpClient)
    const data = await payment.get({ id: body.data.id })

    if (data.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    const parts = (data.external_reference || '').split('|')

    // FLUXO: Inscrição em mentoria (external_reference: "mentoria|cohort_id|student_id")
    if (parts[0] === 'mentoria' && parts.length >= 3) {
      const cohortId = parts[1]
      const mentorshipStudentId = parts[2]
      if (!cohortId || !mentorshipStudentId) {
        return NextResponse.json({ ok: true })
      }

      const { data: cohort } = await adminClient
        .from('mentorship_cohorts')
        .select('mentorship_id')
        .eq('id', cohortId)
        .single()

      if (!cohort) return NextResponse.json({ ok: true })

      const { error: enrollError } = await adminClient
        .from('mentorship_enrollments')
        .upsert({
          cohort_id: cohortId,
          student_id: mentorshipStudentId,
          payment_id: String(data.id),
          payment_status: 'paid',
        }, { onConflict: 'cohort_id,student_id' })

      if (enrollError) {
        console.error('Erro ao criar inscrição de mentoria:', enrollError)
        return NextResponse.json({ ok: true })
      }

      const { data: mentorship } = await adminClient
        .from('mentorships')
        .select('school_id, title')
        .eq('id', cohort.mentorship_id)
        .single()

      if (mentorship) {
        await adminClient.from('payments').insert({
          school_id: mentorship.school_id,
          student_id: mentorshipStudentId,
          amount: data.transaction_amount || 0,
          status: 'approved',
          method: 'pix',
          mp_payment_id: String(data.id),
          paid_at: new Date().toISOString(),
          description: `Mentoria: ${mentorship.title}`,
        })
      }

      return NextResponse.json({ ok: true })
    }

    const [courseId, studentId, couponUsed, discountUsed] = parts
    if (!courseId || !studentId || studentId === 'guest') {
      return NextResponse.json({ ok: true })
    }

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
