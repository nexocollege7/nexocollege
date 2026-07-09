import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { cohortId } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Você precisa estar logado para se inscrever.' }, { status: 401 })
    }

    const { success } = await rateLimit(`${getClientIp(request.headers)}:pagamento-mentoria`, RATE_LIMITS.payment.limit, RATE_LIMITS.payment.window)
    if (!success) return NextResponse.json({ error: 'Muitas requisições. Tente novamente em alguns instantes.' }, { status: 429 })

    const adminClient = createAdminClient()

    const { data: cohort, error: cohortError } = await adminClient
      .from('mentorship_cohorts')
      .select('id, mentorship_id, max_students, status, enrollment_start, enrollment_end')
      .eq('id', cohortId)
      .single()

    if (cohortError || !cohort) {
      return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 })
    }

    if (cohort.status !== 'open') {
      return NextResponse.json({ error: 'Esta turma não está com inscrições abertas.' }, { status: 400 })
    }

    const now = new Date()
    if (cohort.enrollment_start && now < new Date(cohort.enrollment_start)) {
      return NextResponse.json({ error: 'As inscrições ainda não começaram.' }, { status: 400 })
    }
    if (cohort.enrollment_end && now > new Date(cohort.enrollment_end)) {
      return NextResponse.json({ error: 'As inscrições já encerraram.' }, { status: 400 })
    }

    const { count } = await adminClient
      .from('mentorship_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('cohort_id', cohortId)

    if ((count ?? 0) >= cohort.max_students) {
      return NextResponse.json({ error: 'Vagas esgotadas para esta turma.' }, { status: 400 })
    }

    const { data: existing } = await adminClient
      .from('mentorship_enrollments')
      .select('id')
      .eq('cohort_id', cohortId)
      .eq('student_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Você já está inscrito nesta turma.' }, { status: 400 })
    }

    const { data: mentorship, error: mentorshipError } = await adminClient
      .from('mentorships')
      .select('school_id, title, price, slug')
      .eq('id', cohort.mentorship_id)
      .single()

    if (mentorshipError || !mentorship) {
      return NextResponse.json({ error: 'Mentoria não encontrada' }, { status: 404 })
    }

    const price = Number(mentorship.price)
    if (!price || price <= 0) {
      return NextResponse.json({ error: 'Esta mentoria é gratuita.' }, { status: 400 })
    }

    const { data: school, error: schoolError } = await adminClient
      .from('schools')
      .select('mp_access_token, slug')
      .eq('id', mentorship.school_id)
      .single()

    if (schoolError || !school?.mp_access_token) {
      return NextResponse.json(
        { error: 'Esta escola ainda não configurou o gateway de pagamento.' },
        { status: 400 }
      )
    }

    const mpClient = new MercadoPagoConfig({
      accessToken: school.mp_access_token
    })

    const preference = new Preference(mpClient)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexocollege.com.br'

    const result = await preference.create({
      body: {
        items: [
          {
            id: cohortId,
            title: `Mentoria: ${mentorship.title}`,
            quantity: 1,
            unit_price: price,
            currency_id: 'BRL',
          }
        ],
        external_reference: `mentoria|${cohortId}|${user.id}`,
        statement_descriptor: "NEXOTECNOLOGIA",
        notification_url: `${baseUrl}/api/pagamento/webhook?school_id=${mentorship.school_id}`,
        back_urls: {
          success: `${baseUrl}/dashboard/minhas-mentorias`,
          failure: `${baseUrl}/vitrine/${school.slug}/mentorias/${mentorship.slug}?erro=pagamento`,
          pending: `${baseUrl}/vitrine/${school.slug}/mentorias/${mentorship.slug}?status=pendente`,
        },
      }
    })

    return NextResponse.json({ url: result.init_point })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    console.error('Mentoria MP Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
