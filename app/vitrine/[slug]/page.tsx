import { getSchoolBySlug, getPublishedCourses } from '@/app/actions/vitrine-actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import BannerRotativo from './banner-rotativo'
import HeaderVitrine from './header-vitrine'

export default async function VitrinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const school = await getSchoolBySlug(slug)
  if (!school) notFound()

  const courses = await getPublishedCourses(school.id)
  const cor = school.primary_color || '#AEEA00'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

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

      <HeaderVitrine slug={slug} cor={cor} nomeEscola={school.name} />

      {/* Hero Banner Rotativo */}
      {courses.length > 0 ? (
        <BannerRotativo courses={courses} slug={slug} cor={cor} appUrl={appUrl} />
      ) : (
        <div style={{
          height: '85vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: '16px',
        }}>
          <p style={{ fontSize: '48px' }}>📚</p>
          <p style={{ color: '#888888', fontSize: '18px' }}>Nenhum curso disponível ainda</p>
        </div>
      )}

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
              <Link key={course.id} href={`${appUrl}/vitrine/${slug}/${course.slug}`} className="curso-card">
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

      {/* Footer */}
      <footer className="vitrine-footer" style={{ borderTop: '1px solid #1A1A1A', padding: '24px 48px', textAlign: 'center' }}>
        <p style={{ color: '#333333', fontSize: '13px' }}>
          Powered by <span style={{ color: '#555555', fontWeight: '600' }}>NexoCollege</span>
        </p>
      </footer>
    </div>
  )
}
