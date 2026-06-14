import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

const PLANOS_VALIDOS = ['starter', 'creator', 'pro', 'scale', 'enterprise']

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

    // FLUXO 2: Compra de curso (external_reference: "courseId|userId")
    if (parts.length === 2 && parts[0] && parts[1]) {
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
