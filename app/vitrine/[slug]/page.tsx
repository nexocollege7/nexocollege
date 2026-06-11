import { getSchoolBySlug, getPublishedCourses } from '@/app/actions/vitrine-actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function VitrinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const school = await getSchoolBySlug(slug)
  if (!school) notFound()

  const courses = await getPublishedCourses(school.id)
  const destaque = courses[0] || null
  const cor = school.primary_color || '#AEEA00'

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
        .header-fixo {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          background: linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%);
          padding: 16px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      `}</style>

      {/* Header */}
      <header className="header-fixo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            backgroundColor: cor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: '700', color: '#0D0D0D',
          }}>
            {school.name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#F0F0F0' }}>
            {school.name}
          </span>
        </div>
        <Link href={`/vitrine/${slug}/login`} style={{
          padding: '8px 20px', borderRadius: '8px',
          backgroundColor: cor, color: '#0D0D0D',
          fontWeight: '700', fontSize: '14px', textDecoration: 'none',
        }}>
          Entrar
        </Link>
      </header>

      {/* Hero Banner */}
      {destaque ? (
        <div style={{
          position: 'relative', height: '85vh', minHeight: '500px',
          display: 'flex', alignItems: 'flex-end',
          backgroundColor: '#111111',
          overflow: 'hidden',
        }}>
          {/* Imagem de fundo */}
          {destaque.thumbnail_url && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0,
              backgroundImage: `url(${destaque.thumbnail_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
          )}

          {/* Gradiente sobre a imagem */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: `linear-gradient(to right, rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.4) 100%),
                         linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 60%),
                         radial-gradient(ellipse at 70% 50%, ${cor}22 0%, transparent 60%)`,
          }} />

          {/* Conteúdo */}
          <div style={{ position: 'relative', zIndex: 2, padding: '0 48px 80px', maxWidth: '600px' }}>
            <div style={{
              display: 'inline-block', fontSize: '11px', fontWeight: '700',
              color: cor, textTransform: 'uppercase', letterSpacing: '0.12em',
              marginBottom: '12px',
            }}>
              EM DESTAQUE
            </div>
            <h1 style={{
              fontSize: '52px', fontWeight: '800', color: '#F0F0F0',
              lineHeight: '1.1', margin: '0 0 16px',
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
            }}>
              {destaque.title}
            </h1>
            {destaque.description && (
              <p style={{
                fontSize: '16px', color: '#BBBBBB', lineHeight: '1.6',
                margin: '0 0 32px', maxWidth: '480px',
              }}>
                {destaque.description}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link href={`/vitrine/${slug}/${destaque.slug}`} style={{
                padding: '14px 32px', borderRadius: '8px',
                backgroundColor: cor, color: '#0D0D0D',
                fontWeight: '800', fontSize: '15px',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}>
                ▶ Ver curso
              </Link>
              <div style={{
                padding: '14px 24px', borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#F0F0F0', fontWeight: '700', fontSize: '15px',
              }}>
                {destaque.is_free ? '🎁 Gratuito' : `R$ ${Number(destaque.price).toFixed(2)}`}
              </div>
              <div style={{
                padding: '14px 24px', borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#BBBBBB', fontSize: '14px',
              }}>
                {destaque.total_lessons} aulas
              </div>
            </div>
          </div>
        </div>
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
        <div style={{ padding: '48px 48px 80px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: '0 0 24px' }}>
            Todos os cursos
            <span style={{ color: '#555555', fontSize: '15px', fontWeight: '400', marginLeft: '12px' }}>
              {courses.length} disponível{courses.length !== 1 ? 'is' : ''}
            </span>
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            {courses.map((course) => (
              <Link key={course.id} href={`/vitrine/${slug}/${course.slug}`} className="curso-card">
                {/* Capa */}
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

                {/* Info */}
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
      <footer style={{ borderTop: '1px solid #1A1A1A', padding: '24px 48px', textAlign: 'center' }}>
        <p style={{ color: '#333333', fontSize: '13px' }}>
          Powered by <span style={{ color: '#555555', fontWeight: '600' }}>NexoCollege</span>
        </p>
      </footer>
    </div>
  )
}