import type { Metadata } from "next";
import { Space_Grotesk, Inter, Sora } from "next/font/google";
import "./globals.css";

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
  title: "NexoCollege",
  description: "Plataforma de ensino online",
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
        {children}
      </body>
    </html>
  );
}