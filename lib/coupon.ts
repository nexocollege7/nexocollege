import { createAdminClient } from '@/lib/supabase/admin'
import { verificarPermissao } from '@/lib/plan-permissions'

export type ValorComCupom = {
  originalPrice: number
  finalPrice: number
  couponCode: string | null
  discountPercent: number
}

// Calcula no servidor o valor do curso com o cupom informado.
// Cupom ausente, inválido ou não permitido pelo plano → preço cheio.
export async function calcularValorComCupom(
  courseId: string,
  couponCode?: string | null
): Promise<ValorComCupom | null> {
  const admin = createAdminClient()
  const { data: course } = await admin
    .from('courses')
    .select('price, is_free, coupon_code, coupon_discount_percent, school_id')
    .eq('id', courseId)
    .single()

  if (!course) return null

  const originalPrice = Number(course.price)
  const cheio: ValorComCupom = { originalPrice, finalPrice: originalPrice, couponCode: null, discountPercent: 0 }

  const codigo = (couponCode ?? '').trim().toUpperCase()
  if (!codigo || course.is_free || !course.coupon_code || !course.coupon_discount_percent) return cheio
  if (String(course.coupon_code).toUpperCase() !== codigo) return cheio

  const { data: school } = await admin
    .from('schools')
    .select('plan')
    .eq('id', course.school_id)
    .single()

  const permissao = await verificarPermissao({ plan: school?.plan ?? null }, 'coupons')
  if (!permissao.allowed) return cheio

  const pct = Number(course.coupon_discount_percent)
  const finalPrice = Math.max(0, Math.round(originalPrice * (1 - pct / 100) * 100) / 100)
  return { originalPrice, finalPrice, couponCode: codigo, discountPercent: pct }
}
