import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const msg = searchParams.get('msg') ?? ''
  const supabase = await createClient()
  await supabase.auth.signOut()
  const loginUrl = new URL('/login', request.url)
  if (msg) loginUrl.searchParams.set('msg', msg)
  return NextResponse.redirect(loginUrl)
}
