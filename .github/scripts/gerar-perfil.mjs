// Gera os painéis do README (perfil/*.svg) com dados públicos do GitHub.
// Uso: GITHUB_TOKEN=... node .github/scripts/gerar-perfil.mjs  (roda todo dia pelo workflow perfil.yml)
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const LOGIN = 'Gudoourado'
const NOME = 'Gustavo Dourado'
const CARGO = 'Desenvolvedor Full Stack · foco em back-end'
const ETIQUETAS = ['TypeScript', 'NestJS', 'Angular', 'PostgreSQL']
const EXPERIENCIA = [['ESTÁGIO FULL STACK', 'Sunter Tecnologia · desde abr/2026'], ['FREELANCER', 'sistemas full stack · desde ago/2026']]
// Cada cartão mostra o título e uma competência só: texto longo não fica legível no tamanho do GitHub.
const DESTAQUES = [
  ['financeiro-rls', 'RLS no PostgreSQL medido com EXPLAIN ANALYZE'],
  ['agente-volta-zero', 'IA que passa para um humano com o ticket pronto'],
  ['cerebro-avaliacao', 'Avaliação de busca BM25+ caso a caso'],
  ['personal-finance-api', 'API REST em Java 17 com testes e CI'],
]

const C = { painel: '#0d1117', borda: '#30363d', neon: '#7ee787', texto: '#e6edf3', apagado: '#a8b3c7', chip: '#161b22', azul: '#58a6ff' }
const FONTE = "'JetBrains Mono', 'Cascadia Mono', Consolas, 'Courier New', monospace"
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function dados() {
  const query = `{ user(login: "${LOGIN}") {
    avatarUrl(size: 400)
    repositories(ownerAffiliations: OWNER, privacy: PUBLIC, first: 100, isFork: false) { nodes { name primaryLanguage { name color } } }
    contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }`
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST', headers: { authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify({ query }),
  })
  const j = await r.json()
  if (!j.data?.user) throw new Error(`GraphQL: ${JSON.stringify(j.errors ?? j)}`)
  return j.data.user
}

// A foto vai embutida: o GitHub não deixa um SVG em <img> buscar imagens de fora.
async function foto(url) {
  const jpg = await sharp(Buffer.from(await (await fetch(url)).arrayBuffer())).resize(240, 240, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer()
  return `data:image/jpeg;base64,${jpg.toString('base64')}`
}

const pontinhos = (x, y) => `<circle cx="${x}" cy="${y}" r="6" fill="#ff5f57"/><circle cx="${x + 20}" cy="${y}" r="6" fill="#febc2e"/><circle cx="${x + 40}" cy="${y}" r="6" fill="#28c840"/>`
const painel = (x, y, w, h, titulo, direita = '') => `
  <rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="14" fill="${C.painel}" stroke="${C.borda}" stroke-width="2"/>
  ${pontinhos(x + 24, y + 22)}
  <text x="${x + w / 2}" y="${y + 27}" fill="${C.apagado}" font-family="${FONTE}" font-size="15" text-anchor="middle">${esc(titulo)}</text>
  ${direita ? `<text x="${x + w - 20}" y="${y + 27}" fill="${C.apagado}" font-family="${FONTE}" font-size="14" text-anchor="end">${esc(direita)}</text>` : ''}
  <line x1="${x}" y1="${y + 42}" x2="${x + w}" y2="${y + 42}" stroke="${C.borda}" stroke-width="1"/>`

const estilo = `<style>
  .cursor { animation: cur 1s steps(1) infinite; } @keyframes cur { 50% { opacity: 0; } }
  .sobe { animation: sobe 1.2s ease-out both; transform-box: fill-box; transform-origin: bottom; } @keyframes sobe { from { transform: scaleY(0); } }
  @media (prefers-reduced-motion: reduce) { .cursor, .sobe { animation: none; } }
</style>`

async function cabecalho(u) {
  const W = 1200, H = 284
  let chips = '', cx = 300
  for (const e of ETIQUETAS) {
    const w = e.length * 10 + 28
    chips += `<rect x="${cx}" y="194" width="${w}" height="32" rx="16" fill="${C.chip}" stroke="${C.borda}"/><text x="${cx + w / 2}" y="215" fill="${C.azul}" font-family="${FONTE}" font-size="15" text-anchor="middle">${esc(e)}</text>`
    cx += w + 10
  }
  const exp = EXPERIENCIA.map(([t, d], i) => `<text x="896" y="${100 + i * 74}" fill="${C.neon}" font-family="${FONTE}" font-size="15" font-weight="700">${esc(t)}</text><text x="896" y="${126 + i * 74}" fill="${C.apagado}" font-family="${FONTE}" font-size="14">${esc(d)}</text>`).join('')
  const f = await foto(u.avatarUrl)
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(`${NOME}, ${CARGO}. Estágio full stack e freelancer.`)}">${estilo}
  <defs><clipPath id="foto"><rect x="40" y="66" width="196" height="196" rx="14"/></clipPath></defs>
  ${painel(0, 0, W, H, 'gustavo@github:~', `@${LOGIN}`)}
  <image href="${f}" xlink:href="${f}" x="40" y="66" width="196" height="196" clip-path="url(#foto)"/>
  <rect x="40" y="66" width="196" height="196" rx="14" fill="none" stroke="${C.borda}" stroke-width="2"/>
  <text x="300" y="92" fill="${C.apagado}" font-family="${FONTE}" font-size="16">@${LOGIN}</text>
  <text x="298" y="140" fill="${C.neon}" font-family="${FONTE}" font-size="44" font-weight="700">${esc(NOME)}<tspan class="cursor">_</tspan></text>
  <text x="300" y="176" fill="${C.texto}" font-family="${FONTE}" font-size="18">${esc(CARGO)}</text>
  ${chips}
  <line x1="866" y1="70" x2="866" y2="230" stroke="${C.borda}"/>
  ${exp}
</svg>`
}

function cidade(dias, total) {
  const W = 1200, H = 200
  const ativos = dias.filter((d) => d.contributionCount > 0).length
  const max = Math.max(1, ...dias.map((d) => d.contributionCount))
  const ox = 760, oy = 60, a = 6, b = 2.2
  const cores = ['#161b22', '#1f7a4a', '#2fae5f', '#4ade80', '#a7f3c0']
  const blocos = dias.map((d, k) => ({ d, i: Math.floor(k / 7), j: k % 7 })).sort((p, q) => (p.i + p.j) - (q.i + q.j))
  const sombra = (c, f) => { const v = parseInt(c.slice(1), 16); const ch = (sh) => Math.round(((v >> sh) & 255) * f); return `rgb(${ch(16)},${ch(8)},${ch(0)})` }
  let s = ''
  for (const { d, i, j } of blocos) {
    const x = ox + (i - j) * a, y = oy + (i + j) * b
    const n = d.contributionCount
    const h = n ? 5 + (n / max) * 40 : 2
    const topo = cores[n ? Math.min(4, 1 + Math.floor((n / max) * 4)) : 0]
    // Coluna isométrica com base em (x, y): face esquerda, face direita e topo.
    s += `<g${n ? ' class="sobe"' : ''}>
      <path d="M${x - a} ${y - h} L${x} ${y - h + b} L${x} ${y + b} L${x - a} ${y} Z" fill="${sombra(topo, 0.72)}"/>
      <path d="M${x} ${y - h + b} L${x + a} ${y - h} L${x + a} ${y} L${x} ${y + b} Z" fill="${sombra(topo, 0.52)}"/>
      <path d="M${x} ${y - h - b} L${x + a} ${y - h} L${x} ${y - h + b} L${x - a} ${y - h} Z" fill="${topo}"/></g>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${total} contribuições públicas nos últimos 12 meses">${estilo}
  ${painel(0, 0, W, H, 'A cidade que construí este ano', '~/contribuicoes')}
  <text x="40" y="96" fill="${C.texto}" font-family="${FONTE}" font-size="20"><tspan fill="${C.neon}" font-weight="700">${total}</tspan> contribuições públicas · ${ativos} dias ativos</text>
  <text x="40" y="132" fill="${C.apagado}" font-family="${FONTE}" font-size="15">o trabalho do estágio fica em repositórios privados</text>
  <text x="40" y="160" fill="${C.apagado}" font-family="${FONTE}" font-size="15">atualizado diariamente</text>
  ${s}
</svg>`
}

function projetos(repos) {
  const W = 1200, H = 190
  const quebra = (t, n) => { const l = ['']; for (const w of t.split(' ')) { if ((l.at(-1) + ' ' + w).trim().length > n) l.push(w); else l[l.length - 1] = (l.at(-1) + ' ' + w).trim() } return l }
  const cards = DESTAQUES.map(([nome, competencia], k) => {
    const r = repos.find((x) => x.name === nome)
    const x = 20 + k * 292, y = 58
    const linhas = quebra(competencia, 26).map((l, i) => `<text x="${x + 16}" y="${y + 56 + i * 20}" fill="${C.apagado}" font-family="${FONTE}" font-size="14">${esc(l)}</text>`).join('')
    const lang = r?.primaryLanguage ? `<circle cx="${x + 22}" cy="${y + 104}" r="5" fill="${r.primaryLanguage.color ?? C.neon}"/><text x="${x + 32}" y="${y + 109}" fill="${C.texto}" font-family="${FONTE}" font-size="13">${esc(r.primaryLanguage.name)}</text>` : ''
    return `<rect x="${x}" y="${y}" width="276" height="120" rx="10" fill="${C.chip}" stroke="${C.borda}"/>
      <text x="${x + 16}" y="${y + 30}" fill="${C.neon}" font-family="${FONTE}" font-size="16" font-weight="700">${esc(nome)}</text>${linhas}${lang}`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Projetos em destaque: ${DESTAQUES.map((d) => d[0]).join(', ')}">${estilo}
  ${painel(0, 0, W, H, 'Projetos em destaque', '~/repos')}${cards}</svg>`
}

const u = await dados()
const dias = u.contributionsCollection.contributionCalendar.weeks.flatMap((w) => w.contributionDays)
const total = u.contributionsCollection.contributionCalendar.totalContributions
await mkdir('perfil', { recursive: true })
await writeFile('perfil/cabecalho.svg', await cabecalho(u))
await writeFile('perfil/cidade.svg', cidade(dias, total))
await writeFile('perfil/projetos.svg', projetos(u.repositories.nodes))
console.log('painéis gerados:', { total })
