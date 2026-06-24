import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/master/',
          '/api/',
          '/aceitar-termos',
          '/redefinir-senha',
          '/auth/',
        ],
      },
    ],
    sitemap: 'https://nexocollege.com.br/sitemap.xml',
    host: 'https://nexocollege.com.br',
  }
}
