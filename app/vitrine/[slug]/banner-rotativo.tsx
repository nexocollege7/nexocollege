'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type CursoSlide = {
  tipo: 'curso'
  id: string
  title: string
  description: string | null
  slug: string
  thumbnail_url: string | null
  price: number | null
  is_free: boolean
  total_lessons: number
}

type MentoriaSlide = {
  tipo: 'mentoria'
  id: string
  title: string
  description: string | null
  slug: string
  cover_url: string | null
  price: number | null
}

export type Slide = CursoSlide | MentoriaSlide

type Props = {
  slides: Slide[]
  slug: string
  cor: string
  basePath: string
}

export default function BannerRotativo({ slides, slug, cor, basePath }: Props) {
  const [atual, setAtual] = useState(0)
  const [animando, setAnimando] = useState(false)

  useEffect(() => {
    if (slides.length <= 1) return
    const intervalo = setInterval(() => {
      trocar((prev) => (prev + 1) % slides.length)
    }, 12000)
    return () => clearInterval(intervalo)
  }, [slides.length])

  function trocar(fn: (prev: number) => number) {
    setAnimando(true)
    setTimeout(() => {
      setAtual(fn)
      setAnimando(false)
    }, 300)
  }

  function irPara(index: number) {
    if (index === atual) return
    setAnimando(true)
    setTimeout(() => {
      setAtual(index)
      setAnimando(false)
    }, 300)
  }

  const destaque = slides[atual]
  if (!destaque) return null

  const ehCurso = destaque.tipo === 'curso'
  const imagem = ehCurso ? destaque.thumbnail_url : destaque.cover_url
  const gratis = ehCurso ? destaque.is_free : Number(destaque.price) <= 0
  const accent = ehCurso ? cor : '#7C4DFF'
  const href = ehCurso ? `${basePath}/${destaque.slug}` : `${basePath}/mentorias/${destaque.slug}`
  const ctaLabel = ehCurso ? '▶ Ver curso' : '🎓 Ver mentoria'
  const badgeSecundario = ehCurso ? `${destaque.total_lessons} aulas` : 'Inscrições abertas'

  return (
    <div style={{
      position: 'relative', height: '85vh', minHeight: '500px',
      display: 'flex', alignItems: 'flex-end',
      backgroundColor: '#111111',
      overflow: 'hidden',
    }}>
      <style>{`
        @media (max-width: 768px) {
          .banner-conteudo { padding: 0 24px 60px !important; }
          .banner-titulo { font-size: 36px !important; }
          .banner-dots { right: 24px !important; bottom: 24px !important; }
        }
        @media (max-width: 480px) {
          .banner-conteudo { padding: 0 16px 48px !important; }
          .banner-titulo { font-size: 28px !important; }
          .banner-btns { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>
      {/* Imagem de fundo */}
      {imagem && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url(${imagem})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: animando ? 0 : 1,
          transition: 'opacity 0.8s ease',
        }} />
      )}

      {/* Gradiente */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: `linear-gradient(to right, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.15) 100%),
                     linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%),
                     radial-gradient(ellipse at 70% 50%, ${accent}22 0%, transparent 60%)`,
      }} />

      {/* Conteúdo */}
      <div className="banner-conteudo" style={{
        position: 'relative', zIndex: 2, padding: '0 48px 80px', maxWidth: '600px',
        opacity: animando ? 0 : 1,
        transition: 'opacity 0.8s ease',
      }}>
        <div style={{
          display: 'inline-block', fontSize: '11px', fontWeight: '700',
          color: accent, textTransform: 'uppercase', letterSpacing: '0.12em',
          marginBottom: '12px',
        }}>
          EM DESTAQUE
        </div>
        <h1 className="banner-titulo" style={{
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
        <div className="banner-btns" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link href={href} style={{
            padding: '14px 32px', borderRadius: '8px',
            backgroundColor: accent, color: '#0D0D0D',
            fontWeight: '800', fontSize: '15px',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px',
          }}>
            {ctaLabel}
          </Link>
          <div style={{
            padding: '14px 24px', borderRadius: '8px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: '#F0F0F0', fontWeight: '700', fontSize: '15px',
          }}>
            {gratis ? '🎁 Gratuito' : `R$ ${Number(destaque.price).toFixed(2)}`}
          </div>
          <div style={{
            padding: '14px 24px', borderRadius: '8px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: '#BBBBBB', fontSize: '14px',
          }}>
            {badgeSecundario}
          </div>
        </div>
      </div>

      {/* Bolinhas indicadoras */}
      {slides.length > 1 && (
        <div className="banner-dots" style={{
          position: 'absolute', bottom: '32px', right: '48px',
          zIndex: 3, display: 'flex', gap: '8px',
        }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => irPara(i)}
              style={{
                width: i === atual ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: i === atual ? accent : 'rgba(255,255,255,0.3)',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
