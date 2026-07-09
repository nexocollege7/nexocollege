import type { Metadata } from 'next'
import { getSchoolBySlug } from '@/app/actions/vitrine-actions'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const school = await getSchoolBySlug(slug)

  return {
    icons: {
      icon: school?.logo_url
        ? [{ url: school.logo_url, type: 'image/png' }]
        : [
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          ],
      shortcut: school?.logo_url ?? '/favicon.ico',
      apple: school?.logo_url ?? '/apple-touch-icon.png',
    },
  }
}

export default function VitrineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
