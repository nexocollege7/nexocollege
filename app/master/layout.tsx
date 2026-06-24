import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MasterLayoutClient } from '@/components/layout/master-layout-client'

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.MASTER_EMAIL) {
    redirect('/dashboard')
  }

  return (
    <MasterLayoutClient userEmail={user.email ?? ''}>
      {children}
    </MasterLayoutClient>
  )
}
