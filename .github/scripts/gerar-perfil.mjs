// Gera o cabeçalho do README (perfil/cabecalho.svg) com a foto atual do GitHub.
// Uso: GITHUB_TOKEN=... node .github/scripts/gerar-perfil.mjs  (roda toda semana pelo workflow perfil.yml)
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const LOGIN = 'Gudoourado'
const NOME = 'Gustavo Dourado'
const CARGO = 'Desenvolvedor Full Stack · foco em back-end'
const STACK = ['TypeScript', 'NestJS', 'Angular', 'PostgreSQL']
const AREAS = ['Sistemas web de ponta a ponta', 'APIs e modelagem de dados', 'Agentes de IA']
const DISPONIBILIDADE = 'São Paulo (híbrido) ou remoto'

// Paleta do GitHub escuro: o painel parece parte da página, não um banner colado.
const C = { fundo: '#0d1117', superficie: '#161b22', borda: '#30363d', texto: '#e6edf3', apagado: '#8b949e', azul: '#58a6ff', verde: '#7ee787' }
const SANS = "Inter, 'Segoe UI', -apple-system, 'Helvetica Neue', Arial, sans-serif"
const MONO = "'JetBrains Mono', 'Cascadia Mono', Consolas, 'Courier New', monospace"
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function avatar() {
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query: `{ user(login: "${LOGIN}") { avatarUrl(size: 400) } }` }),
  })
  const url = (await r.json()).data?.user?.avatarUrl
  if (!url) throw new Error('Não achei a foto do perfil')
  // A foto vai embutida: o GitHub não deixa um SVG em <img> buscar imagens de fora.
  const jpg = await sharp(Buffer.from(await (await fetch(url)).arrayBuffer())).resize(240, 240, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer()
  return `data:image/jpeg;base64,${jpg.toString('base64')}`
}

function cabecalho(foto) {
  const W = 1200, H = 340
  let chips = '', x = 300
  for (const s of STACK) {
    const w = s.length * 9.4 + 28
    chips += `<rect x="${x}" y="196" width="${w}" height="32" rx="6" fill="${C.superficie}" stroke="${C.borda}"/>
      <text x="${x + w / 2}" y="217" fill="${C.azul}" font-family="${MONO}" font-size="14" text-anchor="middle">${esc(s)}</text>`
    x += w + 10
  }
  const areas = AREAS.map((a, i) => `<rect x="900" y="${121 + i * 34}" width="8" height="8" rx="2" fill="${C.verde}"/><text x="918" y="${132 + i * 34}" fill="${C.texto}" font-family="${SANS}" font-size="16">${esc(a)}</text>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(`${NOME}, ${CARGO}. ${STACK.join(', ')}.`)}">
  <defs><clipPath id="redondo"><circle cx="160" cy="160" r="96"/></clipPath></defs>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="${C.fundo}" stroke="${C.borda}" stroke-width="2"/>
  <circle cx="160" cy="160" r="99" fill="none" stroke="${C.borda}" stroke-width="3"/>
  <image href="${foto}" xlink:href="${foto}" x="64" y="64" width="192" height="192" clip-path="url(#redondo)"/>
  <text x="300" y="92" fill="${C.apagado}" font-family="${MONO}" font-size="15">github.com/${LOGIN}</text>
  <text x="298" y="146" fill="${C.texto}" font-family="${SANS}" font-size="46" font-weight="700">${esc(NOME)}</text>
  <text x="300" y="180" fill="${C.apagado}" font-family="${SANS}" font-size="20">${esc(CARGO)}</text>
  ${chips}
  <line x1="870" y1="96" x2="870" y2="244" stroke="${C.borda}"/>
  <text x="900" y="96" fill="${C.apagado}" font-family="${MONO}" font-size="13">O QUE EU CONSTRUO</text>
  ${areas}
  <line x1="40" y1="276" x2="${W - 40}" y2="276" stroke="${C.borda}"/>
  <text x="40" y="310" fill="${C.apagado}" font-family="${SANS}" font-size="15">Estágio full stack · freelancer · Ciência da Computação (conclusão no fim de 2026)</text>
  <text x="${W - 40}" y="310" fill="${C.verde}" font-family="${SANS}" font-size="15" text-anchor="end">● Disponível: ${esc(DISPONIBILIDADE)}</text>
</svg>`
}

await mkdir('perfil', { recursive: true })
await writeFile('perfil/cabecalho.svg', cabecalho(await avatar()))
console.log('cabeçalho gerado')
