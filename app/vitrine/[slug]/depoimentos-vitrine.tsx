import Image from 'next/image'

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : (parts[0]?.[0] || '?').toUpperCase()
}

type Review = {
  id: string
  content: string
  studentName: string
  studentAvatarUrl: string | null
  courseTitle: string
}

export function DepoimentosVitrine({ reviews, cor }: { reviews: Review[]; cor: string }) {
  if (reviews.length === 0) return null

  // Duplica a lista para o efeito de scroll infinito sem salto
  const loop = [...reviews, ...reviews]

  return (
    <div style={{ padding: '48px 0 80px', overflow: 'hidden' }}>
      <style>{`
        @keyframes depoimentos-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .depoimentos-track {
          animation: depoimentos-scroll 40s linear infinite;
        }
        .depoimentos-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#F0F0F0', margin: '0 0 24px', padding: '0 48px' }}>
        O que estão falando dos nossos cursos
      </h2>

      <div style={{ display: 'flex', width: 'max-content' }} className="depoimentos-track">
        {loop.map((r, i) => (
          <div
            key={`${r.id}-${i}`}
            style={{
              width: '320px', flexShrink: 0, margin: '0 10px',
              backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                backgroundColor: cor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '700', color: '#0D0D0D',
              }}>
                {r.studentAvatarUrl ? (
                  <Image src={r.studentAvatarUrl} alt="" width={36} height={36} style={{ objectFit: 'cover' }} />
                ) : getInitials(r.studentName)}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#F0F0F0', fontWeight: '600', fontSize: '13px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.studentName}
                </p>
                <p style={{ color: '#666666', fontSize: '11px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.courseTitle}
                </p>
              </div>
            </div>
            <p style={{ color: '#CCCCCC', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
              “{r.content}”
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
