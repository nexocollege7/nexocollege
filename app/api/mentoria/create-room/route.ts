import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'

interface DailyRoom {
  id: string
  name: string
  url: string
  created_at: string
}

interface CohortRow {
  id: string
  mentorships: {
    mentor_id: string | null
    school_id: string
    schools: {
      owner_id: string
    }
  } | null
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { cohortId?: unknown }
    const cohortId = typeof body.cohortId === 'string' ? body.cohortId : null
    if (!cohortId) {
      return NextResponse.json({ error: 'cohortId obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { success } = await rateLimit(`${getClientIp(request.headers)}:create-room`, RATE_LIMITS.daily.limit, RATE_LIMITS.daily.window)
    if (!success) return NextResponse.json({ error: 'Muitas requisições. Tente novamente em alguns instantes.' }, { status: 429 })

    const adminClient = createAdminClient()

    const { data, error: cohortError } = await adminClient
      .from('mentorship_cohorts')
      .select(`
        id,
        mentorships (
          mentor_id,
          school_id,
          schools ( owner_id )
        )
      `)
      .eq('id', cohortId)
      .single()

    if (cohortError || !data) {
      return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 })
    }

    const cohort = data as unknown as CohortRow
    const mentorship = cohort.mentorships

    if (!mentorship) {
      return NextResponse.json({ error: 'Mentoria não encontrada' }, { status: 404 })
    }

    const isOwner = mentorship.schools?.owner_id === user.id
    const isMentor = mentorship.mentor_id === user.id

    if (!isOwner && !isMentor) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const apiKey = process.env.DAILY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'DAILY_API_KEY não configurado' }, { status: 500 })
    }

    const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        properties: {
          exp: Math.floor(Date.now() / 1000) + 7200,
        },
      }),
    })

    if (!dailyRes.ok) {
      const errText = await dailyRes.text()
      return NextResponse.json({ error: `Daily.co error: ${errText}` }, { status: 502 })
    }

    const room = (await dailyRes.json()) as DailyRoom

    const { error: updateError } = await adminClient
      .from('mentorship_cohorts')
      .update({
        live_url: room.url,
        daily_room_name: room.name,
        live_active: true,
      })
      .eq('id', cohortId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ url: room.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
