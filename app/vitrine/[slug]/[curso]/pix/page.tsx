import { getSchoolBySlug, getCourseBySlug } from '@/app/actions/vitrine-actions'
import { notFound, redirect } from 'next/navigation'
import { PixCheckout } from './pix-checkout'

export default async function PixCheckoutPage({
  params
}: {
  params: Promise<{ slug: string; curso: string }>
}) {
  const { slug, curso } = await params
  const school = await getSchoolBySlug(slug)
  if (!school) notFound()

  const course = await getCourseBySlug(curso, school.id)
  if (!course) notFound()

  if (!school.pix_key || course.is_free) {
    redirect(`/vitrine/${slug}/${curso}`)
  }

  return (
    <PixCheckout
      courseId={course.id}
      courseTitle={course.title}
      coursePrice={Number(course.price)}
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
