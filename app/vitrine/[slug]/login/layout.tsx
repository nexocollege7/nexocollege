import { getSchoolBySlug } from '@/app/actions/vitrine-actions'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const school = await getSchoolBySlug(slug)
  return {
    title: {
      absolute: school?.name ?? 'NexoCollege',
    },
    icons: school?.logo_url ? {
      icon: school.logo_url,
      apple: school.logo_url,
    } : {
      icon: '/favicon-32x32.png',
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
  }
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
