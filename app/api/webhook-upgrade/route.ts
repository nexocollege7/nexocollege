import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

const PLANOS_VALIDOS = ['starter', 'creator', 'pro', 'scale', 'enterprise']

function validateMPSignature(
  xSignature: string,
  xRequestId: string,
  paymentId: string,
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[webhook] MP_WEBHOOK_SECRET não configurado — validação HMAC desativada')
    return true
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

  const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`
  const computed = createHmac('sha256', secret).update(manifest).digest('hex')
  return computed === v1
}

export async function POST(request: NextRequest) {
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
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

      // Verifica se já está matriculado
      const { data: existing } = await adminClient
        .from('enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .single()

      if (!existing) {
        // Cria matrícula
        const { error: enrollError } = await adminClient
          .from('enrollments')
          .insert({
            student_id: studentId,
            course_id: courseId,
            school_id: course.school_id,
            status: 'active',
            payment_status: 'paid',
          })

        if (enrollError) {
          console.error('Erro ao criar matrícula:', enrollError)
          return NextResponse.json({ error: enrollError.message }, { status: 500 })
        }

        console.log(`Matrícula criada: aluno ${studentId} no curso ${courseId}`)
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook upgrade error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
