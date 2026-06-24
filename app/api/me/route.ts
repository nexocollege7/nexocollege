import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ id: null, role: null, school_id: null, isMaster: false })

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('users')
    .select('id, role, school_id, full_name')
    .eq('id', user.id)
    .single()

  const masterEmail = process.env.MASTER_EMAIL

  return NextResponse.json({
    id: user.id,
    role: profile?.role || 'student',
    school_id: profile?.school_id || null,
    full_name: profile?.full_name || user.email,
    isMaster: user.email === masterEmail,
  })
}
