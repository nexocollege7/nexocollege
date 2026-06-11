import { Sidebar } from './sidebar'
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
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header user={user} title={title} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}