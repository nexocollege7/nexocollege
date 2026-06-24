import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

function gerarSlug(nome: string): string {
  const palavras = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)

  let slug = ''
  for (const palavra of palavras) {
    if ((slug + palavra).length > 20) break
    slug += palavra
  }
  return slug || palavras[0]?.slice(0, 20) || ''
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  if (!checkRateLimit(`verificar-slug:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: 'Muitas tentativas.' }, { status: 429 })
  }

  const { nomeEscola } = await request.json()
  if (!nomeEscola?.trim()) {
    return NextResponse.json({ error: 'Nome inválido' }, { status: 400 })
  }

  const slugBase = gerarSlug(nomeEscola)
  if (!slugBase) {
    return NextResponse.json({ error: 'Nome inválido' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: existente } = await adminClient
    .from('schools')
    .select('id')
    .eq('slug', slugBase)
    .maybeSingle()

  if (!existente) {
    return NextResponse.json({ disponivel: true, slug: slugBase })
  }

  // Gerar sugestões
  const sugestoes: string[] = []
  for (let i = 1; i <= 3; i++) {
    const candidato = `${slugBase}${i}`
    const { data: existe } = await adminClient
      .from('schools')
      .select('id')
      .eq('slug', candidato)
      .maybeSingle()
    if (!existe) sugestoes.push(candidato)
    if (sugestoes.length >= 2) break
  }

  return NextResponse.json({ disponivel: false, slug: slugBase, sugestoes })
}
