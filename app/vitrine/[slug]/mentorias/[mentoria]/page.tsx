import Image from 'next/image'
import { getSchoolBySlug, getMentorshipBySlug } from '@/app/actions/vitrine-actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, GraduationCap, Calendar, Users } from 'lucide-react'
import { MentoriaPayButton } from './mentoria-pay-button'

export default async function MentoriaDetalhePage({
  params
}: {
  params: Promise<{ slug: string; mentoria: string }>
}) {
  const { slug, mentoria: mentoriaSlug } = await params
  const school = await getSchoolBySlug(slug)
  if (!school) notFound()

  const mentoria = await getMentorshipBySlug(mentoriaSlug, school.id)
  if (!mentoria) notFound()

  const cor = school.primary_color || '#7C4DFF'
  const isFree = Number(mentoria.price) <= 0
  const turmasAbertas = mentoria.cohorts.filter((c: any) => c.status === 'open')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0D', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '1px solid #1A1A1A', backgroundColor: '#111111' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: cor }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: '#F0F0F0', fontWeight: '700', fontSize: '16px', margin: 0 }}>{school.name}</h1>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <Link href={`/vitrine/${slug}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          color: '#888888', fontSize: '13px', marginBottom: '32px', textDecoration: 'none',
        }}>
          <ArrowLeft size={16} />
          Voltar para a vitrine
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '100px', backgroundColor: 'rgba(124,77,255,0.15)', color: '#7C4DFF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Mentoria
              </span>
              <h2 style={{ color: '#F0F0F0', fontSize: '28px', fontWeight: '800', margin: '12px 0 0' }}>{mentoria.title}</h2>
              {mentoria.description && (
                <p style={{ color: '#CCCCCC', fontSize: '15px', lineHeight: '1.6', margin: '16px 0 0' }}>{mentoria.description}</p>
              )}
            </div>

            {mentoria.classes.length > 0 && (
              <div>
                <h3 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: '700', margin: '0 0 16px' }}>Cronograma</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {mentoria.classes.map((c: any, i: number) => (
                    <div key={c.id} style={{
                      padding: '14px 16px', backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: '10px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#7C4DFF', fontSize: '12px', fontWeight: '700' }}>{i + 1}.</span>
                        <span style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600' }}>{c.title}</span>
                      </div>
                      {c.summary && <p style={{ color: '#888888', fontSize: '13px', margin: '6px 0 0' }}>{c.summary}</p>}
                      {c.scheduled_at && (
                        <p style={{ color: '#555555', fontSize: '12px', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={12} /> {new Date(c.scheduled_at).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: '16px',
              padding: '24px', position: 'sticky' as const, top: '24px',
            }}>
              {mentoria.cover_url ? (
                <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '10px', marginBottom: '16px', overflow: 'hidden' }}>
                  <Image src={mentoria.cover_url} alt={mentoria.title} fill style={{ objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{
                  width: '100%', height: '140px', borderRadius: '10px', marginBottom: '16px',
                  background: `linear-gradient(135deg, ${cor}33, ${cor}11)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <GraduationCap size={36} color={cor} />
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                {isFree ? (
                  <span style={{ color: '#AEEA00', fontSize: '26px', fontWeight: '800' }}>Gratuita</span>
                ) : (
                  <span style={{ color: '#F0F0F0', fontSize: '26px', fontWeight: '800' }}>
                    R$ {Number(mentoria.price).toFixed(2)}
                  </span>
                )}
              </div>

              {turmasAbertas.length === 0 ? (
                <p style={{ color: '#666666', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>
                  Nenhuma turma com inscrições abertas no momento.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {turmasAbertas.map((c: any) => {
                    const vagasRestantes = Math.max(c.max_students - c.enrolled_count, 0)
                    const esgotada = vagasRestantes === 0
                    return (
                      <div key={c.id} style={{ borderTop: '1px solid #1A1A1A', paddingTop: '14px' }}>
                        <p style={{ color: '#CCCCCC', fontSize: '13px', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={13} /> {esgotada ? 'Vagas esgotadas' : `${vagasRestantes} vaga${vagasRestantes !== 1 ? 's' : ''} restante${vagasRestantes !== 1 ? 's' : ''}`}
                        </p>
                        {(c.enrollment_start || c.enrollment_end) && (
                          <p style={{ color: '#555555', fontSize: '12px', margin: '0 0 10px' }}>
                            Inscrições: {c.enrollment_start ? new Date(c.enrollment_start).toLocaleDateString('pt-BR') : '—'}
                            {' a '}
                            {c.enrollment_end ? new Date(c.enrollment_end).toLocaleDateString('pt-BR') : '—'}
                          </p>
                        )}
                        {esgotada ? (
                          <button disabled style={{
                            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                            backgroundColor: '#222222', color: '#555555', fontWeight: '700', fontSize: '14px', cursor: 'not-allowed',
                          }}>
                            Vagas esgotadas
                          </button>
                        ) : (
                          <MentoriaPayButton
                            cohortId={c.id}
                            isFree={isFree}
                            schoolSlug={slug}
                            mentorshipSlug={mentoriaSlug}
                            primaryColor={cor}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <p style={{ color: '#555555', fontSize: '11px', textAlign: 'center', marginTop: '16px' }}>
                {isFree ? 'Sem necessidade de cartão' : 'Pagamento seguro via Mercado Pago'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid #1A1A1A', marginTop: '60px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#444444', fontSize: '13px' }}>
            Powered by <span style={{ color: '#888888', fontWeight: '600' }}>NexoCollege</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
