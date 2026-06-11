'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'
import { SidebarAluno } from './sidebar-aluno'
import { Header } from './header'

interface AdminLayoutProps {
  children: React.ReactNode
  user: {
    email: string
    role?: string
  }
  title?: string
}

export function AdminLayout({ children, user, title }: AdminLayoutProps) {
  const pathname = usePathname()

  const isAreaAluno =
    pathname.startsWith('/dashboard/meus-cursos') ||
    pathname.startsWith('/dashboard/aprender') ||
    pathname.startsWith('/dashboard/certificados') ||
    pathname.startsWith('/dashboard/mensagens')

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0D0D0D' }}>
      {isAreaAluno ? <SidebarAluno /> : <Sidebar />}
      <div className="flex-1 flex flex-col">
        <Header user={user} title={title} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}