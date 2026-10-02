import { getSchoolBySlug, getCourseBySlug } from '@/app/actions/vitrine-actions'
import { notFound, redirect } from 'next/navigation'
import { PixCheckout } from './pix-checkout'
import { calcularValorComCupom } from '@/lib/coupon'

export default async function PixCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; curso: string }>
  searchParams: Promise<{ cupom?: string }>
}) {
  const { slug, curso } = await params
  const school = await getSchoolBySlug(slug)
  if (!school) notFound()

  const course = await getCourseBySlug(curso, school.id)
  if (!course) notFound()

  if (!school.pix_key || school.payment_pix_enabled === false || course.is_free) {
    redirect(`/vitrine/${slug}/${curso}`)
  }

  const { cupom } = await searchParams
  const valor = await calcularValorComCupom(course.id, cupom)
  // Cupom de 100% é tratado na página do curso (liberação direta)
  if (valor?.couponCode && valor.finalPrice <= 0) {
    redirect(`/vitrine/${slug}/${curso}`)
  }

  return (
    <PixCheckout
      courseId={course.id}
      courseTitle={course.title}
      coursePrice={valor?.finalPrice ?? Number(course.price)}
      originalPrice={valor?.originalPrice ?? Number(course.price)}
      couponCode={valor?.couponCode ?? null}
      discountPercent={valor?.discountPercent ?? 0}
      schoolId={school.id}
      schoolSlug={slug}
      courseSlug={course.slug}
      pixKey={school.pix_key}
      pixHolderName={school.pix_holder_name}
      whatsappContact={school.whatsapp_contact}
      primaryColor={school.primary_color || '#22c55e'}
    />
  )
}
