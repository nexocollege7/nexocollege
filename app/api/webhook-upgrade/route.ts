import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac, timingSafeEqual } from 'crypto'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const PLANOS_VALIDOS = ['starter', 'creator', 'pro', 'scale', 'enterprise']

function validateMPSignature(
  xSignature: string,
  xRequestId: string,
  paymentId: string,
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhook-upgrade] MP_WEBHOOK_SECRET não configurado — requisição rejeitada')
    return false
  }

  // x-signature: "ts=1704475800,v1=abc123..."
  const sigParts: Record<string, string> = {}
  for (const part of xSignature.split(',')) {
    const idx = part.indexOf('=')
    if (idx !== -1) sigParts[part.slice(0, idx).trim()] = part.slice(idx + 1).trim()
  }

  const ts = sigParts['ts']
  const v1 = sigParts['v1']

  if (!ts || !v1) {
    console.warn('[webhook] x-signature malformado:', xSignature)
    return false
  }

  const tsNum = parseInt(ts, 10)
  if (isNaN(tsNum) || Date.now() / 1000 - tsNum > 300) {
    console.warn('[webhook-upgrade] timestamp expirado ou inválido:', ts)
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
  const adminClient = createAdminClient()

  try {
    const ip = getClientIp(request.headers)
    const { success: rateLimitOk } = await rateLimit(`${ip}:webhook-upgrade`, 60, 60)
    if (!rateLimitOk) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const body = await request.json()

    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    // Validação HMAC — garante que a notificação veio do Mercado Pago
    const xSignature = request.headers.get('x-signature') || ''
    const xRequestId = request.headers.get('x-request-id') || ''
    const paymentId = String(body.data?.id || '')

    if (!validateMPSignature(xSignature, xRequestId, paymentId)) {
      console.error('[webhook] Assinatura HMAC inválida — requisição rejeitada')
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
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

    // FLUXO 1: Upgrade de plano (external_reference: "upgrade|school_id|plano|user_id")
    if (parts[0] === 'upgrade' && parts.length >= 3) {
      const schoolId = parts[1]
      const plano = parts[2]

      if (!schoolId || !PLANOS_VALIDOS.includes(plano)) {
        return NextResponse.json({ error: 'Referência inválida' }, { status: 400 })
      }

      const { error } = await adminClient
        .from('schools')
        .update({ plan: plano })
        .eq('id', schoolId)

      if (error) {
        console.error('Erro ao atualizar plano:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await adminClient.from('payments').insert({
        school_id: schoolId,
        amount: paymentData.transaction_amount,
        status: 'approved',
        mp_payment_id: String(paymentData.id),
        description: `Upgrade para plano ${plano}`,
      })

      console.log(`Escola ${schoolId} atualizada para plano ${plano}`)
      return NextResponse.json({ ok: true })
    }

    // FLUXO 3: Ativação do Módulo Mentor (external_reference: "mentor-addon|school_id|user_id")
    if (parts[0] === 'mentor-addon' && parts.length >= 2) {
      const schoolId = parts[1]

      if (!schoolId) {
        return NextResponse.json({ error: 'Referência inválida' }, { status: 400 })
      }

      const { error } = await adminClient
        .from('schools')
        .update({ mentor_module: true, mentor_module_activated_at: new Date().toISOString() })
        .eq('id', schoolId)

      if (error) {
        console.error('Erro ao ativar Módulo Mentor:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await adminClient.from('payments').insert({
        school_id: schoolId,
        amount: paymentData.transaction_amount,
        status: 'approved',
        mp_payment_id: String(paymentData.id),
        description: 'Módulo Mentor — Add-on anual',
      })

      console.log(`Módulo Mentor ativado para escola ${schoolId}`)
      return NextResponse.json({ ok: true })
    }

    // FLUXO 2: Compra de curso (external_reference: "courseId|userId" ou "courseId|userId|cupom|desconto")
    const isCourseRef = (parts.length === 2 || parts.length === 4) && parts[0] && parts[1] && parts[0] !== 'upgrade'
    if (isCourseRef) {
      const courseId = parts[0]
      const studentId = parts[1]

      console.log(`Processando matrícula: curso ${courseId} aluno ${studentId}`)

      // Busca school_id do curso
      const { data: course } = await adminClient
        .from('courses')
        .select('school_id')
        .eq('id', courseId)
        .single()

      if (!course?.school_id) {
        console.error('Curso não encontrado:', courseId)
        return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
      }

      const { error: enrollError } = await adminClient
        .from('enrollments')
        .upsert({
          student_id: studentId,
          course_id: courseId,
          school_id: course.school_id,
          status: 'active',
          payment_status: 'paid',
          expires_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
        }, { onConflict: 'course_id,student_id' })

      if (enrollError) {
        console.error('Erro ao criar matrícula:', enrollError)
        return NextResponse.json({ error: enrollError.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook upgrade error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
