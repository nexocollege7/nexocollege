'use client'

import Link from 'next/link'

export default function LandingPage() {
  const cor = '#AEEA00'
  const roxo = '#7C4DFF'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0D', fontFamily: 'sans-serif', color: '#F0F0F0' }}>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary {
          display: inline-block;
          padding: 16px 36px;
          background-color: #AEEA00;
          color: #0D0D0D;
          font-weight: 800;
          font-size: 16px;
          border-radius: 10px;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .btn-primary:hover { opacity: 0.85; }
        .btn-outline {
          display: inline-block;
          padding: 14px 28px;
          border: 2px solid rgba(255,255,255,0.2);
          color: #F0F0F0;
          font-weight: 600;
          font-size: 15px;
          border-radius: 10px;
          text-decoration: none;
          transition: border-color 0.2s;
        }
        .btn-outline:hover { border-color: #AEEA00; color: #AEEA00; }
        .feature-card {
          background: #1A1A1A;
          border: 1px solid #2A2A2A;
          border-radius: 16px;
          padding: 28px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .feature-card:hover { border-color: #AEEA00; transform: translateY(-4px); }
        .plan-card {
          background: #1A1A1A;
          border: 1px solid #2A2A2A;
          border-radius: 20px;
          padding: 36px;
          flex: 1;
          min-width: 260px;
          max-width: 340px;
        }
        .plan-card.destaque {
          border-color: #AEEA00;
          background: linear-gradient(135deg, #1A1A1A, #1f2a00);
          position: relative;
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 36px !important; }
          .hero-sub { font-size: 16px !important; }
          .plans-grid { flex-direction: column !important; align-items: center !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .nav-links { display: none !important; }
          .section-pad { padding: 60px 24px !important; }
          .hero-pad { padding: 120px 24px 80px !important; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: '1px solid #1A1A1A',
        backgroundColor: 'rgba(13,13,13,0.95)',
        backdropFilter: 'blur(10px)',
        padding: '0 48px', height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            backgroundColor: cor, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: '800', fontSize: '18px', color: '#0D0D0D',
          }}>N</div>
          <span style={{ fontWeight: '800', fontSize: '20px', color: '#F0F0F0' }}>NexoCollege</span>
        </div>

        <nav className="nav-links" style={{ display: 'flex', gap: '32px' }}>
          {['Funcionalidades', 'Como funciona', 'Planos'].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} style={{
              color: '#888888', fontSize: '14px', textDecoration: 'none', fontWeight: '500',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F0F0F0')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
            >{item}</a>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/login" className="btn-outline" style={{ padding: '10px 20px', fontSize: '14px' }}>
            Acessar minha escola
          </Link>
          <Link href="/cadastro" className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
            Começar grátis
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="hero-pad" style={{ padding: '140px 48px 100px', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', padding: '6px 16px', borderRadius: '100px',
          backgroundColor: 'rgba(174,234,0,0.1)', border: '1px solid rgba(174,234,0,0.3)',
          color: cor, fontSize: '13px', fontWeight: '600', marginBottom: '24px',
        }}>
          ✦ Simples. Prático. Para quem tem algo a ensinar.
        </div>

        <h1 className="hero-title" style={{
          fontSize: '60px', fontWeight: '900', lineHeight: '1.1',
          marginBottom: '24px', letterSpacing: '-1px',
        }}>
          Compartilhe seu{' '}
          <span style={{ color: cor }}>conhecimento.</span>
          <br />Sem complicação.
        </h1>

        <p className="hero-sub" style={{
          fontSize: '20px', color: '#888888', lineHeight: '1.7',
          marginBottom: '40px', maxWidth: '620px', margin: '0 auto 40px',
        }}>
          Professor, pastor, profissional liberal — se você tem algo a ensinar,
          o NexoCollege te dá uma plataforma completa para criar seus cursos
          e alcançar as pessoas do seu universo. <strong style={{ color: '#F0F0F0' }}>Sem investimento inicial.</strong>
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/cadastro" className="btn-primary">
            🚀 Criar minha escola grátis
          </Link>
          <a href="#como-funciona" className="btn-outline">
            Ver como funciona
          </a>
        </div>

        <p style={{ color: '#555555', fontSize: '13px', marginTop: '20px' }}>
          Plano gratuito para sempre • Sem cartão de crédito • Pronto em minutos
        </p>
      </section>

      {/* STATS */}
      <section style={{ padding: '0 48px 80px' }}>
        <div className="stats-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1px', backgroundColor: '#1A1A1A',
          border: '1px solid #1A1A1A', borderRadius: '16px', overflow: 'hidden',
          maxWidth: '900px', margin: '0 auto',
        }}>
          {[
            { num: '100%', label: 'gratuito para começar' },
            { num: 'Minutos', label: 'para criar seu primeiro curso' },
            { num: 'Zero', label: 'conhecimento técnico necessário' },
            { num: '∞', label: 'alunos no seu plano' },
          ].map((stat) => (
            <div key={stat.label} style={{
              backgroundColor: '#111111', padding: '32px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: '900', color: cor, marginBottom: '8px' }}>
                {stat.num}
              </div>
              <div style={{ fontSize: '13px', color: '#666666', lineHeight: '1.4' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="section-pad" style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: '800', marginBottom: '16px' }}>
            Tudo que você precisa,{' '}
            <span style={{ color: cor }}>nada que você não precisa</span>
          </h2>
          <p style={{ color: '#888888', fontSize: '17px' }}>
            Focamos no essencial para você começar rápido e crescer no seu ritmo
          </p>
        </div>

        <div className="features-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px',
        }}>
          {[
            { icon: '🎓', title: 'Sua escola, sua identidade', desc: 'Personalize com o nome, cor e identidade visual da sua escola ou ministério.' },
            { icon: '📹', title: 'Aulas em vídeo', desc: 'Integre vídeos do YouTube, Vimeo ou Panda Videos. Sem upload complicado.' },
            { icon: '💳', title: 'Receba pelo seu trabalho', desc: 'Conecte sua conta do Mercado Pago e receba diretamente. Sem intermediários.' },
            { icon: '🎁', title: 'Cursos gratuitos ou pagos', desc: 'Você decide. Ofereça conteúdo gratuito para atrair ou venda seus cursos com preço justo.' },
            { icon: '📜', title: 'Certificados automáticos', desc: 'Seus alunos recebem certificado ao concluir o curso. Automático e profissional.' },
            { icon: '💬', title: 'Comunicação direta', desc: 'Troca de mensagens entre professor e aluno dentro da plataforma.' },
          ].map((f) => (
            <div key={f.title} className="feature-card">
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '10px', color: '#F0F0F0' }}>
                {f.title}
              </h3>
              <p style={{ color: '#666666', fontSize: '14px', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" style={{ padding: '80px 48px', backgroundColor: '#111111' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '40px', fontWeight: '800', marginBottom: '16px' }}>
            Do zero ao primeiro curso em{' '}
            <span style={{ color: cor }}>3 passos</span>
          </h2>
          <p style={{ color: '#888888', fontSize: '17px', marginBottom: '56px' }}>
            Sem precisar saber programar. Sem precisar contratar ninguém.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
            {[
              { num: '01', title: 'Crie sua escola', desc: 'Cadastre-se, dê um nome para sua escola e escolha sua cor. Pronto — sua plataforma já existe.' },
              { num: '02', title: 'Monte seu curso', desc: 'Adicione módulos, aulas com vídeos do YouTube ou Vimeo, e defina se é gratuito ou pago.' },
              { num: '03', title: 'Compartilhe com seus alunos', desc: 'Envie o link da sua vitrine. Seus alunos se cadastram e acessam na hora. Simples assim.' },
            ].map((step) => (
              <div key={step.num} style={{
                display: 'flex', gap: '24px', alignItems: 'flex-start',
                backgroundColor: '#1A1A1A', borderRadius: '16px', padding: '28px',
                border: '1px solid #2A2A2A',
              }}>
                <div style={{
                  minWidth: '56px', height: '56px', borderRadius: '12px',
                  backgroundColor: 'rgba(174,234,0,0.1)',
                  border: '1px solid rgba(174,234,0,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '900', fontSize: '20px', color: cor,
                }}>
                  {step.num}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{step.title}</h3>
                  <p style={{ color: '#666666', fontSize: '15px', lineHeight: '1.6' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="section-pad" style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: '800', marginBottom: '16px' }}>
              Comece grátis.{' '}
              <span style={{ color: cor }}>Cresça no seu ritmo.</span>
            </h2>
            <p style={{ color: '#888888', fontSize: '17px' }}>
              Sem surpresas. Sem taxas escondidas.
            </p>
          </div>

          <div className="plans-grid" style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>

            {/* Starter */}
            <div className="plan-card">
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                Starter
              </div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: cor, marginBottom: '4px' }}>
                Grátis
              </div>
              <div style={{ color: '#555555', fontSize: '14px', marginBottom: '32px' }}>
                Para sempre
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {['1 curso', 'Alunos ilimitados', 'Vitrine personalizada', 'Certificados', 'Suporte por email'].map((item) => (
                  <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#BBBBBB' }}>
                    <span style={{ color: cor }}>✓</span> {item}
                  </div>
                ))}
              </div>
              <Link href="/cadastro" style={{
                display: 'block', textAlign: 'center', padding: '14px',
                borderRadius: '10px', border: '2px solid #2A2A2A',
                color: '#F0F0F0', fontWeight: '700', textDecoration: 'none',
                transition: 'border-color 0.2s',
              }}>
                Começar grátis
              </Link>
            </div>

            {/* Pro */}
            <div className="plan-card destaque">
              <div style={{
                position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                backgroundColor: cor, color: '#0D0D0D', fontSize: '12px', fontWeight: '800',
                padding: '4px 16px', borderRadius: '100px', whiteSpace: 'nowrap',
              }}>
                MAIS POPULAR
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: cor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                Pro
              </div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: '#F0F0F0', marginBottom: '4px' }}>
                R$ 197
                <span style={{ fontSize: '18px', color: '#888888', fontWeight: '400' }}>/mês</span>
              </div>
              <div style={{ color: '#555555', fontSize: '14px', marginBottom: '32px' }}>
                R$ 2.364 cobrado anualmente
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {['Até 10 cursos', 'Alunos ilimitados', 'Vitrine personalizada', 'Certificados', 'Gateway próprio MP', 'Suporte prioritário'].map((item) => (
                  <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#BBBBBB' }}>
                    <span style={{ color: cor }}>✓</span> {item}
                  </div>
                ))}
              </div>
              <Link href="/cadastro" className="btn-primary" style={{ display: 'block', textAlign: 'center', padding: '14px' }}>
                Assinar Pro
              </Link>
            </div>

            {/* Enterprise */}
            <div className="plan-card">
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                Enterprise
              </div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: '#F0F0F0', marginBottom: '4px' }}>
                R$ 597
                <span style={{ fontSize: '18px', color: '#888888', fontWeight: '400' }}>/mês</span>
              </div>
              <div style={{ color: '#555555', fontSize: '14px', marginBottom: '32px' }}>
                R$ 7.164 cobrado anualmente
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {['Cursos ilimitados', 'Alunos ilimitados', 'Vitrine personalizada', 'Certificados', 'Gateway próprio MP', 'Suporte VIP'].map((item) => (
                  <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#BBBBBB' }}>
                    <span style={{ color: cor }}>✓</span> {item}
                  </div>
                ))}
              </div>
              <Link href="/cadastro" style={{
                display: 'block', textAlign: 'center', padding: '14px',
                borderRadius: '10px', border: '2px solid #2A2A2A',
                color: '#F0F0F0', fontWeight: '700', textDecoration: 'none',
              }}>
                Assinar Enterprise
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{
        padding: '80px 48px', textAlign: 'center',
        background: `linear-gradient(135deg, #111111, #1a1f00)`,
        borderTop: '1px solid #2A2A2A',
      }}>
        <h2 style={{ fontSize: '44px', fontWeight: '900', marginBottom: '20px', lineHeight: '1.2' }}>
          Você tem conhecimento.<br />
          <span style={{ color: cor }}>O mundo precisa ouvir você.</span>
        </h2>
        <p style={{ color: '#888888', fontSize: '18px', marginBottom: '40px' }}>
          Crie sua escola agora. É grátis, rápido e sem complicação.
        </p>
        <Link href="/cadastro" className="btn-primary" style={{ fontSize: '18px', padding: '18px 48px' }}>
          🚀 Criar minha escola agora
        </Link>
        <p style={{ color: '#444444', fontSize: '13px', marginTop: '16px' }}>
          Sem cartão de crédito • Pronto em minutos • Plano gratuito para sempre
        </p>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1A1A1A', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            backgroundColor: cor, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: '800', fontSize: '14px', color: '#0D0D0D',
          }}>N</div>
          <span style={{ fontWeight: '700', color: '#F0F0F0' }}>NexoCollege</span>
        </div>
        <p style={{ color: '#333333', fontSize: '13px' }}>
          © 2026 NexoCollege. Todos os direitos reservados.
        </p>
        <Link href="/login" style={{ color: '#555555', fontSize: '13px', textDecoration: 'none' }}>
          Acessar minha escola →
        </Link>
      </footer>

    </div>
  )
}
