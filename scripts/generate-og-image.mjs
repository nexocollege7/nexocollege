import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '..', 'public', 'og-image.png')

const WIDTH = 1200
const HEIGHT = 630

const FONT = "'Helvetica Neue', Arial, sans-serif"

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22310B" />
      <stop offset="50%" stop-color="#0A0A0A" />
      <stop offset="100%" stop-color="#3A1F6B" />
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />

  <!-- Símbolo NEXO: dois retângulos sobrepostos -->
  <g transform="translate(80,72)">
    <rect x="0" y="0" width="58" height="58" rx="8" fill="#7BC81E" opacity="0.55" transform="rotate(-8 29 29)" />
    <rect x="14" y="10" width="58" height="58" rx="8" fill="#7BC81E" />
  </g>

  <!-- Wordmark -->
  <text x="170" y="118" font-family="${FONT}" font-size="58" font-weight="800" letter-spacing="2" fill="#C7CCD1">NEXO</text>
  <text x="171" y="148" font-family="${FONT}" font-size="22" font-weight="500" letter-spacing="3" fill="#F0F0F0">College</text>

  <!-- Tagline -->
  <text x="80" y="320" font-family="${FONT}" font-size="54" font-weight="700" fill="#F0F0F0">Crie sua escola online.</text>
  <text x="80" y="372" font-family="${FONT}" font-size="27" font-weight="400" fill="#888888">Do zero ao primeiro aluno em minutos.</text>

  <!-- Badge CTA -->
  <rect x="80" y="425" width="338" height="60" rx="30" fill="#C9F23D" />
  <text x="249" y="463" font-family="${FONT}" font-size="23" font-weight="700" fill="#0A0A0A" text-anchor="middle">Comece gratuitamente →</text>

  <!-- Rodapé -->
  <text x="80" y="566" font-family="${FONT}" font-size="17" font-weight="600" letter-spacing="3" fill="#888888">NEXOCOLLEGE.COM.BR</text>

  <!-- Linha decorativa -->
  <rect x="0" y="608" width="${WIDTH}" height="6" fill="#7BC81E" />
</svg>
`

const buffer = await sharp(Buffer.from(svg)).png().toBuffer()
writeFileSync(OUT_PATH, buffer)
console.log(`OG image gerada em: ${OUT_PATH}`)
