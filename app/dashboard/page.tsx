import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getDashboardStats } from '@/app/actions/analytics-actions'
import OnboardingBanner from '@/components/OnboardingBanner'
import AnalyticsSection from '@/app/dashboard/analytics-section'
import Link from 'next/link'
import { elegivelParaMentorModule } from '@/lib/mentor-module'
import { PLAN_LABELS } from '@/lib/plan-features'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const getDashboardData = unstable_cache(
    async () => {
      const adminClient = createAdminClient()

      const { data: profile } = await adminClient
        .from('users')
        .select('role, school_id, full_name')
        .eq('id', user.id)
        .single()

      const { data: escola } = await adminClient
        .from('schools')
        .select('id, name, slug, primary_color, plan, mentor_module')
        .eq('id', profile?.school_id)
        .single()

      const { data: planoLimites } = await adminClient
        .from('plans')
        .select('max_students, max_courses')
        .eq('slug', escola?.plan ?? 'starter')
        .single()

      const { count: totalCursos } = await adminClient
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', escola?.id)

      return { profile, escola, planoLimites, totalCursos }
    },
    [`dashboard-page-${user.id}`],
    { revalidate: 120, tags: [`user-${user.id}`] }
  )

  const { profile, escola, planoLimites, totalCursos } = await getDashboardData()

  const role = profile?.role || 'student'

  if (role === 'student') redirect('/dashboard/meus-cursos')

  const isPrimeiroAcesso = (totalCursos || 0) === 0

  const stats = await getDashboardStats(escola?.id)

  if (isPrimeiroAcesso) {
    return (
      <OnboardingBanner
        nomeEscola={escola?.name || 'Sua Escola'}
        slug={escola?.slug || ''}
        nomeUsuario={profile?.full_name || ''}
      />
    )
  }

  if (!stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <p style={{ color: '#888888' }}>Carregando...</p>
      </div>
    )
  }

  const cor = escola?.primary_color || '#AEEA00'

  const temAnalytics = ['pro', 'scale', 'enterprise'].includes(escola?.plan ?? '')

  const pctAlunos = planoLimites?.max_students ? (stats.totalAlunos / planoLimites.max_students) * 100 : 0
  const pctCursos = planoLimites?.max_courses ? (stats.totalCursos / planoLimites.max_courses) * 100 : 0
  const mostrarBannerLimite = (pctAlunos >= 80 || pctCursos >= 80) && !['starter', 'enterprise'].includes(escola?.plan ?? '')
  const podeCriarCurso = stats.totalCursos < (planoLimites?.max_courses ?? 1)

  const cards = [
    { label: 'Alunos Ativos', value: stats.totalAlunos, icon: '👥', color: '#60A5FA', bg: '#1E3A5F', link: '/dashboard/alunos' },
    { label: 'Cursos', value: stats.totalCursos, icon: '📚', color: cor, bg: '#1A2E00', link: '/dashboard/cursos' },
    { label: 'Certificados', value: stats.totalCertificados, icon: '🏆', color: '#FACC15', bg: '#2E2100', link: '/dashboard/certificados' },
    { label: 'Receita Total', value: `R$ ${stats.receita.toFixed(2)}`, icon: '💰', color: '#7C4DFF', bg: '#1E0E3F', link: null },
  ]

  const acessoRapido = [
    { label: 'Novo Curso', icon: '➕', href: '/dashboard/cursos/novo', cor: cor },
    { label: 'Ver Alunos', icon: '👥', href: '/dashboard/alunos', cor: '#60A5FA' },
    { label: 'Mensagens', icon: '💬', href: '/dashboard/mensagens', cor: '#7C4DFF' },
    { label: 'Minha Vitrine', icon: '🌐', href: '/dashboard/vitrine', cor: '#FACC15' },
    { label: 'Minha Escola', icon: '🏫', href: '/dashboard/escola', cor: '#888888' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>{`
        @media (max-width: 768px) {
          .cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dashboard-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .dashboard-header a { width: 100% !important; text-align: center !important; }
          .matriculas-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Banner de Upgrade — aparece só para plano Starter */}
      {escola?.plan === 'starter' || !escola?.plan ? (
        <div style={{
          background: 'linear-gradient(135deg, #1a2000, #2a3500)',
          border: '1px solid rgba(174,234,0,0.3)',
          borderRadius: '14px',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ color: '#AEEA00', fontWeight: '800', fontSize: '15px', margin: '0 0 4px' }}>
              ⚡ Você está no plano Gratuito
            </p>
            <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
              Faça upgrade para criar mais cursos e desbloquear recursos avançados
            </p>
          </div>
          <Link href="/dashboard/upgrade" style={{
            background: '#AEEA00', color: '#0D0D0D',
            fontWeight: '800', fontSize: '14px',
            padding: '10px 22px', borderRadius: '10px',
            textDecoration: 'none', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            Ver planos →
          </Link>
        </div>
      ) : null}

      {/* Banner do Módulo Mentor — escolas elegíveis que ainda não ativaram */}
      {elegivelParaMentorModule(escola?.plan) && !escola?.mentor_module ? (
        <div style={{
          background: 'linear-gradient(135deg, #1a1130, #1e0e3f)',
          border: '1px solid rgba(124,77,255,0.3)',
          borderRadius: '14px',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ color: '#7C4DFF', fontWeight: '800', fontSize: '15px', margin: '0 0 4px' }}>
              🎓 Novo: Módulo Mentor
            </p>
            <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
              Venda mentorias com turmas, vagas e cronograma — +R$ 1.597/ano
            </p>
          </div>
          <Link href="/dashboard/mentor-module" style={{
            background: '#7C4DFF', color: '#fff',
            fontWeight: '800', fontSize: '14px',
            padding: '10px 22px', borderRadius: '10px',
            textDecoration: 'none', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            Conheça o Módulo Mentor →
          </Link>
        </div>
      ) : null}

      {/* Banner de Limite — alunos ou cursos perto do limite do plano */}
      {mostrarBannerLimite ? (
        <div style={{
          background: 'linear-gradient(135deg, #0d1f00, #14290a)',
          border: '1px solid rgba(174,234,0,0.4)',
          borderRadius: '14px',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ color: '#AEEA00', fontWeight: '800', fontSize: '15px', margin: '0 0 4px' }}>
              🎉 Parabéns! Sua escola está crescendo!
            </p>
            {pctAlunos >= 80 && (
              <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
                Você já tem {stats.totalAlunos} alunos — está quase no limite do plano {PLAN_LABELS[escola?.plan ?? 'starter']}.
              </p>
            )}
            {pctCursos >= 80 && (
              <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
                Você já tem {stats.totalCursos} cursos — está quase no limite do plano {PLAN_LABELS[escola?.plan ?? 'starter']}.
              </p>
            )}
          </div>
          <Link href="/dashboard/upgrade" style={{
            background: '#AEEA00', color: '#0D0D0D',
            fontWeight: '800', fontSize: '14px',
            padding: '10px 22px', borderRadius: '10px',
            textDecoration: 'none', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            Fazer upgrade →
          </Link>
        </div>
      ) : null}

      {/* Header */}
      <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>
            Ola, {profile?.full_name || 'Professor'}!
          </h1>
          <p style={{ color: '#888888', marginTop: '4px', fontSize: '14px' }}>
            Visao geral de <strong style={{ color: cor }}>{escola?.name}</strong>
          </p>
        </div>
        {podeCriarCurso ? (
          <Link href="/dashboard/cursos/novo" style={{
            backgroundColor: cor, color: '#0D0D0D', fontWeight: '700',
            fontSize: '14px', padding: '10px 20px', borderRadius: '8px',
            textDecoration: 'none',
          }}>
            + Novo Curso
          </Link>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: '#2A2A2A', color: '#666666', fontWeight: '700',
              fontSize: '14px', padding: '10px 20px', borderRadius: '8px',
              cursor: 'not-allowed',
            }}>
              🔒 Novo Curso
            </span>
            <Link href="/dashboard/upgrade" style={{ color: cor, fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>
              Limite do plano atingido — fazer upgrade
            </Link>
          </div>
        )}
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="cards-grid">
        {cards.map((card) => (
          <div key={card.label} style={{
            backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A',
            borderRadius: '12px', padding: '20px',
            cursor: card.link ? 'pointer' : 'default',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>{card.label}</p>
              <div style={{ width: '36px', height: '36px', backgroundColor: card.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '16px' }}>{card.icon}</span>
              </div>
            </div>
            <p style={{ fontSize: '28px', fontWeight: '700', color: card.color, margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {temAnalytics ? (
        <AnalyticsSection corEscola={cor} />
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #1a2000, #2a3500)',
          border: '1px solid rgba(174,234,0,0.3)',
          borderRadius: '14px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ color: '#AEEA00', fontWeight: '800', fontSize: '15px', margin: '0 0 4px' }}>
              📊 Analytics Gerencial disponível no plano Pro
            </p>
            <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
              Tome decisões baseadas em dados — veja matrículas, receita e progresso dos alunos em tempo real.
            </p>
          </div>
          <Link href="/dashboard/upgrade" style={{
            background: '#AEEA00', color: '#0D0D0D',
            fontWeight: '800', fontSize: '14px',
            padding: '10px 22px', borderRadius: '10px',
            textDecoration: 'none', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            Conhecer o plano Pro →
          </Link>
        </div>
      )}

      {/* Acesso rapido */}
      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
        <h2 style={{ color: '#888888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 16px' }}>Acesso Rapido</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {acessoRapido.map((item) => {
            const bloqueado = item.label === 'Novo Curso' && !podeCriarCurso
            return bloqueado ? (
              <span key={item.href} title="Limite de cursos do plano atingido — faça upgrade para criar mais" style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', borderRadius: '8px',
                border: '1px solid #2A2A2A', backgroundColor: '#111111',
                color: '#555555', fontSize: '13px', fontWeight: '500',
                cursor: 'not-allowed',
              }}>
                <span style={{ fontSize: '16px' }}>🔒</span>
                {item.label}
              </span>
            ) : (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', borderRadius: '8px',
                border: '1px solid #2A2A2A', backgroundColor: '#111111',
                textDecoration: 'none', color: '#CCCCCC', fontSize: '13px', fontWeight: '500',
                transition: 'border-color 0.2s',
              }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Matriculas e pagamentos */}
      <div className="matriculas-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '14px', margin: '0 0 16px' }}>Matriculas Recentes</h2>
          {stats.matriculasRecentes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: '#555555', fontSize: '14px', margin: '0 0 8px' }}>Nenhuma matricula ainda</p>
              <Link href="/dashboard/vitrine" style={{ color: cor, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
                Compartilhe sua vitrine
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.matriculasRecentes.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: cor }}>
                      {(m.users?.full_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ color: '#F0F0F0', fontSize: '13px', fontWeight: '500', margin: 0 }}>{m.users?.full_name || 'Aluno'}</p>
                      <p style={{ color: '#888888', fontSize: '11px', margin: 0 }}>{m.courses?.title}</p>
                    </div>
                  </div>
                  <p style={{ color: '#555555', fontSize: '11px', margin: 0 }}>{new Date(m.enrolled_at).toLocaleDateString('pt-BR')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '14px', margin: '0 0 16px' }}>Ultimos Pagamentos</h2>
          {stats.pagamentos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: '#555555', fontSize: '14px', margin: '0 0 8px' }}>Nenhum pagamento ainda</p>
              <Link href="/dashboard/escola" style={{ color: cor, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
                Configurar Mercado Pago
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.pagamentos.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#AEEA00', borderRadius: '50%' }} />
                    <p style={{ color: '#F0F0F0', fontSize: '13px', margin: 0 }}>Aprovado</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '600', margin: 0 }}>R$ {Number(p.amount).toFixed(2)}</p>
                    <p style={{ color: '#555555', fontSize: '11px', margin: 0 }}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
