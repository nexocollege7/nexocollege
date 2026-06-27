import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'abplqkfthrytgqfwpnqx.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js precisa de unsafe-inline para hidratação e estilos injetados
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              // Imagens: self, data URIs (base64 splash), Supabase Storage
              "img-src 'self' data: blob: https://abplqkfthrytgqfwpnqx.supabase.co",
              // API e WebSocket do Supabase + Mercado Pago API
              "connect-src 'self' https://abplqkfthrytgqfwpnqx.supabase.co wss://abplqkfthrytgqfwpnqx.supabase.co https://api.mercadopago.com",
              // Iframes: YouTube, Vimeo, Panda Video
              "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://*.pandavideo.com.br",
              // Fontes e workers
              "font-src 'self' data:",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
