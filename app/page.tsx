'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const [precos, setPrecos] = useState<Record<string, number>>({
    starter: 0, creator: 597, pro: 1197, scale: 2497,
  })

  useEffect(() => {
    async function carregarPrecos() {
      const supabase = createClient()
      const { data } = await supabase
        .from('plans').select('slug, price_yearly')
        .in('slug', ['starter', 'creator', 'pro', 'scale']).eq('is_active', true)
      if (data) {
        const novos: Record<string, number> = {}
        data.forEach(p => { novos[p.slug] = Number(p.price_yearly) })
        setPrecos(prev => ({ ...prev, ...novos }))
      }
    }
    carregarPrecos()
  }, [])

  useEffect(() => {
    const nav = document.getElementById('nav')
    const handler = () => nav?.classList.toggle('scrolled', window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
    }, { threshold: 0, rootMargin: '0px 0px 0px 0px' })
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))
    const t = setTimeout(() => document.body.classList.add('force-show'), 8000)
    return () => { io.disconnect(); clearTimeout(t) }
  }, [])

  useEffect(() => {
    function animateCount(el: Element) {
      const target = +(el as HTMLElement).dataset.target!
      const dur = 1800; const start = performance.now()
      function tick(now: number) {
        const p = Math.min((now - start) / dur, 1)
        const eased = 1 - Math.pow(1 - p, 3);
        (el as HTMLElement).textContent = Math.floor(eased * target).toLocaleString('pt-BR')
        if (p < 1) requestAnimationFrame(tick)
        else (el as HTMLElement).textContent = target.toLocaleString('pt-BR')
      }
      requestAnimationFrame(tick)
    }
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target) } })
    }, { threshold: 0.6 })
    document.querySelectorAll('.cval').forEach(el => cio.observe(el))
    return () => cio.disconnect()
  }, [])

  useEffect(() => {
    const canvas = document.getElementById('dots') as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let w = 0, h = 0, dpr = 1, particles: any[] = [], raf: number
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2)
      w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    function init() {
      particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
        r: Math.random() * 1.3 + .5, c: Math.random() > .7 ? '124,77,255' : '174,234,0'
      }))
    }
    function draw() {
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]; p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7)
        ctx.fillStyle = `rgba(${p.c},.45)`; ctx.fill()
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]; const dx = p.x - q.x, dy = p.y - q.y; const d = dx * dx + dy * dy
          if (d < 14000) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(174,234,0,${.06 * (1 - d / 14000)})`
            ctx.lineWidth = .5; ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    resize(); init(); draw()
    const onResize = () => { resize(); init() }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  const fmt = (n: number) => n.toLocaleString('pt-BR')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        :root{--neon:#AEEA00;--neon-soft:rgba(174,234,0,.15);--purple:#7C4DFF;--purple-soft:rgba(124,77,255,.15);--bg:#0D0D0D;--card:#111111;--card2:#1A1A1A;--border:#2A2A2A;--text:#F0F0F0;--muted:#888888;--radius:18px;--maxw:1200px;--ease:cubic-bezier(.22,1,.36,1)}
        *{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
        body{background:var(--bg);color:var(--text);font-family:'Inter',system-ui,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden}
        h1,h2,h3,h4{font-family:'Sora','Inter',sans-serif;line-height:1.05;letter-spacing:-.02em}
        .neon{color:var(--neon)}a{color:inherit;text-decoration:none}
        .wrap{max-width:var(--maxw);margin:0 auto;padding:0 28px}
        .eyebrow{font-size:13px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:18px;display:flex;align-items:center;gap:10px}
        .eyebrow::before{content:"";width:26px;height:1px;background:var(--neon);display:inline-block}
        .section{padding:120px 0;position:relative}.section-head{max-width:680px;margin-bottom:64px}
        .section-head h2{font-size:clamp(30px,4.4vw,52px);font-weight:800;margin-bottom:18px}
        .section-head p{font-size:18px;color:var(--muted);max-width:560px}
        .btn{display:inline-flex;align-items:center;gap:10px;font-family:'Inter';font-weight:600;font-size:16px;padding:15px 26px;border-radius:14px;border:1px solid transparent;cursor:pointer;transition:transform .25s var(--ease),box-shadow .25s var(--ease),background .25s;white-space:nowrap}
        .btn-primary{background:var(--neon);color:#0a0a0a}.btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(174,234,0,.28)}
        .btn-ghost{background:transparent;color:var(--text);border:1px solid var(--border)}.btn-ghost:hover{border-color:var(--neon);color:var(--neon)}
        .btn svg{width:18px;height:18px}
        header.nav{position:fixed;top:0;left:0;right:0;z-index:50;transition:background .3s,border-color .3s;border-bottom:1px solid transparent}
        header.nav.scrolled{background:rgba(13,13,13,.85);backdrop-filter:blur(14px);border-bottom:1px solid var(--border)}
        .nav-inner{display:flex;align-items:center;justify-content:space-between;height:72px}
        .logo{display:flex;align-items:center;gap:11px;font-family:'Sora';font-weight:800;font-size:20px;letter-spacing:-.02em}
        .logo-mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--neon),var(--purple));display:grid;place-items:center;color:#0a0a0a;font-weight:800;font-size:17px;box-shadow:0 0 24px rgba(174,234,0,.35)}
        .nav-links{display:flex;align-items:center;gap:34px}
        .nav-links a{font-size:14.5px;color:var(--muted);font-weight:500;transition:color .2s}.nav-links a:hover{color:var(--text)}
        .nav-cta{display:flex;align-items:center;gap:14px}
        @media(max-width:880px){.nav-links{display:none}.nav-cta .btn-ghost{display:none}}
        .hero{position:relative;padding:170px 0 110px;overflow:hidden}
        #dots{position:fixed;inset:0;z-index:0;width:100%;height:100%;pointer-events:none}
        .hero-glow{position:absolute;border-radius:50%;filter:blur(110px);z-index:0;pointer-events:none}
        .hero-glow.g1{width:900px;height:900px;background:rgba(174,234,0,.25);top:-200px;left:-200px}
        .hero-glow.g2{width:850px;height:850px;background:rgba(124,77,255,.30);top:-50px;right:-200px}
        .hero-inner{position:relative;z-index:2;text-align:center;max-width:900px;margin:0 auto}
        .badge{display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;padding:9px 18px;border-radius:100px;border:1px solid var(--border);background:rgba(255,255,255,.02);backdrop-filter:blur(8px);font-size:13.5px;color:var(--muted);margin-bottom:30px}
        .badge .dot{width:5px;height:5px;border-radius:50%;background:var(--neon);box-shadow:0 0 10px var(--neon)}
        .badge b{color:var(--text);font-weight:600}.badge .star{color:var(--neon)}
        .hero h1{font-size:clamp(38px,6.4vw,76px);font-weight:800;margin-bottom:24px;letter-spacing:-.03em}
        .hero h1 .hl{background:linear-gradient(110deg,var(--neon),var(--purple));-webkit-background-clip:text;background-clip:text;color:transparent}
        .hero-sub{font-size:clamp(17px,2.2vw,21px);color:var(--muted);max-width:600px;margin:0 auto 38px}
        .hero-cta{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:18px}
        .hero-note{font-size:13.5px;color:var(--muted)}.hero-note span{color:var(--neon)}
        .counters{display:flex;justify-content:center;flex-wrap:wrap;margin:70px auto 0;max-width:760px;border:1px solid var(--border);border-radius:20px;background:rgba(17,17,17,.6);backdrop-filter:blur(10px);overflow:hidden}
        .counter{flex:1;min-width:180px;padding:30px 24px;text-align:center;border-right:1px solid var(--border)}.counter:last-child{border-right:none}
        .counter .num{font-family:'Sora';font-weight:800;font-size:clamp(30px,4vw,44px);color:var(--neon)}
        .counter .num .plus{color:var(--text);font-weight:700}
        .counter .lbl{font-size:13.5px;color:var(--muted);margin-top:6px}
        @media(max-width:560px){.counter{border-right:none;border-bottom:1px solid var(--border)}.counter:last-child{border-bottom:none}}
        .dash-wrap{max-width:1040px;margin:84px auto 0;perspective:1600px}
        .dash{border:1px solid var(--border);border-radius:16px;overflow:hidden;background:var(--card);box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 80px rgba(174,234,0,.06);transform:rotateX(6deg);transform-origin:center top}
        .dash-bar{display:flex;align-items:center;gap:8px;padding:13px 16px;border-bottom:1px solid var(--border);background:#0e0e0e}
        .dash-bar .d{width:11px;height:11px;border-radius:50%}.dash-bar .d.r{background:#3a2222}.dash-bar .d.y{background:#3a3522}.dash-bar .d.g{background:#223a26}
        .dash-bar .url{margin-left:14px;font-size:12px;color:var(--muted)}
        .dash-body{display:grid;grid-template-columns:200px 1fr;min-height:380px}
        .dash-side{border-right:1px solid var(--border);padding:20px 14px;background:#0e0e0e}
        .dash-side .si{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:10px;font-size:13.5px;color:var(--muted);margin-bottom:4px}
        .dash-side .si svg{width:16px;height:16px;flex:none}.dash-side .si.active{background:var(--neon-soft);color:var(--neon)}
        .dash-main{padding:24px;text-align:left}
        .dh{font-family:'Sora';font-weight:700;font-size:18px;margin-bottom:4px}
        .dhsub{font-size:12.5px;color:var(--muted);margin-bottom:20px}
        .dstats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:22px}
        .dstat{border:1px solid var(--border);border-radius:12px;padding:16px;background:#141414}
        .dstat .v{font-family:'Sora';font-weight:700;font-size:24px}.dstat .v.neon{color:var(--neon)}
        .dstat .k{font-size:11.5px;color:var(--muted);margin-top:3px}
        .dchart{border:1px solid var(--border);border-radius:12px;padding:18px;background:#141414;height:150px}
        .dchart .ct{font-size:12px;color:var(--muted);margin-bottom:14px}
        .bars{display:flex;align-items:flex-end;gap:10px;height:84px}
        .bars span{flex:1;border-radius:5px 5px 0 0;background:linear-gradient(to top,rgba(174,234,0,.25),var(--neon))}
        @media(max-width:760px){.dash-body{grid-template-columns:1fr}.dash-side{display:none}.dash{transform:none}.dstats{grid-template-columns:1fr 1fr}}
        .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
        .step{padding:0 22px;position:relative}
        .step:not(:last-child)::after{content:"";position:absolute;top:34px;right:-12px;width:24px;height:1px;background:linear-gradient(90deg,var(--border),transparent)}
        .step-ico{width:68px;height:68px;border-radius:18px;border:1px solid var(--border);background:var(--card);display:grid;place-items:center;margin-bottom:24px;transition:border-color .3s,box-shadow .3s,transform .3s}
        .step-ico svg{width:30px;height:30px;color:var(--neon)}
        .step:hover .step-ico{border-color:var(--neon);box-shadow:0 0 30px rgba(174,234,0,.18);transform:translateY(-4px)}
        .step-n{font-size:18px;font-weight:900;color:var(--purple);margin-bottom:10px;line-height:1;letter-spacing:.02em}
        .step h3{font-size:21px;font-weight:700;margin-bottom:10px}.step p{font-size:14.5px;color:var(--muted)}
        @media(max-width:880px){.steps{grid-template-columns:1fr 1fr;gap:44px 0}.step:not(:last-child)::after{display:none}}
        @media(max-width:520px){.steps{grid-template-columns:1fr}}
        .split{display:grid;grid-template-columns:1.05fr .95fr;gap:64px;align-items:center}
        @media(max-width:880px){.split{grid-template-columns:1fr;gap:44px}}
        .vitrine-mock{border:1px solid var(--border);border-radius:18px;overflow:hidden;background:var(--card);box-shadow:0 30px 80px rgba(0,0,0,.5)}
        .vit-banner{height:160px;position:relative;overflow:hidden;background:linear-gradient(120deg,#15140f,#171425);display:flex;align-items:flex-end;padding:20px}
        .vit-banner::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 75% 20%,rgba(174,234,0,.22),transparent 55%),radial-gradient(circle at 15% 90%,rgba(124,77,255,.28),transparent 55%)}
        .vit-banner .bt{position:relative;z-index:2}.vit-banner .bt .tag{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--neon)}
        .vit-banner .bt .tt{font-family:'Sora';font-weight:700;font-size:22px;margin-top:4px}
        .vit-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:18px}
        .vcard{border:1px solid var(--border);border-radius:12px;overflow:hidden;background:#141414}
        .vcard .thumb{height:84px;background:linear-gradient(135deg,#1c1b16,#1a1726);position:relative}
        .vcard .thumb::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 30%,rgba(174,234,0,.16),transparent 60%)}
        .vcard .vb{padding:12px}.vcard .vt{font-size:13px;font-weight:600;margin-bottom:8px}
        .vcard .vm{display:flex;align-items:center;justify-content:space-between}
        .vcard .price{font-size:13px;font-weight:700;color:var(--neon)}.vcard .price.free{color:var(--text)}
        .vcard .lessons{font-size:11px;color:var(--muted)}
        .vit-foot{padding:0 18px 18px}.vit-foot .acc{display:block;text-align:center;background:var(--neon);color:#0a0a0a;font-weight:600;font-size:13.5px;padding:11px;border-radius:10px}
        .feat-list{margin-top:26px;display:flex;flex-direction:column;gap:16px}
        .feat-list li{display:flex;gap:14px;align-items:flex-start;list-style:none;font-size:15.5px}
        .feat-list .ck{width:24px;height:24px;border-radius:7px;background:var(--neon-soft);display:grid;place-items:center;flex:none;margin-top:1px}
        .feat-list .ck svg{width:14px;height:14px;color:var(--neon)}
        .feat-list b{color:var(--text);font-weight:600}.feat-list span{color:var(--muted)}
        .cards-6{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        @media(max-width:880px){.cards-6{grid-template-columns:1fr 1fr}}
        @media(max-width:520px){.cards-6{grid-template-columns:1fr}}
        .acard{border:1px solid var(--border);border-radius:var(--radius);padding:28px;background:var(--card);transition:border-color .3s,transform .3s,background .3s;position:relative;overflow:hidden}
        .acard::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(174,234,0,.4),transparent);opacity:0;transition:opacity .3s}
        .acard:hover{border-color:#3a3a3a;transform:translateY(-5px);background:var(--card2)}.acard:hover::before{opacity:1}
        .acard .ai{width:50px;height:50px;border-radius:13px;background:var(--card2);border:1px solid var(--border);display:grid;place-items:center;margin-bottom:20px}
        .acard .ai svg{width:24px;height:24px;color:var(--neon)}.acard h3{font-size:18px;font-weight:700;margin-bottom:8px}.acard p{font-size:14.5px;color:var(--muted)}
        .timeline{max-width:760px;margin:0 auto;position:relative;padding-left:8px}
        .timeline::before{content:"";position:absolute;left:31px;top:14px;bottom:14px;width:1px;background:linear-gradient(var(--neon),var(--purple))}
        .tl-item{display:grid;grid-template-columns:64px 1fr;gap:26px;padding:18px 0}
        .tl-num{width:56px;height:56px;border-radius:50%;border:1px solid var(--border);background:var(--card);display:grid;place-items:center;font-family:'Sora';font-weight:700;font-size:19px;color:var(--neon);position:relative;z-index:2}
        .tl-item:hover .tl-num{border-color:var(--neon);box-shadow:0 0 24px rgba(174,234,0,.2)}
        .tl-body{padding-top:7px}.tl-body h3{font-size:19px;font-weight:700;margin-bottom:6px}.tl-body p{font-size:15px;color:var(--muted)}
        .tl-body .pill{display:inline-block;font-size:12px;color:var(--purple);background:var(--purple-soft);padding:3px 11px;border-radius:100px;margin-top:9px;font-weight:600}
        .plans{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;align-items:stretch}
        @media(max-width:980px){.plans{grid-template-columns:1fr 1fr}}
        @media(max-width:520px){.plans{grid-template-columns:1fr}}
        .plan{border:1px solid var(--border);border-radius:var(--radius);padding:28px 24px;background:var(--card);display:flex;flex-direction:column;transition:transform .3s,border-color .3s;position:relative}
        .plan:hover{transform:translateY(-6px);border-color:#3a3a3a}
        .plan.featured{border-color:var(--neon);box-shadow:0 0 50px rgba(174,234,0,.12);background:#101006}
        .plan .badge-top{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--neon);color:#0a0a0a;font-size:11.5px;font-weight:700;letter-spacing:.04em;padding:5px 14px;border-radius:100px;white-space:nowrap}
        .plan .pn{font-family:'Sora';font-weight:700;font-size:19px;margin-bottom:14px}
        .plan .pp{font-family:'Sora';font-weight:800;font-size:32px;margin-bottom:2px}
        .plan .pp small{font-size:14px;color:var(--muted);font-weight:500;font-family:'Inter'}
        .plan .pfree{color:var(--neon)}.plan .pper{font-size:12.5px;color:var(--muted);margin-bottom:22px}
        .plan ul{list-style:none;display:flex;flex-direction:column;gap:13px;margin-bottom:26px;flex:1}
        .plan li{display:flex;align-items:center;gap:11px;font-size:14px}
        .plan li svg{width:16px;height:16px;flex:none}.plan li .yes{color:var(--neon)}.plan li .no{color:#444}.plan li .lab{color:var(--muted)}
        .plan li .lab b{color:var(--text);font-weight:600}.plan .btn{justify-content:center;width:100%}
        .cert-split{display:grid;grid-template-columns:1.15fr .85fr;gap:60px;align-items:center}
        @media(max-width:880px){.cert-split{grid-template-columns:1fr;gap:44px}}
        .cert{position:relative;border:2px solid var(--neon);border-radius:14px;padding:40px;background:linear-gradient(155deg,#0e0e0c,#0c0c0c);box-shadow:0 0 70px rgba(174,234,0,.14);display:flex;flex-direction:column}
        .cert::before{content:"";position:absolute;inset:10px;border:1px solid rgba(174,234,0,.22);border-radius:8px;pointer-events:none}
        .cert .seal{position:absolute;top:30px;right:30px;width:60px;height:60px;border-radius:50%;border:1px solid var(--neon);display:grid;place-items:center;color:var(--neon)}
        .cert .seal svg{width:28px;height:28px}.cert .ctop{display:flex;align-items:center;gap:10px;margin-bottom:auto}
        .cert .ctop .lm{width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,var(--neon),var(--purple));display:grid;place-items:center;color:#0a0a0a;font-weight:800;font-size:13px}
        .cert .ctop span{font-family:'Sora';font-weight:700;font-size:14px}
        .cert .ck-label{font-size:11.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);margin-bottom:14px}
        .cert .cname{font-family:'Sora';font-weight:800;font-size:clamp(26px,4vw,40px);margin-bottom:14px;letter-spacing:-.02em}
        .cert .cdesc{font-size:14px;color:var(--muted);max-width:80%;margin-bottom:auto}.cert .cdesc b{color:var(--neon);font-weight:600}
        .cert .cfoot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:26px;gap:20px}
        .cert .cfoot .fi .l{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
        .cert .cfoot .fi .v{font-size:13px;font-weight:600}.cert .cfoot .fi .v.mono{font-family:monospace;color:var(--neon);font-size:12px}
        .cert .sig{border-top:1px solid var(--border);padding-top:7px;min-width:140px;text-align:center;font-family:'Sora';font-style:italic;font-size:15px}
        .cert-text h2{font-size:clamp(28px,3.6vw,44px);font-weight:800;margin-bottom:20px}
        .diffs{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
        @media(max-width:880px){.diffs{grid-template-columns:1fr}}
        .diff{padding:36px 30px;border:1px solid var(--border);border-radius:var(--radius);background:var(--card);transition:transform .3s,border-color .3s}
        .diff:hover{transform:translateY(-5px);border-color:#3a3a3a}
        .diff .di{width:60px;height:60px;border-radius:16px;display:grid;place-items:center;margin-bottom:22px;background:var(--card2);border:1px solid var(--border)}
        .diff .di svg{width:28px;height:28px;color:var(--neon)}.diff h3{font-size:21px;font-weight:700;margin-bottom:12px}.diff p{font-size:15px;color:var(--muted)}
        .cta-section{padding:60px 0 90px}
        .cta{position:relative;overflow:hidden;border-radius:28px;margin:0 28px;padding:90px 40px;text-align:center}
        .cta-bg{position:absolute;inset:0;background:linear-gradient(120deg,#11140a 0%,#0e0c1a 100%);z-index:0}
        .cta-bg::before{content:"";position:absolute;width:600px;height:600px;border-radius:50%;filter:blur(120px);background:rgba(174,234,0,.16);top:-260px;left:8%}
        .cta-bg::after{content:"";position:absolute;width:560px;height:560px;border-radius:50%;filter:blur(120px);background:rgba(124,77,255,.22);bottom:-280px;right:8%}
        .cta-inner{position:relative;z-index:2;max-width:680px;margin:0 auto}
        .cta h2{font-size:clamp(34px,5.4vw,60px);font-weight:800;margin-bottom:18px;letter-spacing:-.03em}
        .cta p{font-size:18px;color:#b9b9b9;margin-bottom:34px}.cta .btn{font-size:18px;padding:18px 34px}
        .cta .cnote{margin-top:22px;font-size:13.5px;color:var(--muted);display:flex;gap:22px;justify-content:center;flex-wrap:wrap}
        .cta .cnote span{display:flex;align-items:center;gap:7px}.cta .cnote svg{width:14px;height:14px;color:var(--neon)}
        footer{border-top:1px solid var(--border);padding:50px 0 40px;color:var(--muted)}
        .foot-inner{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap}
        .foot-links{display:flex;gap:26px;font-size:14px}.foot-links a:hover{color:var(--text)}.foot-copy{font-size:13px}
        @media(max-width:600px){.foot-inner{flex-direction:column;align-items:flex-start;gap:20px}}
        .reveal{opacity:0;transform:translateY(130px) scale(0.95);filter:blur(6px);transition:opacity 1.5s cubic-bezier(.16,1,.3,1),transform 1.5s cubic-bezier(.16,1,.3,1),filter 1.5s cubic-bezier(.16,1,.3,1)}
        .reveal.in{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
        .reveal.d1{transition-delay:.08s}.reveal.d2{transition-delay:.16s}.reveal.d3{transition-delay:.24s}.reveal.d4{transition-delay:.32s}
        body.force-show .reveal{opacity:1!important;transform:none!important;transition:none!important}@keyframes fadeUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:none}}
        @media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}}
      `}</style>

      <header className="nav" id="nav">
        <div className="wrap nav-inner">
          <Link className="logo" href="/"><img src="/logo.png" alt="NexoCollege" style={{height:'38px',mixBlendMode:'lighten' as any}}/></Link>
          <nav className="nav-links">
            <a href="#como">Como funciona</a><a href="#vitrine">Vitrine</a>
            <a href="#painel">Painel</a><a href="#planos">Planos</a><a href="#certificados">Certificados</a>
          </nav>
          <div className="nav-cta">
            <Link href="/login" className="btn btn-ghost">Acessar escola</Link>
            <Link href="/cadastro" className="btn btn-primary">Criar escola grátis</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <canvas id="dots"></canvas>
        <div className="hero-glow g1"></div><div className="hero-glow g2"></div>
        <div className="wrap hero-inner">
          <div className="badge reveal">
            <span className="star">✦</span><b>Plataforma brasileira</b>
            <span className="dot"></span><b>Pagamentos em PIX</b>
            <span className="dot"></span><b>Certificados automáticos</b>
          </div>
          <h1 className="reveal d1">Sua escola online. Do zero ao <span className="hl">primeiro aluno</span> em minutos.</h1>
          <p className="hero-sub reveal d2">Crie cursos, gerencie alunos e emita certificados — tudo em um lugar só.</p>
          <div className="hero-cta reveal d3">
            <Link href="/cadastro" className="btn btn-primary">Criar minha escola grátis<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></Link>
            <a href="#como" className="btn btn-ghost">Ver como funciona</a>
          </div>
          <p className="hero-note reveal d3">Sem cartão de crédito · <span>Comece gratuitamente</span></p>
          <div className="dash-wrap reveal">
            <div className="dash">
              <div className="dash-bar"><span className="d r"></span><span className="d y"></span><span className="d g"></span><span className="url">escola.nexocollege.com.br/admin</span></div>
              <div className="dash-body">
                <aside className="dash-side">
                  <div className="si active"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>Dashboard</div>
                  <div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5"/></svg>Cursos</div>
                  <div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 6a3 3 0 010 6"/></svg>Alunos</div>
                  <div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>Mensagens</div>
                  <div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="9" r="5"/><path d="M9 13l-1 8 4-2 4 2-1-8"/></svg>Certificados</div>
                </aside>
                <div className="dash-main">
                  <div className="dh">Olá, Escola Nexo 👋</div><div className="dhsub">Resumo dos últimos 30 dias</div>
                  <div className="dstats">
                    <div className="dstat"><div className="v neon">R$ 12.480</div><div className="k">Receita do mês</div></div>
                    <div className="dstat"><div className="v">214</div><div className="k">Alunos ativos</div></div>
                    <div className="dstat"><div className="v">87</div><div className="k">Certificados</div></div>
                  </div>
                  <div className="dchart"><div className="ct">Matrículas por semana</div><div className="bars"><span style={{height:'38%'}}></span><span style={{height:'54%'}}></span><span style={{height:'46%'}}></span><span style={{height:'70%'}}></span><span style={{height:'62%'}}></span><span style={{height:'88%'}}></span><span style={{height:'76%'}}></span></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="como" style={{background:'#090909'}}>
        <div className="wrap">
          <div className="section-head reveal"><p className="eyebrow">Como funciona</p><h2>Do cadastro ao <span className="neon">primeiro aluno</span> em 4 passos</h2><p>Sem precisar saber programar. Sem precisar contratar ninguém.</p></div>
          <div className="steps">
            {[
              {n:'01',title:'Crie sua escola',desc:'Cadastre-se, dê um nome e escolha sua identidade visual. Sua plataforma já existe.',icon:<><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 018 0v2"/></>},
              {n:'02',title:'Monte seus cursos',desc:'Adicione módulos e aulas com vídeos do YouTube ou Vimeo. Gratuito ou pago.',icon:<><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5"/></>},
              {n:'03',title:'Receba pagamentos',desc:'Conecte o Mercado Pago e receba direto na sua conta. PIX, cartão e boleto.',icon:<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>},
              {n:'04',title:'Compartilhe',desc:'Envie o link da vitrine. Seus alunos se cadastram e acessam na hora.',icon:<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></>},
            ].map(s=>(
              <div className="step reveal" key={s.n}>
                <div className="step-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg></div>
                <div className="step-n">{s.n}</div><h3>{s.title}</h3><p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="vitrine">
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <p className="eyebrow">Vitrine da escola</p>
              <h2>Uma vitrine profissional <span className="neon">pronta para vender</span></h2>
              <p style={{color:'var(--muted)',fontSize:17}}>Seus alunos acessam sua escola em um link com subdomínio próprio. Parece profissional desde o primeiro dia.</p>
              <ul className="feat-list">
                {[['Subdomínio próprio','suaescola.nexocollege.com.br'],['Banner e identidade visual','personalize com sua marca'],['Catálogo de cursos','gratuitos ou pagos'],['Cadastro integrado','alunos entram com acesso imediato']].map(([b,s])=>(
                  <li key={b}><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg></span><div><b>{b}</b> — <span>{s}</span></div></li>
                ))}
              </ul>
            </div>
            <div className="vitrine-mock reveal d2">
              <div className="vit-banner"><div className="bt"><div className="tag">Escola Nexo</div><div className="tt">Aprenda com propósito</div></div></div>
              <div className="vit-grid">
                <div className="vcard"><div className="thumb"></div><div className="vb"><div className="vt">Liderança Cristã</div><div className="vm"><span className="price">R$ 97</span><span className="lessons">12 aulas</span></div></div></div>
                <div className="vcard"><div className="thumb"></div><div className="vb"><div className="vt">Comunicação</div><div className="vm"><span className="price free">Grátis</span><span className="lessons">8 aulas</span></div></div></div>
              </div>
              <div className="vit-foot"><span className="acc">Criar conta gratuita →</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="painel" style={{background:'#090909'}}>
        <div className="wrap">
          <div className="section-head reveal"><p className="eyebrow">Painel administrativo</p><h2>As ferramentas certas. <span className="neon">Sem complexidade desnecessária.</span></h2><p>Focamos no essencial para você começar rápido.</p></div>
          <div className="cards-6">
            {[
              {title:'Cursos & módulos',desc:'Crie cursos com módulos e aulas em vídeo do YouTube ou Vimeo.',icon:<><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5"/></>},
              {title:'Gestão de alunos',desc:'Veja todos os inscritos, acompanhe o progresso e envie mensagens.',icon:<><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 6a3 3 0 010 6"/></>},
              {title:'Certificados automáticos',desc:'Ao concluir o curso, o aluno recebe certificado com código verificável.',icon:<><circle cx="12" cy="9" r="5"/><path d="M9 13l-1 8 4-2 4 2-1-8"/></>},
              {title:'Chat assíncrono',desc:'Comunicação direta entre professor e aluno dentro da plataforma.',icon:<><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>},
              {title:'Receba pelo Mercado Pago',desc:'Conecte sua conta e receba direto. PIX, cartão e boleto. Sem intermediários.',icon:<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>},
              {title:'Analytics & relatórios',desc:'Acompanhe matrículas, receita e progresso dos alunos.',icon:<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>},
            ].map(c=>(
              <div className="acard reveal" key={c.title}>
                <div className="ai"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{c.icon}</svg></div>
                <h3>{c.title}</h3><p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head reveal"><p className="eyebrow">Experiência do aluno</p><h2>Do cadastro ao <span className="neon">certificado</span></h2><p>Uma jornada simples e profissional para quem aprende.</p></div>
          <div className="timeline">
            {[
              {n:'1',title:'Acessa a vitrine',desc:'O aluno encontra sua escola pelo link e vê os cursos disponíveis.',pill:'suaescola.nexocollege.com.br'},
              {n:'2',title:'Se cadastra',desc:'Cria conta em segundos. Perfil vinculado automaticamente à sua escola.',pill:'Sem burocracia'},
              {n:'3',title:'Se inscreve no curso',desc:'Gratuito ou pago via Mercado Pago. Acesso liberado imediatamente.',pill:'PIX, cartão ou boleto'},
              {n:'4',title:'Aprende no seu ritmo',desc:'Assiste as aulas, avança pelos módulos. Progresso salvo automaticamente.',pill:'Player integrado'},
              {n:'5',title:'Recebe o certificado',desc:'Ao concluir 100%, certificado emitido automaticamente com código verificável.',pill:'Download em PDF'},
            ].map(item=>(
              <div className="tl-item reveal" key={item.n}>
                <div className="tl-num">{item.n}</div>
                <div className="tl-body"><h3>{item.title}</h3><p>{item.desc}</p><span className="pill">{item.pill}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="certificados" style={{background:'#090909'}}>
        <div className="wrap">
          <div className="cert-split">
            <div className="cert reveal">
              <div className="seal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="9" r="5"/><path d="M9 13l-1 8 4-2 4 2-1-8"/></svg></div>
              <div className="ctop"><div className="lm">N</div><span>NexoCollege</span></div>
              <div className="ck-label">Certificado de Conclusão</div>
              <div className="cname">Ana Lima</div>
              <div className="cdesc">concluiu com êxito o curso <b>Liderança Servidora</b>, com carga horária de 20 horas.</div>
              <div className="cfoot">
                <div className="fi"><div className="l">Data</div><div className="v">13 Jun 2026</div></div>
                <div className="fi"><div className="l">Código</div><div className="v mono">NC-3E426808</div></div>
                <div className="sig">Escola Nexo</div>
              </div>
            </div>
            <div className="cert-text reveal d2">
              <p className="eyebrow">Certificados</p>
              <h2>Reconhecimento <span className="neon">automático</span></h2>
              <p style={{color:'var(--muted)',fontSize:16,marginBottom:24}}>Cada aluno que conclui um curso recebe automaticamente um certificado verificável.</p>
              <ul className="feat-list">
                {[['Emissão automática','ao atingir 100% do curso'],['Código único verificável','qualquer pessoa pode confirmar'],['Download em PDF','pronto para compartilhar'],['Marca da sua escola','personalizado com seu nome']].map(([b,s])=>(
                  <li key={b}><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg></span><div><b>{b}</b> — <span>{s}</span></div></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="planos">
        <div className="wrap">
          <div className="section-head reveal" style={{margin:'0 auto 64px',textAlign:'center',maxWidth:'100%'}}>
            <p className="eyebrow" style={{justifyContent:'center'}}>Planos</p>
            <h2>Comece grátis. <span className="neon">Cresça no seu ritmo.</span></h2>
            <p style={{margin:'0 auto'}}>Sem surpresas. Sem taxas escondidas.</p>
          </div>
          <div className="plans">
            <div className="plan reveal">
              <div className="pn">Starter</div><div className="pp pfree">R$ 0</div><div className="pper">Para sempre · gratuito</div>
              <ul>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab"><b>1</b> curso</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab"><b>50</b> alunos</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab">Vitrine personalizada</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line className="no" x1="18" y1="6" x2="6" y2="18"/><line className="no" x1="6" y1="6" x2="18" y2="18"/></svg><span style={{color:'#555'}}>Certificados</span></li>
              </ul>
              <Link href="/cadastro?plano=starter" className="btn btn-ghost">Começar grátis</Link>
            </div>
            <div className="plan reveal d1">
              <div className="pn">Creator</div><div className="pp">R$ {fmt(precos.creator)}<small>/ano</small></div><div className="pper">Cobrado anualmente</div>
              <ul>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab"><b>5</b> cursos</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab"><b>200</b> alunos</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab">Vitrine personalizada</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab">Certificados automáticos</span></li>
              </ul>
              <Link href="/cadastro?plano=creator" className="btn btn-ghost">Assinar Creator</Link>
            </div>
            <div className="plan featured reveal d2">
              <div className="badge-top">⭐ MAIS VENDIDO</div>
              <div className="pn neon">Pro</div><div className="pp">R$ {fmt(precos.pro)}<small>/ano</small></div><div className="pper">Cobrado anualmente</div>
              <ul>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab"><b>15</b> cursos</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab"><b>500</b> alunos</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab">Vitrine personalizada</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab">Certificados automáticos</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab">Gateway MP próprio</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab">Suporte prioritário</span></li>
              </ul>
              <Link href="/cadastro?plano=pro" className="btn btn-primary">Assinar Pro</Link>
            </div>
            <div className="plan reveal d3">
              <div className="pn">Scale</div><div className="pp">R$ {fmt(precos.scale)}<small>/ano</small></div><div className="pper">Cobrado anualmente</div>
              <ul>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab"><b>50</b> cursos</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab"><b>2.000</b> alunos</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab">Vitrine personalizada</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab">Certificados automáticos</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab">Gateway MP próprio</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab">Domínio próprio</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline className="yes" points="20 6 9 17 4 12"/></svg><span className="lab">Suporte VIP</span></li>
              </ul>
              <Link href="/cadastro?plano=scale" className="btn btn-ghost">Assinar Scale</Link>
            </div>
          </div>
          <div className="reveal" style={{marginTop:24,border:'1px solid #2a3500',borderRadius:22,padding:'40px 48px',background:'linear-gradient(135deg,#141414,#1a1f00)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:32}}>
            <div style={{flex:1,minWidth:280}}>
              <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.14em',color:'var(--neon)',marginBottom:12}}>Enterprise</div>
              <div style={{fontSize:32,fontWeight:900,fontFamily:'Sora',marginBottom:8}}>Para grandes operações</div>
              <div style={{fontSize:16,color:'var(--muted)'}}>Volume ilimitado. Suporte dedicado. Proposta sob medida.</div>
            </div>
            <div style={{textAlign:'center',minWidth:200}}>
              <div style={{fontSize:13,color:'#555',marginBottom:16}}>Preço sob consulta</div>
              <a href="mailto:contato@nexocollege.com.br" className="btn btn-primary">Falar com a equipe</a>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{background:'#090909'}}>
        <div className="wrap">
          <div className="section-head reveal" style={{margin:'0 auto 64px',textAlign:'center',maxWidth:'100%'}}>
            <p className="eyebrow" style={{justifyContent:'center'}}>Por que NexoCollege</p>
            <h2>Simples para você. <span className="neon">Profissional para seus alunos.</span></h2>
          </div>
          <div className="diffs">
            {[
              {title:'Comece gratuitamente',desc:'Comece sem pagar nada. Crie seu primeiro curso e valide sua ideia antes de investir.',icon:<><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>},
              {title:'Receba direto no seu banco',desc:'Sem intermediários. Conecte o Mercado Pago e os pagamentos vão direto para você.',icon:<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>},
              {title:'Feito para professores e líderes',desc:'Pensado para quem tem conhecimento e quer compartilhar. Sem equipe técnica.',icon:<><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>},
            ].map(d=>(
              <div className="diff reveal" key={d.title}>
                <div className="di"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d.icon}</svg></div>
                <h3>{d.title}</h3><p>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta reveal">
          <div className="cta-bg"></div>
          <div className="cta-inner">
            <h2>Você tem conhecimento.<br/><span className="neon">O mundo precisa ouvir você.</span></h2>
            <p>Crie sua escola agora. É grátis, rápido e sem complicação.</p>
            <Link href="/cadastro" className="btn btn-primary">🚀 Criar minha escola agora<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></Link>
            <div className="cnote">
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Sem cartão de crédito</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Pronto em minutos</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Plano gratuito para sempre</span>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot-inner">
          <img src="/logo.png" alt="NexoCollege" style={{height:'30px',mixBlendMode:'lighten' as any}}/>
          <div className="foot-links"><a href="#como">Como funciona</a><a href="#planos">Planos</a><Link href="/login">Acessar escola</Link></div>
          <p className="foot-copy">© 2026 NexoCollege. Todos os direitos reservados.</p>
        </div>
      </footer>
    </>
  )
}
