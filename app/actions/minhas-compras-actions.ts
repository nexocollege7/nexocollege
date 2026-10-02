'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type CompraPendente = {
  id: string
  status: string
  courseTitle: string
  valor: number | null
  cupom: string | null
  link: string
  thumbnailUrl: string | null
  schoolName: string
}

type LinhaPedido = {
  id: string
  status: string
  school_id: string
  course_id: string
  coupon_code: string | null
  expected_amount: number | string | null
  course: { title: string; slug: string; price: number | string | null; thumbnail_url: string | null } | null
}

// Pedidos de PIX manual em aberto do aluno logado (para a seção "Compras em andamento").
export async function getMinhasComprasPendentes(): Promise<CompraPendente[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()
  const agora = new Date().toISOString()

  const { data: pedidos } = await admin
    .from('pending_enrollments')
    .select('id, status, school_id, course_id, coupon_code, expected_amount, course:courses ( title, slug, price, thumbnail_url )')
    .eq('student_id', user.id)
    .in('status', ['awaiting_payment', 'awaiting_release', 'refused'])
    .gt('expires_at', agora)
    .order('created_at', { ascending: false })
    .returns<LinhaPedido[]>()

  if (!pedidos || pedidos.length === 0) return []

  // Ignora cursos que o aluno já tem liberados
  const { data: matriculas } = await admin
    .from('enrollments')
    .select('course_id, status, expires_at')
    .eq('student_id', user.id)
    .in('course_id', pedidos.map((p) => p.course_id))
  const liberados = new Set(
    (matriculas ?? [])
      .filter((m) => m.status === 'active' && (!m.expires_at || m.expires_at > agora))
      .map((m) => m.course_id)
  )

  const schoolIds = Array.from(new Set(pedidos.map((p) => p.school_id)))
  const { data: escolas } = await admin.from('schools').select('id, slug, name').in('id', schoolIds)
  const slugPorEscola = new Map((escolas ?? []).map((e) => [e.id, e.slug as string]))
  const nomePorEscola = new Map((escolas ?? []).map((e) => [e.id, (e.name as string) ?? '']))

  return pedidos
    .filter((p) => p.course && !liberados.has(p.course_id) && slugPorEscola.get(p.school_id))
    .map((p) => {
      const valor = p.expected_amount != null ? Number(p.expected_amount)
        : p.course?.price != null ? Number(p.course.price) : null
      const cupom = p.coupon_code ?? null
      const link = `https://${slugPorEscola.get(p.school_id)}.nexocollege.com.br/vitrine/${slugPorEscola.get(p.school_id)}/${p.course!.slug}/pix` +
        (cupom ? `?cupom=${encodeURIComponent(cupom)}` : '')
      return {
        id: p.id, status: p.status, courseTitle: p.course!.title, valor, cupom, link,
        thumbnailUrl: p.course!.thumbnail_url ?? null,
        schoolName: nomePorEscola.get(p.school_id) ?? '',
      }
    })
}
