import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidateTag } from 'next/cache'

const MASTER_EMAIL = process.env.MASTER_EMAIL || process.env.NEXT_PUBLIC_MASTER_EMAIL || 'fe.jose7@gmail.com'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== MASTER_EMAIL) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const plano = await request.json()

    if (!plano.id) {
      return NextResponse.json({ error: 'ID do plano inválido.' }, { status: 400 })
    }

    if (typeof plano.max_collaborators !== 'number' || plano.max_collaborators < 0) {
      return NextResponse.json({ error: 'Máx. colaboradores inválido.' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('plans')
      .update({
        name: plano.name,
        price_yearly: plano.price_yearly,
        max_courses: plano.max_courses,
        max_students: plano.max_students,
        max_storage_gb: plano.max_storage_gb,
        max_collaborators: plano.max_collaborators,
        has_certificate: plano.has_certificate,
        has_custom_domain: plano.has_custom_domain,
        can_use_coupons: plano.can_use_coupons,
        can_use_reviews: plano.can_use_reviews,
        can_use_live_events: plano.can_use_live_events,
        is_active: plano.is_active,
      })
      .eq('id', plano.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidateTag('plans', { expire: 0 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Master planos error:', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
