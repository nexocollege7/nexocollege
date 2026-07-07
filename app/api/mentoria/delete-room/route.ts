import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface CohortRow {
  id: string
  daily_room_name: string | null
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

    const adminClient = createAdminClient()

    const { data, error: cohortError } = await adminClient
      .from('mentorship_cohorts')
      .select(`
        id,
        daily_room_name,
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

    const roomName = cohort.daily_room_name

    if (roomName) {
      const apiKey = process.env.DAILY_API_KEY
      if (!apiKey) {
        return NextResponse.json({ error: 'DAILY_API_KEY não configurado' }, { status: 500 })
      }

      const dailyRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!dailyRes.ok && dailyRes.status !== 404) {
        const errText = await dailyRes.text()
        return NextResponse.json({ error: `Daily.co error: ${errText}` }, { status: 502 })
      }
    }

    const { error: updateError } = await adminClient
      .from('mentorship_cohorts')
      .update({
        live_url: null,
        daily_room_name: null,
        live_active: false,
      })
      .eq('id', cohortId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
