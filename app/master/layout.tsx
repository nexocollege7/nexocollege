import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MasterSidebar } from '@/components/layout/master-sidebar'
import { Header } from '@/components/layout/header'

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.NEXT_PUBLIC_MASTER_EMAIL) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0D0D0D' }}>
      <MasterSidebar />
      <div className="flex-1 flex flex-col">
        <Header user={{ email: user.email ?? '', role: 'master' }} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}