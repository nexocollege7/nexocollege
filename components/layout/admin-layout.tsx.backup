'use client'

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
  const isAluno = user.role === 'student'

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0D0D0D' }}>
      {isAluno ? <SidebarAluno /> : <Sidebar />}
      <div className="flex-1 flex flex-col">
        <Header user={user} title={title} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
