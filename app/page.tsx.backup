'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

export default function LandingPage() {
  const typedRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const words = ['conhecimento.', 'propósito.', 'experiência.', 'missão.']
    let wi = 0, ci = 0, deleting = false
    const el = typedRef.current
    if (!el) return
    function type() {
      const word = words[wi]
      if (!deleting) {
        el!.textContent = word.slice(0, ci + 1); ci++
        if (ci === word.length) { deleting = true; setTimeout(type, 2200); return }
      } else {
        el!.textContent = word.slice(0, ci - 1); ci--
        if (ci === 0) { deleting = false; wi = (wi + 1) % words.length }
      }
      setTimeout(type, deleting ? 55 : 100)
    }
    setTimeout(type, 600)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const sy = window.scrollY
      const hg = document.getElementById('hero-grid')
      const o1 = document.getElementById('orb1')
      const o2 = document.getElementById('orb2')
      if (hg) hg.style.transform = `translateY(${sy * 0.35}px)`
      if (o1) o1.style.transform = `translateX(-50%) translateY(${sy * 0.22}px)`
      if (o2) o2.style.transform = `translateY(${sy * 0.15}px)`;
      [1, 2].forEach(i => {
        const b = document.getElementById(`pband${i}`)
        const bg = document.getElementById(`pbg${i}`)
        const bgd = document.getElementById(`pbgd${i}`)
        if (b && bg) {
          const r = b.getBoundingClientRect()
          const off = (window.innerHeight / 2 - r.top - r.height / 2) * 0.28
          bg.style.transform = `translateY(${off}px)`
          if (bgd) bgd.style.transform = `translateY(${off * 0.55}px)`
        }
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const cor = '#AEEA00'

  return (
    <div style={{ background: '#0D0D0D', color: '#F0F0F0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflowX: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 16px 38px; background: #AEEA00; color: #0D0D0D; font-weight: 800; font-size: 16px; border-radius: 12px; text-decoration: none; border: none; cursor: pointer; transition: opacity 0.2s, transform 0.2s; }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-3px); }
        .btn-outline { display: inline-flex; align-items: center; padding: 15px 32px; border: 1.5px solid rgba(255,255,255,0.2); color: #F0F0F0; font-weight: 600; font-size: 16px; border-radius: 12px; text-decoration: none; transition: border-color 0.2s, color 0.2s; background: transparent; }
        .btn-outline:hover { border-color: #AEEA00; color: #AEEA00; }
        .btn-sm-primary { display: inline-block; padding: 10px 22px; background: #AEEA00; color: #0D0D0D; font-size: 14px; font-weight: 800; border-radius: 9px; text-decoration: none; transition: opacity 0.2s; }
        .btn-sm-primary:hover { opacity: 0.88; }
        .btn-sm-outline { display: inline-block; padding: 10px 20px; border: 1.5px solid rgba(255,255,255,0.2); color: #F0F0F0; font-size: 14px; font-weight: 600; border-radius: 9px; text-decoration: none; transition: border-color 0.2s, color 0.2s; }
        .btn-sm-outline:hover { border-color: #AEEA00; color: #AEEA00; }
        .feature-card { background: #141414; border: 1px solid #222; border-radius: 18px; padding: 30px; transition: border-color 0.3s, transform 0.3s; cursor: default; }
        .feature-card:hover { border-color: rgba(174,234,0,0.5); transform: translateY(-6px); }
        .step-card { display: flex; gap: 24px; align-items: flex-start; background: #141414; border: 1px solid #222; border-radius: 18px; padding: 28px; margin-bottom: 16px; transition: border-color 0.25s, transform 0.25s; }
        .step-card:hover { border-color: rgba(174,234,0,0.3); transform: translateX(5px); }
        .plan-card { background: #141414; border: 1px solid #222; border-radius: 22px; padding: 36px; flex: 1; min-width: 260px; max-width: 320px; position: relative; transition: transform 0.25s; }
        .plan-card:hover { transform: translateY(-6px); }
        .plan-card-destaque { border-color: #AEEA00 !important; background: linear-gradient(145deg, #141414, #181f00) !important; }
        .plan-btn-green { display: block; text-align: center; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 15px; background: #AEEA00; color: #0D0D0D; border: none; cursor: pointer; text-decoration: none; transition: opacity 0.2s; margin-top: 26px; }
        .plan-btn-green:hover { opacity: 0.85; }
        .plan-btn-outline { display: block; text-align: center; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 15px; border: 1.5px solid #333; color: #F0F0F0; background: transparent; cursor: pointer; text-decoration: none; transition: border-color 0.2s, color 0.2s; margin-top: 26px; }
        .plan-btn-outline:hover { border-color: #AEEA00; color: #AEEA00; }
        .parallax-band { position: relative; overflow: hidden; height: 260px; display: flex; align-items: center; justify-content: center; }
        .parallax-bg { position: absolute; inset: -80px 0; background: linear-gradient(135deg, #0D0D0D 0%, #111800 40%, #0D0D0D 100%); will-change: transform; }
        .parallax-dots { position: absolute; inset: -80px 0; background-image: radial-gradient(rgba(174,234,0,0.12) 1px, transparent 1px); background-size: 30px 30px; will-change: transform; }
        .parallax-content { position: relative; z-index: 2; text-align: center; padding: 0 48px; }
        .nav-link { color: #888; font-size: 14px; text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #AEEA00; }
        .footer-link { color: #444; font-size: 13px; text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: #AEEA00; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @media (max-width: 1024px) {
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .section-pad { padding: 80px 32px !important; }
          .hero-pad { padding: 120px 32px 80px !important; }
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 36px !important; letter-spacing: -1px !important; line-height: 1.15 !important; }
          .nav-links { display: none !important; }
          .nav-wrap { padding: 0 16px !important; height: 56px !important; }
          .btn-sm-primary { font-size: 12px !important; padding: 8px 14px !important; white-space: nowrap !important; }
          .btn-sm-outline { font-size: 12px !important; padding: 8px 12px !important; white-space: nowrap !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .plans-grid { flex-direction: column !important; align-items: stretch !important; padding: 0 4px !important; }
          .plan-card { max-width: 100% !important; width: 100% !important; min-width: unset !important; }
          .section-pad { padding: 60px 20px !important; }
          .hero-pad { padding: 100px 20px 70px !important; }
          .parallax-content { padding: 0 20px !important; }
          .parallax-band { height: auto !important; min-height: 180px !important; padding: 40px 0 !important; }
          .parallax-content p { font-size: 18px !important; }
          .btn-primary { font-size: 15px !important; padding: 14px 28px !important; width: 100% !important; justify-content: center !important; }
          .btn-outline { font-size: 15px !important; padding: 14px 28px !important; width: 100% !important; justify-content: center !important; }
          .step-card { flex-direction: column !important; gap: 16px !important; padding: 22px !important; }
          .feature-card { padding: 22px !important; }
        }
        @media (max-width: 480px) {
          .hero-title { font-size: 30px !important; }
          .btn-sm-primary { font-size: 11px !important; padding: 7px 12px !important; white-space: nowrap !important; }
          .btn-sm-outline { font-size: 11px !important; padding: 7px 10px !important; white-space: nowrap !important; }
          .cta-title { font-size: 22px !important; line-height: 1.25 !important; word-break: break-word !important; overflow-wrap: break-word !important; padding: 0 12px !important; }
          .cta-btn { font-size: 15px !important; padding: 14px 28px !important; width: 100% !important; }
          .footer-copy { font-size: 11px !important; text-align: center !important; }
          .footer-wrap { flex-direction: column !important; align-items: center !important; text-align: center !important; padding: 24px 20px !important; gap: 16px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav-wrap" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(13,13,13,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1A1A1A', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <img src="/logo.png" alt="NexoCollege" style={{ height: '38px', mixBlendMode: 'lighten', display: 'block' }} />
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: '32px' }}>
          {['Funcionalidades', 'Como funciona', 'Planos'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="nav-link">{item}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/login" className="btn-sm-outline">Acessar minha escola</Link>
          <Link href="/cadastro" className="btn-sm-primary">Começar grátis</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-pad" style={{ position: 'relative', minHeight: '100vh', padding: '130px 48px 100px', textAlign: 'center', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div id="hero-grid" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(174,234,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(174,234,0,0.05) 1px, transparent 1px)', backgroundSize: '52px 52px', willChange: 'transform' }} />
        <div id="orb1" style={{ position: 'absolute', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(174,234,0,0.1) 0%, transparent 65%)', top: '-200px', left: '50%', transform: 'translateX(-50%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div id="orb2" style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,77,255,0.12) 0%, transparent 65%)', bottom: '-50px', right: '5%', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: '100px', background: 'rgba(174,234,0,0.1)', border: '1px solid rgba(174,234,0,0.3)', color: cor, fontSize: '13px', fontWeight: 700, marginBottom: '28px', letterSpacing: '0.04em' }}>
            ✦ Simples. Prático. Para quem tem algo a ensinar.
          </div>
          <h1 className="hero-title" style={{ fontSize: '64px', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: '28px', color: '#F0F0F0' }}>
            Compartilhe seu<br />
            <span style={{ color: cor }} ref={typedRef}></span>
            <span style={{ display: 'inline-block', width: '4px', height: '0.82em', background: cor, marginLeft: '3px', verticalAlign: 'middle', animation: 'blink 0.8s step-end infinite' }} />
            <br />Sem complicação.
          </h1>
          <p style={{ fontSize: '19px', color: '#888', lineHeight: 1.8, marginBottom: '42px', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
            Seu conhecimento pode transformar vidas. Com o NexoCollege, professores, pastores e profissionais liberais criam cursos online de forma simples, alcançam mais pessoas e ampliam seu impacto.{' '}<strong style={{ color: '#F0F0F0' }}>Sem investimento inicial.</strong>
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <Link href="/cadastro" className="btn-primary">🚀 Criar minha escola grátis</Link>
            <a href="#como-funciona" className="btn-outline">Ver como funciona</a>
          </div>
          <p style={{ color: '#444', fontSize: '13px', letterSpacing: '0.04em' }}>
            Grátis para sempre &nbsp;•&nbsp; Sem cartão de crédito &nbsp;•&nbsp; Cadastro em minutos
          </p>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '0 48px 80px' }}>
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#1A1A1A', border: '1px solid #1A1A1A', borderRadius: '16px', overflow: 'hidden', maxWidth: '920px', margin: '0 auto' }}>
          {[
            { num: '100% grátis', label: 'para começar, sem custo inicial' },
            { num: '~5 min', label: 'para criar seu primeiro curso' },
            { num: 'Zero', label: 'conhecimento técnico necessário' },
            { num: '∞', label: 'alunos no seu plano' },
          ].map(s => (
            <div key={s.label} style={{ background: '#111', padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '30px', fontWeight: 900, color: cor, marginBottom: '8px' }}>{s.num}</div>
              <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PARALLAX BAND 1 */}
      <div className="parallax-band" id="pband1">
        <div className="parallax-bg" id="pbg1" />
        <div className="parallax-dots" id="pbgd1" />
        <div className="parallax-content">
          <p style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1.35, letterSpacing: '-0.5px', color: '#F0F0F0' }}>
            Completo na medida certa.<br />
            <span style={{ color: cor }}>As ferramentas essenciais para criar seus cursos,</span><br />
            sem recursos desnecessários que só aumentam a complexidade.
          </p>
        </div>
      </div>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="section-pad" style={{ padding: '100px 48px', maxWidth: '1160px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px', lineHeight: 1.2, color: '#F0F0F0' }}>
            Tudo que você precisa,{' '}<span style={{ color: cor }}>nada que você não precisa</span>
          </h2>
          <p style={{ color: '#666', fontSize: '18px', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
            Focamos no essencial para você começar rápido e crescer no seu ritmo
          </p>
        </div>
        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { icon: '🎓', title: 'Sua escola, sua identidade', desc: 'Personalize com o nome, cor e identidade visual da sua escola ou ministério.' },
            { icon: '📹', title: 'Aulas em vídeo', desc: 'Integre vídeos do YouTube, Vimeo ou Panda Videos. Sem upload complicado.' },
            { icon: '💳', title: 'Receba pelo seu trabalho', desc: 'Conecte sua conta do Mercado Pago e receba diretamente. Sem intermediários.' },
            { icon: '🎁', title: 'Cursos gratuitos ou pagos', desc: 'Você decide. Ofereça conteúdo gratuito para atrair ou venda seus cursos.' },
            { icon: '📜', title: 'Certificados automáticos', desc: 'Seus alunos recebem certificado ao concluir o curso. Automático e profissional.' },
            { icon: '💬', title: 'Comunicação direta', desc: 'Troca de mensagens entre professor e aluno dentro da plataforma.' },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px', color: '#F0F0F0' }}>{f.title}</h3>
              <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(174,234,0,0.25), transparent)', maxWidth: '600px', margin: '0 auto' }} />

      {/* PARALLAX BAND 2 */}
      <div className="parallax-band" id="pband2">
        <div className="parallax-bg" id="pbg2" style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #0d1500 50%, #0A0A0A 100%)' }} />
        <div className="parallax-dots" id="pbgd2" style={{ backgroundImage: 'radial-gradient(rgba(124,77,255,0.1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="parallax-content">
          <p style={{ fontSize: '24px', color: '#888', fontWeight: 900, lineHeight: 1.35 }}>
            Do cadastro ao primeiro aluno.<br />
            <span style={{ color: '#F0F0F0', fontSize: '28px' }}>Sem precisar de uma equipe técnica.</span>
          </p>
        </div>
      </div>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="section-pad" style={{ padding: '100px 48px', background: '#090909' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px', color: '#F0F0F0' }}>
              Do zero ao primeiro curso em{' '}<span style={{ color: cor }}>3 passos</span>
            </h2>
            <p style={{ color: '#666', fontSize: '18px' }}>Sem precisar saber programar. Sem precisar contratar ninguém.</p>
          </div>
          {[
            { num: '01', title: 'Crie sua escola', desc: 'Cadastre-se, dê um nome para sua escola e escolha sua cor. Pronto — sua plataforma já existe.' },
            { num: '02', title: 'Monte seu curso', desc: 'Adicione módulos, aulas com vídeos do YouTube ou Vimeo, e defina se é gratuito ou pago.' },
            { num: '03', title: 'Compartilhe com seus alunos', desc: 'Envie o link da sua vitrine. Seus alunos se cadastram e acessam na hora. Simples assim.' },
          ].map(s => (
            <div key={s.num} className="step-card">
              <div style={{ minWidth: '54px', height: '54px', borderRadius: '14px', background: 'rgba(174,234,0,0.07)', border: '1px solid rgba(174,234,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '20px', color: cor, flexShrink: 0 }}>{s.num}</div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#F0F0F0' }}>{s.title}</h3>
                <p style={{ color: '#555', fontSize: '15px', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(174,234,0,0.25), transparent)', maxWidth: '600px', margin: '0 auto' }} />

      {/* PLANOS */}
      <section id="planos" className="section-pad" style={{ padding: '100px 48px', maxWidth: '1160px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px', color: '#F0F0F0' }}>
            Comece grátis.{' '}<span style={{ color: cor }}>Cresça no seu ritmo.</span>
          </h2>
          <p style={{ color: '#666', fontSize: '18px' }}>Sem surpresas. Sem taxas escondidas.</p>
        </div>
        <div className="plans-grid" style={{ display: 'flex', gap: '22px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div className="plan-card">
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '12px', color: '#666' }}>Starter</div>
            <div style={{ fontSize: '48px', fontWeight: 900, color: cor, marginBottom: '6px' }}>R$ 0</div>
            <div style={{ color: '#444', fontSize: '13px', marginBottom: '6px' }}>Para sempre</div>
            <div style={{ color: '#333', fontSize: '11px', marginBottom: '30px' }}>—</div>
            {['1 curso', 'Alunos ilimitados', 'Vitrine personalizada', 'Certificados'].map(i => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#888', marginBottom: '10px' }}>
                <span style={{ color: cor, fontWeight: 900 }}>✓</span> {i}
              </div>
            ))}
            <Link href="/cadastro" className="plan-btn-outline">Começar grátis</Link>
          </div>
          <div className="plan-card plan-card-destaque">
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: cor, color: '#0D0D0D', fontSize: '11px', fontWeight: 900, padding: '4px 18px', borderRadius: '100px', whiteSpace: 'nowrap', letterSpacing: '0.07em' }}>MAIS POPULAR</div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '12px', color: cor }}>Pro</div>
            <div style={{ fontSize: '48px', fontWeight: 900, color: '#F0F0F0', marginBottom: '6px' }}>R$ 1.997<span style={{ fontSize: '17px', color: '#555', fontWeight: 400 }}>/ano</span></div>
            <div style={{ color: '#444', fontSize: '13px', marginBottom: '4px' }}>Cobrado anualmente</div>
            <div style={{ color: '#333', fontSize: '11px', marginBottom: '30px' }}>Parcelamento em até 12x sujeito a juros (Mercado Pago)</div>
            {['Até 10 cursos', 'Alunos ilimitados', 'Vitrine personalizada', 'Certificados', 'Gateway próprio MP', 'Suporte prioritário'].map(i => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#888', marginBottom: '10px' }}>
                <span style={{ color: cor, fontWeight: 900 }}>✓</span> {i}
              </div>
            ))}
            <Link href="/cadastro" className="plan-btn-green">Assinar Pro</Link>
          </div>
          <div className="plan-card">
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '12px', color: '#666' }}>Enterprise</div>
            <div style={{ fontSize: '48px', fontWeight: 900, color: '#F0F0F0', marginBottom: '6px' }}>R$ 4.997<span style={{ fontSize: '17px', color: '#555', fontWeight: 400 }}>/ano</span></div>
            <div style={{ color: '#444', fontSize: '13px', marginBottom: '4px' }}>Cobrado anualmente</div>
            <div style={{ color: '#333', fontSize: '11px', marginBottom: '30px' }}>Parcelamento em até 12x sujeito a juros (Mercado Pago)</div>
            {['Cursos ilimitados', 'Alunos ilimitados', 'Vitrine personalizada', 'Certificados', 'Gateway próprio MP', 'Suporte VIP'].map(i => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#888', marginBottom: '10px' }}>
                <span style={{ color: cor, fontWeight: 900 }}>✓</span> {i}
              </div>
            ))}
            <Link href="/cadastro" className="plan-btn-outline">Assinar Enterprise</Link>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section-pad" style={{ padding: '100px 48px', textAlign: 'center', background: 'linear-gradient(145deg, #0D0D0D, #111900)', borderTop: '1px solid #1e2800' }}>
        <h2 style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1.2, marginBottom: '20px', color: '#F0F0F0' }}>
          Você tem conhecimento.<br /><span style={{ color: cor }}>O mundo precisa ouvir você.</span>
        </h2>
        <p style={{ color: '#666', fontSize: '20px', marginBottom: '40px' }}>Crie sua escola agora. É grátis, rápido e sem complicação.</p>
        <Link href="/cadastro" className="btn-primary" style={{ fontSize: '18px', padding: '18px 50px' }}>🚀 Criar minha escola agora</Link>
        <p style={{ color: '#333', fontSize: '13px', marginTop: '16px', letterSpacing: '0.04em' }}>
          Sem cartão de crédito &nbsp;•&nbsp; Pronto em minutos &nbsp;•&nbsp; Plano gratuito para sempre
        </p>
      </section>

      {/* FOOTER */}
      <footer className="footer-wrap" style={{ borderTop: '1px solid #161616', padding: '30px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <img src="/logo.png" alt="NexoCollege" style={{ height: '30px', mixBlendMode: 'lighten', display: 'block' }} />
        <p className="footer-copy" style={{ color: '#333', fontSize: '13px' }}>© 2026 NexoCollege. Todos os direitos reservados.</p>
        <Link href="/login" className="footer-link">Acessar minha escola →</Link>
      </footer>
    </div>
  )
}
