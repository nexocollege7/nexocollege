import type { Metadata } from "next";
import { Space_Grotesk, Inter, Sora } from "next/font/google";
import "./globals.css";
import JsonLd from './_components/JsonLd'

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NexoCollege',
  },

  metadataBase: new URL('https://nexocollege.com.br'),
  title: {
    default: 'NexoCollege — Crie sua escola online gratuitamente',
    template: '%s | NexoCollege',
  },
  description: 'Plataforma simples para criar escolas online. Crie cursos, gerencie alunos, emita certificados e receba pagamentos via Mercado Pago. Comece gratuitamente.',
  keywords: ['plataforma de cursos online', 'criar escola online', 'EAD brasileiro', 'vender cursos online', 'plataforma EAD', 'certificado online', 'Mercado Pago cursos', 'escola virtual'],
  authors: [{ name: 'NexoCollege', url: 'https://nexocollege.com.br' }],
  creator: 'NexoCollege',
  publisher: 'NexoCollege',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://nexocollege.com.br',
    siteName: 'NexoCollege',
    title: 'NexoCollege — Crie sua escola online gratuitamente',
    description: 'Plataforma simples para criar escolas online. Cursos, certificados e pagamentos via Mercado Pago. Comece grátis.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NexoCollege — Plataforma de ensino online brasileira',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexoCollege — Crie sua escola online gratuitamente',
    description: 'Plataforma simples para criar escolas online. Comece grátis.',
    images: ['/og-image.png'],
    creator: '@nexocollege',
  },
  alternates: {
    canonical: 'https://nexocollege.com.br',
  },
  verification: {
    google: 'ewYJdD2wU4lX6zroQtpke3I_q4-hQxF2L3ouCBjKveQ',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`dark ${spaceGrotesk.variable} ${inter.variable} ${sora.variable}`}>
      <body
        className={`${spaceGrotesk.variable} font-sans antialiased`}
        style={{
          backgroundColor: "#0D0D0D",
          color: "#F0F0F0",
          minHeight: "100vh",
        }}
      >
        <JsonLd />
        {children}
      </body>
    </html>
  );
}