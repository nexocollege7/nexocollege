import { getSchoolBySlug, getCourseBySlug } from '@/app/actions/vitrine-actions'

export const revalidate = 300 // 5 minutos
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, GraduationCap, Clock, Users } from 'lucide-react'
import { PayButton } from './pay-button'

export default async function CursoDetalhePage({
  params
}: {
  params: Promise<{ slug: string; curso: string }>
}) {
  const { slug, curso } = await params
  const school = await getSchoolBySlug(slug)
  if (!school) notFound()

  const course = await getCourseBySlug(curso, school.id)
  if (!course) notFound()

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: school.primary_color || '#22c55e' }}
          >
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">{school.name}</h1>
            {school.description && (
              <p className="text-gray-400 text-sm">{school.description}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <Link
          href={`/vitrine/${slug}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para todos os cursos
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-900 text-green-300">
                  Publicado
                </span>
              </div>
              <h2 className="text-3xl font-bold text-white">{course.title}</h2>
              {course.description && (
                <p className="text-gray-300 mt-4 text-lg leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-6 py-4 border-t border-b border-gray-800">
              <div className="flex items-center gap-2 text-gray-400">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">{course.total_lessons} aulas</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span className="text-sm">Acesso imediato</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Acesso vitalício</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sticky top-6">
              <div
                className="w-full h-32 rounded-lg mb-4 flex items-center justify-center"
                style={{ backgroundColor: school.primary_color || '#22c55e' }}
              >
                <BookOpen className="w-12 h-12 text-white opacity-80" />
              </div>

              <div className="mb-4">
                {course.is_free ? (
                  <span className="text-3xl font-bold text-green-400">Gratuito</span>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-white">
                      R$ {Number(course.price).toFixed(2)}
                    </span>
                    <p className="text-gray-400 text-sm mt-1">Pagamento único</p>
                  </div>
                )}
              </div>

              <PayButton
                courseId={course.id}
                courseTitle={course.title}
                price={course.price}
                isFree={course.is_free}
                schoolSlug={slug}
                courseSlug={course.slug}
                primaryColor={school.primary_color || '#22c55e'}
                hasCoupon={!!(course as any).coupon_code}
                hasPix={!!school.pix_key}
                hasToken={!!school.mp_access_token}
                escolaSuspensa={!!school.suspended_at}
              />

              <p className="text-gray-500 text-xs text-center mt-3">
                {course.is_free ? 'Sem necessidade de cartão' : 'Pagamento seguro via Mercado Pago'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center">
          <p className="text-gray-600 text-sm">
            Powered by <span className="text-gray-400 font-medium">NexoCollege</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
