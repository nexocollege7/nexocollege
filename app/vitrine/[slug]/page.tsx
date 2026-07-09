import { getSchoolBySlug, getPublishedCourses, getPublishedMentorships, getActiveReviews } from '@/app/actions/vitrine-actions'

export const revalidate = 300 // 5 minutos

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const school = await getSchoolBySlug(slug)
  return {
    title: school?.name ?? 'NexoCollege',
    icons: {
      icon: school?.logo_url
        ? [{ url: school.logo_url, type: 'image/png' }]
        : [
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          ],
      shortcut: school?.logo_url ?? '/favicon.ico',
      apple: school?.logo_url ?? '/apple-touch-icon.png',
    },
  }
}
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { GraduationCap } from 'lucide-react'
import HeaderVitrine from './header-vitrine'
import { DepoimentosVitrine } from './depoimentos-vitrine'
import { LiveBanner } from './live-banner'

export default async function VitrinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const school = await getSchoolBySlug(slug)
  if (!school) notFound()

  const [courses, mentorias, reviews] = await Promise.all([
    getPublishedCourses(school.id),
    getPublishedMentorships(school.id),
    getActiveReviews(school.id),
  ])
  const cor = school.primary_color || '#AEEA00'
  const mentoriasAbertas = mentorias.filter((m) => m.has_open_cohort)

  const host = (await headers()).get('host') || ''
  const isSubdomain = host.endsWith('.nexocollege.com.br') && !host.startsWith('www.')
  const basePath = isSubdomain ? '' : `/vitrine/${slug}`

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0D', fontFamily: 'sans-serif' }}>

      <style>{`
        .curso-card {
          background-color: #1A1A1A;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #2A2A2A;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
          text-decoration: none;
          display: block;
        }
        .curso-card:hover {
          transform: scale(1.03);
          border-color: ${cor};
        }
        @media (max-width: 768px) {
          .vitrine-grid-section { padding: 32px 20px 60px !important; }
          .vitrine-footer { padding: 20px !important; }
        }
        @media (max-width: 480px) {
          .vitrine-grid-section { padding: 24px 16px 48px !important; }
          .vitrine-cursos-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <HeaderVitrine slug={slug} cor={cor} nomeEscola={school.name} basePath={basePath} logoUrl={school.logo_url ?? null} />

      {/* Hero — Banner Rotativo, ou transmissão ao vivo quando ativa */}
      <LiveBanner
        schoolId={school.id}
        liveUrlInitial={school.live_url ?? null}
        liveActiveInitial={school.live_active ?? false}
        courses={courses}
        mentorias={mentoriasAbertas}
        slug={slug}
        cor={cor}
        basePath={basePath}
      />

      {/* Grid de Cursos */}
      {courses.length > 0 && (
        <div className="vitrine-grid-section" style={{ padding: '48px 48px 80px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: '0 0 24px' }}>
            Todos os cursos
            <span style={{ color: '#555555', fontSize: '15px', fontWeight: '400', marginLeft: '12px' }}>
              {courses.length} disponível{courses.length !== 1 ? 'is' : ''}
            </span>
          </h2>

          <div className="vitrine-cursos-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            {courses.map((course) => (
              <Link key={course.id} href={`${basePath}/${course.slug}`} className="curso-card">
                <div style={{
                  height: '160px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundImage: course.thumbnail_url ? `url(${course.thumbnail_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  background: course.thumbnail_url
                    ? undefined
                    : `linear-gradient(135deg, ${cor}33, ${cor}11)`,
                  borderBottom: `3px solid ${cor}`,
                }}>
                  {!course.thumbnail_url && <span style={{ fontSize: '48px' }}>📖</span>}
                </div>

                <div style={{ padding: '16px' }}>
                  <h3 style={{
                    color: '#F0F0F0', fontWeight: '600', fontSize: '15px',
                    margin: '0 0 8px', lineHeight: '1.3',
                  }}>
                    {course.title}
                  </h3>
                  {course.description && (
                    <p style={{
                      color: '#888888', fontSize: '13px', margin: '0 0 16px',
                      lineHeight: '1.5', overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {course.description}
                    </p>
                  )}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: '12px', borderTop: '1px solid #2A2A2A',
                  }}>
                    <span style={{ color: '#555555', fontSize: '12px' }}>
                      {course.total_lessons} aulas
                    </span>
                    <span style={{
                      fontWeight: '800', fontSize: '16px',
                      color: course.is_free ? cor : '#F0F0F0',
                    }}>
                      {course.is_free ? 'Gratuito' : `R$ ${Number(course.price).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Grid de Mentorias */}
      {mentoriasAbertas.length > 0 && (
        <div className="vitrine-grid-section" style={{ padding: '0 48px 80px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: '0 0 24px' }}>
            Mentorias
            <span style={{ color: '#555555', fontSize: '15px', fontWeight: '400', marginLeft: '12px' }}>
              {mentoriasAbertas.length} disponível{mentoriasAbertas.length !== 1 ? 'is' : ''}
            </span>
          </h2>

          <div className="vitrine-cursos-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            {mentoriasAbertas.map((m) => (
              <Link key={m.id} href={`${basePath}/mentorias/${m.slug}`} className="curso-card">
                <div style={{
                  height: '160px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundImage: m.cover_url ? `url(${m.cover_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  background: m.cover_url
                    ? undefined
                    : `linear-gradient(135deg, #7C4DFF33, #7C4DFF11)`,
                  borderBottom: '3px solid #7C4DFF',
                }}>
                  {!m.cover_url && <GraduationCap size={40} color="#7C4DFF" />}
                </div>

                <div style={{ padding: '16px' }}>
                  <h3 style={{
                    color: '#F0F0F0', fontWeight: '600', fontSize: '15px',
                    margin: '0 0 8px', lineHeight: '1.3',
                  }}>
                    {m.title}
                  </h3>
                  {m.description && (
                    <p style={{
                      color: '#888888', fontSize: '13px', margin: '0 0 16px',
                      lineHeight: '1.5', overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {m.description}
                    </p>
                  )}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: '12px', borderTop: '1px solid #2A2A2A',
                  }}>
                    <span style={{ color: m.has_open_cohort ? '#AEEA00' : '#555555', fontSize: '12px' }}>
                      {m.has_open_cohort ? 'Inscrições abertas' : 'Sem turma aberta'}
                    </span>
                    <span style={{
                      fontWeight: '800', fontSize: '16px',
                      color: Number(m.price) <= 0 ? '#7C4DFF' : '#F0F0F0',
                    }}>
                      {Number(m.price) <= 0 ? 'Gratuita' : `R$ ${Number(m.price).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Depoimentos */}
      <DepoimentosVitrine reviews={reviews} cor={cor} />

      {/* Footer */}
      <footer className="vitrine-footer" style={{ borderTop: '1px solid #1A1A1A', padding: '24px 48px', textAlign: 'center' }}>
        <p style={{ color: '#333333', fontSize: '13px' }}>
          Powered by <span style={{ color: '#555555', fontWeight: '600' }}>NexoCollege</span>
        </p>
      </footer>
    </div>
  )
}
