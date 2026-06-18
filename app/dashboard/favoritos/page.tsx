'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getMeusFavoritos } from '@/app/actions/lesson-interactions-actions'

type Favorito = {
  lessonId: string
  lessonTitle: string
  courseId: string
  courseTitle: string
  courseThumbnail: string | null
}

export default function FavoritosPage() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMeusFavoritos().then((data) => {
      setFavoritos(data as Favorito[])
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: '#555555' }}>Carregando favoritos...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F0F0F0', margin: 0 }}>Favoritos</h1>
        <p style={{ color: '#555555', fontSize: '13px', margin: '4px 0 0' }}>
          {favoritos.length} aula{favoritos.length !== 1 ? 's' : ''} favoritada{favoritos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {favoritos.length === 0 ? (
        <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', marginBottom: '16px' }}>⭐</p>
          <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '16px', margin: '0 0 8px' }}>
            Nenhuma aula favoritada ainda
          </p>
          <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
            Clique no ☆ dentro de uma aula para favoritá-la e encontrá-la rápido aqui.
          </p>
        </div>
      ) : (
        <div className="favoritos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          <style>{`
            @media (max-width: 480px) { .favoritos-grid { grid-template-columns: 1fr !important; } }
          `}</style>
          {favoritos.map((f) => (
            <Link
              key={f.lessonId}
              href={`/dashboard/aprender/${f.courseId}?aula=${f.lessonId}`}
              style={{
                backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px',
                overflow: 'hidden', textDecoration: 'none', display: 'block',
              }}
            >
              <div style={{
                height: '120px', backgroundColor: f.courseThumbnail ? '#000' : '#AEEA00',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', overflow: 'hidden', position: 'relative',
              }}>
                {f.courseThumbnail ? (
                  <Image src={f.courseThumbnail} alt={f.courseTitle} fill style={{ objectFit: 'cover' }} />
                ) : '⭐'}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: '11px', color: '#555555', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {f.courseTitle}
                </p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#F0F0F0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.lessonTitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
