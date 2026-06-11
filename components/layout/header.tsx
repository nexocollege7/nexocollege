'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  user: {
    email: string
    role?: string
  }
  title?: string
}

export function Header({ user, title }: HeaderProps) {
  const initials = user.email?.substring(0, 2).toUpperCase() || 'NC'
  const roleLabel = {
    master: 'Master',
    owner: 'Dono da Escola',
    teacher: 'Professor',
    student: 'Aluno',
  }[user.role || 'student'] || 'Usuário'

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <div>
        {title && (
          <h1 className="text-lg font-semibold text-white">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-white">{user.email}</p>
          <Badge variant="secondary" className="text-xs">
            {roleLabel}
          </Badge>
        </div>
        <Avatar className="w-9 h-9">
          <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}