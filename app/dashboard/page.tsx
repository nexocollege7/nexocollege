import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getDashboardStats } from '@/app/actions/analytics-actions'
import OnboardingBanner from '@/components/OnboardingBanner'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  // Buscar perfil com school_id
  const { data: profile } = await adminClient
    .from('users')
    .select('role, school_id, full_name')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'student'

  // Aluno vai direto para meus-cursos
  if (role === 'student') {
    redirect('/dashboard/meus-cursos')
  }

  // Buscar dados da escola
  const { data: escola } = await adminClient
    .from('schools')
    .select('id, name, slug')
    .eq('id', profile?.school_id)
    .single()

  // Verificar se é primeiro acesso (escola sem cursos)
  const { count: totalCursos } = await adminClient
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', escola?.id)

  const isPrimeiroAcesso = (totalCursos || 0) === 0

  // Buscar stats normais
  const stats = await getDashboardStats()

  // Tela de primeiro acesso
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
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#F0F0F0', fontWeight: '600' }}>Bem-vindo ao NexoCollege!</p>
          <p style={{ color: '#888888', fontSize: '14px', marginTop: '4px' }}>Configure sua escola para começar.</p>
        </div>
      </div>
    )
  }

  const cards = [
    { label: 'Alunos Ativos', value: stats.totalAlunos, iconColor: '#60A5FA', iconBg: '#1E3A5F', icon: '👥' },
    { label: 'Cursos', value: stats.totalCursos, iconColor: '#AEEA00', iconBg: '#1A2E00', icon: '📚' },
    { label: 'Certificados', value: stats.totalCertificados, iconColor: '#FACC15', iconBg: '#2E2100', icon: '🏆' },
    { label: 'Receita Total', value: `R$ ${stats.receita.toFixed(2)}`, iconColor: '#7C4DFF', iconBg: '#1E0E3F', icon: '💰' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#888888', marginTop: '4px', fontSize: '14px' }}>Visão geral da sua escola</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {cards.map((card) => (
          <div key={card.label} style={{
            backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A',
            borderRadius: '12px', padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>{card.label}</p>
              <div style={{
                width: '36px', height: '36px', backgroundColor: card.iconBg,
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '16px' }}>{card.icon}</span>
              </div>
            </div>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '14px', margin: '0 0 16px' }}>📈 Matrículas Recentes</h2>
          {stats.matriculasRecentes.length === 0 ? (
            <p style={{ color: '#555555', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>Nenhuma matrícula ainda</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.matriculasRecentes.map((m: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '500', margin: 0 }}>{m.users?.full_name || 'Aluno'}</p>
                    <p style={{ color: '#888888', fontSize: '12px', margin: 0 }}>{m.courses?.title}</p>
                  </div>
                  <p style={{ color: '#555555', fontSize: '12px' }}>{new Date(m.enrolled_at).toLocaleDateString('pt-BR')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '14px', margin: '0 0 16px' }}>💰 Últimos Pagamentos</h2>
          {stats.pagamentos.length === 0 ? (
            <p style={{ color: '#555555', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>Nenhum pagamento ainda</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.pagamentos.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#AEEA00', borderRadius: '50%' }} />
                    <p style={{ color: '#F0F0F0', fontSize: '14px', margin: 0 }}>Aprovado</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#F0F0F0', fontSize: '14px', fontWeight: '500', margin: 0 }}>R$ {Number(p.amount).toFixed(2)}</p>
                    <p style={{ color: '#555555', fontSize: '12px', margin: 0 }}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString('pt-BR') : '-'}</p>
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
