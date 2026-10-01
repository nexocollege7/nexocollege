import { ImageResponse } from 'next/og'
import { getSchoolBySlug } from '@/app/actions/vitrine-actions'

export const alt = 'Vitrine da escola'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const school = await getSchoolBySlug(slug)
  const name = school?.name ?? 'NexoCollege'
  const logo = school?.logo_url ?? null

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0D0D0D',
          padding: 60,
        }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={name} width={520} height={260} style={{ objectFit: 'contain' }} />
        ) : null}
        <div
          style={{
            display: 'flex',
            marginTop: 40,
            fontSize: 64,
            fontWeight: 700,
            color: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          {name}
        </div>
        <div style={{ display: 'flex', marginTop: 16, fontSize: 30, color: '#AEEA00' }}>
          Conheça nossos cursos
        </div>
      </div>
    ),
    { ...size }
  )
}
