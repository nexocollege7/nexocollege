import { getSchoolBySlug } from '@/app/actions/vitrine-actions'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const school = await getSchoolBySlug(slug)
  return {
    title: {
      absolute: school?.name ?? 'NexoCollege',
    },
  }
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
