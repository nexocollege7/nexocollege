'use client'

import { useEffect } from 'react'

type Props = {
  schoolName: string | null
  schoolLogoUrl: string | null
  role: string | null
}

export function SchoolBranding({ schoolName, schoolLogoUrl, role }: Props) {
  useEffect(() => {
    if (role !== 'student' || !schoolName) return

    // Atualizar título
    document.title = schoolName

    // Atualizar favicon
    if (schoolLogoUrl) {
      const updateFavicon = (rel: string) => {
        let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
        if (!link) {
          link = document.createElement('link')
          link.rel = rel
          document.head.appendChild(link)
        }
        link.href = schoolLogoUrl
      }
      updateFavicon('icon')
      updateFavicon('shortcut icon')
      updateFavicon('apple-touch-icon')
    }
  }, [schoolName, schoolLogoUrl, role])

  return null
}
