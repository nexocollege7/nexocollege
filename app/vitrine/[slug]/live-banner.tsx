'use client'

import { useEffect, useState } from 'react'
import { getLiveStatus } from '@/app/actions/vitrine-actions'
import { getEmbedUrl } from '@/lib/video-embed'
import BannerRotativo, { type Slide } from './banner-rotativo'

type Course = Extract<Slide, { tipo: 'curso' }>
type Mentoria = Omit<Extract<Slide, { tipo: 'mentoria' }>, 'tipo'>

type Props = {
  schoolId: string
  liveUrlInitial: string | null
  liveActiveInitial: boolean
  courses: Omit<Course, 'tipo'>[]
  mentorias: Mentoria[]
  slug: string
  cor: string
  basePath: string
}

export function LiveBanner({ schoolId, liveUrlInitial, liveActiveInitial, courses, mentorias, slug, cor, basePath }: Props) {
  const [liveActive, setLiveActive] = useState(liveActiveInitial)
  const [liveUrl, setLiveUrl] = useState(liveUrlInitial)

  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await getLiveStatus(schoolId)
      setLiveActive(status.liveActive)
      setLiveUrl(status.liveUrl)
    }, 30000)
    return () => clearInterval(interval)
  }, [schoolId])

  if (liveActive && liveUrl) {
    return (
      <div style={{ position: 'relative', height: '85vh', minHeight: '500px', backgroundColor: '#000000' }}>
        <style>{`
          @keyframes live-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .live-badge-dot { animation: live-pulse 1.4s ease-in-out infinite; }
        `}</style>
        <iframe
          src={getEmbedUrl(liveUrl, { mute: true })}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div style={{
          position: 'absolute', top: '90px', left: '24px', zIndex: 10,
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '20px',
          backgroundColor: 'rgba(255,68,68,0.9)',
        }}>
          <span className="live-badge-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }} />
          <span style={{ color: '#fff', fontWeight: '800', fontSize: '13px', letterSpacing: '0.04em' }}>🔴 AO VIVO</span>
        </div>
      </div>
    )
  }

  if (courses.length > 0 || mentorias.length > 0) {
    const slides: Slide[] = [
      ...courses.map((c): Slide => ({ tipo: 'curso', ...c })),
      ...mentorias.map((m): Slide => ({ tipo: 'mentoria', ...m })),
    ]
    return <BannerRotativo slides={slides} slug={slug} cor={cor} basePath={basePath} />
  }

  return (
    <div style={{
      height: '85vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: '16px',
    }}>
      <p style={{ fontSize: '48px' }}>📚</p>
      <p style={{ color: '#888888', fontSize: '18px' }}>Nenhum curso disponível ainda</p>
    </div>
  )
}
