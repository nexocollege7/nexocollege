'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Course = {
  id: string
  title: string
  description: string | null
  slug: string
  thumbnail_url: string | null
  price: number | null
  is_free: boolean
  total_lessons: number
}

type Props = {
  courses: Course[]
  slug: string
  cor: string
  appUrl: string
}

export default function BannerRotativo({ courses, slug, cor, appUrl }: Props) {
  const [atual, setAtual] = useState(0)
  const [animando, setAnimando] = useState(false)

  useEffect(() => {
    if (courses.length <= 1) return
    const intervalo = setInterval(() => {
      trocar((prev) => (prev + 1) % courses.length)
    }, 12000)
    return () => clearInterval(intervalo)
  }, [courses.length])

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

  const destaque = courses[atual]
  if (!destaque) return null

  return (
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
          opacity: animando ? 0 : 1,
          transition: 'opacity 0.8s ease',
        }} />
      )}

      {/* Gradiente */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: `linear-gradient(to right, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.15) 100%),
                     linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%),
                     radial-gradient(ellipse at 70% 50%, ${cor}22 0%, transparent 60%)`,
      }} />

      {/* Conteúdo */}
      <div style={{
        position: 'relative', zIndex: 2, padding: '0 48px 80px', maxWidth: '600px',
        opacity: animando ? 0 : 1,
        transition: 'opacity 0.8s ease',
      }}>
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
          <Link href={`${appUrl}/vitrine/${slug}/${destaque.slug}`} style={{
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

      {/* Bolinhas indicadoras */}
      {courses.length > 1 && (
        <div style={{
          position: 'absolute', bottom: '32px', right: '48px',
          zIndex: 3, display: 'flex', gap: '8px',
        }}>
          {courses.map((_, i) => (
            <button
              key={i}
              onClick={() => irPara(i)}
              style={{
                width: i === atual ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: i === atual ? cor : 'rgba(255,255,255,0.3)',
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
