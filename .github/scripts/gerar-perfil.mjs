// Gera os painéis do README (perfil/*.svg) com dados públicos do GitHub.
// Uso: GITHUB_TOKEN=... node .github/scripts/gerar-perfil.mjs  (roda todo dia pelo workflow perfil.yml)
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const LOGIN = 'Gudoourado'
const NOME = 'Gustavo Dourado'
const CARGO = 'Desenvolvedor Full Stack · foco em back-end'
const ETIQUETAS = ['TypeScript', 'NestJS', 'Angular', 'PostgreSQL']
const DESTAQUES = ['financeiro-rls', 'agente-volta-zero', 'cerebro-avaliacao', 'personal-finance-api']

const C = {
  painel: '#0d1117', borda: '#30363d', neon: '#7ee787', texto: '#e6edf3', apagado: '#8b949e', chip: '#161b22', azul: '#58a6ff',
}
const FONTE = "'JetBrains Mono', 'Cascadia Mono', Consolas, 'Courier New', monospace"
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function dados() {
  const query = `{ user(login: "${LOGIN}") {
    avatarUrl(size: 200) followers { totalCount }
    repositories(ownerAffiliations: OWNER, privacy: PUBLIC, first: 100, isFork: false) { totalCount
      nodes { name description stargazerCount primaryLanguage { name color } languages(first: 10) { edges { size node { name color } } } } }
    contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }`
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST', headers: { authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify({ query }),
  })
  const j = await r.json()
  if (!j.data?.user) throw new Error(`GraphQL: ${JSON.stringify(j.errors ?? j)}`)
  return j.data.user
}

// Avatar em pixel art: reduz a foto para 28x28 e desenha cada pixel como um quadrado.
async function avatarPixelado(url, x, y, lado) {
  const n = 28
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  const { data } = await sharp(buf).resize(n, n, { fit: 'cover' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const p = lado / n
  let s = `<g shape-rendering="crispEdges">`
  for (let i = 0; i < n * n; i++) {
    const [r, g, b] = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]]
    const q = (v) => Math.round(v / 24) * 24 // poucas cores, cara de pixel art
    s += `<rect x="${(x + (i % n) * p).toFixed(1)}" y="${(y + Math.floor(i / n) * p).toFixed(1)}" width="${(p + 0.3).toFixed(1)}" height="${(p + 0.3).toFixed(1)}" fill="rgb(${q(r)},${q(g)},${q(b)})"/>`
  }
  return s + `</g>`
}

const pontinhos = (x, y) => `<circle cx="${x}" cy="${y}" r="6" fill="#ff5f57"/><circle cx="${x + 20}" cy="${y}" r="6" fill="#febc2e"/><circle cx="${x + 40}" cy="${y}" r="6" fill="#28c840"/>`
const painel = (x, y, w, h, titulo, direita = '') => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${C.painel}" stroke="${C.borda}" stroke-width="2"/>
  ${pontinhos(x + 24, y + 22)}
  <text x="${x + w / 2}" y="${y + 27}" fill="${C.apagado}" font-family="${FONTE}" font-size="14" text-anchor="middle">${esc(titulo)}</text>
  ${direita ? `<text x="${x + w - 20}" y="${y + 27}" fill="${C.apagado}" font-family="${FONTE}" font-size="13" text-anchor="end">${esc(direita)}</text>` : ''}
  <line x1="${x}" y1="${y + 42}" x2="${x + w}" y2="${y + 42}" stroke="${C.borda}" stroke-width="1"/>`

const estilo = `<style>
  .cursor { animation: cur 1s steps(1) infinite; } @keyframes cur { 50% { opacity: 0; } }
  .sobe { animation: sobe 1.2s ease-out both; transform-box: fill-box; transform-origin: bottom; } @keyframes sobe { from { transform: scaleY(0); } }
  @media (prefers-reduced-motion: reduce) { .cursor, .sobe { animation: none; } }
</style>`


async function cabecalho(u, contribuicoes, estrelas) {
  const W = 1200, H = 284
  const px = 2, py = 2, pw = 1196, ph = 280
  const numeros = [['Repos públicos', u.repositories.totalCount], ['Estrelas', estrelas], ['Contribuições', contribuicoes], ['Seguidores', u.followers.totalCount]]
  let chips = '', cx = px + 290
  for (const e of ETIQUETAS) {
    const w = e.length * 9.6 + 26
    chips += `<rect x="${cx}" y="${py + 192}" width="${w}" height="30" rx="15" fill="${C.chip}" stroke="${C.borda}"/><text x="${cx + w / 2}" y="${py + 212}" fill="${C.azul}" font-family="${FONTE}" font-size="14" text-anchor="middle">${esc(e)}</text>`
    cx += w + 10
  }
  const stats = numeros.map(([r, v], i) => `<text x="${px + 790}" y="${py + 92 + i * 40}" fill="${C.apagado}" font-family="${FONTE}" font-size="15">${esc(r)}</text><text x="${px + 1020}" y="${py + 92 + i * 40}" fill="#cbd5e1" font-family="${FONTE}" font-size="18" font-weight="600" text-anchor="end">${v}</text>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(NOME)}, ${esc(CARGO)}">${estilo}
  ${painel(px, py, pw, ph, 'gustavo@github:~', `@${LOGIN}`)}
  <rect x="${px + 30}" y="${py + 64}" width="196" height="196" rx="10" fill="${C.chip}" stroke="${C.borda}" stroke-width="2"/>
  ${await avatarPixelado(u.avatarUrl, px + 38, py + 72, 180)}
  <text x="${px + 290}" y="${py + 82}" fill="${C.apagado}" font-family="${FONTE}" font-size="16">@${LOGIN}</text>
  <text x="${px + 288}" y="${py + 128}" fill="${C.neon}" font-family="${FONTE}" font-size="44" font-weight="700">${esc(NOME)}<tspan class="cursor">_</tspan></text>
  <text x="${px + 290}" y="${py + 164}" fill="${C.texto}" font-family="${FONTE}" font-size="17">${esc(CARGO)}</text>
  ${chips}
  <line x1="${px + 770}" y1="${py + 64}" x2="${px + 770}" y2="${py + 230}" stroke="${C.borda}"/>
  ${stats}
</svg>`
}

function cidade(dias, total) {
  const W = 1200, H = 430
  const ativos = dias.filter((d) => d.contributionCount > 0).length
  const melhor = dias.reduce((a, d) => (d.contributionCount > a.contributionCount ? d : a), dias[0])
  const max = Math.max(1, ...dias.map((d) => d.contributionCount))
  const ox = 600, oy = 120, a = 9, b = 4.6
  const cores = ['#161b22', '#1f7a4a', '#2fae5f', '#4ade80', '#a7f3c0']
  const blocos = dias.map((d, k) => ({ d, i: Math.floor(k / 7), j: k % 7 })).sort((p, q) => (p.i + p.j) - (q.i + q.j))
  let s = ''
  for (const { d, i, j } of blocos) {
    const x = ox + (i - j) * a, y = oy + (i + j) * b
    const n = d.contributionCount
    const h = n ? 8 + (n / max) * 80 : 2
    const nivel = n ? Math.min(4, 1 + Math.floor((n / max) * 4)) : 0
    const topo = cores[nivel]
    const sombra = (c, f) => { const v = parseInt(c.slice(1), 16); const ch = (sh) => Math.round(((v >> sh) & 255) * f); return `rgb(${ch(16)},${ch(8)},${ch(0)})` }
    // Coluna isométrica com base em (x, y): face esquerda, face direita e topo.
    s += `<g${n ? ' class="sobe"' : ''}>
      <path d="M${x - a} ${y - h} L${x} ${y - h + b} L${x} ${y + b} L${x - a} ${y} Z" fill="${sombra(topo, 0.72)}"/>
      <path d="M${x} ${y - h + b} L${x + a} ${y - h} L${x + a} ${y} L${x} ${y + b} Z" fill="${sombra(topo, 0.52)}"/>
      <path d="M${x} ${y - h - b} L${x + a} ${y - h} L${x} ${y - h + b} L${x - a} ${y - h} Z" fill="${topo}"/></g>`
  }
  const data = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${total} contribuições públicas nos últimos 12 meses">${estilo}
  ${painel(0, 0, W, H, 'A cidade que construí este ano', '~/contribuicoes')}
  <text x="40" y="110" fill="${C.apagado}" font-family="${FONTE}" font-size="15">CONTRIBUIÇÕES PÚBLICAS</text>
  <text x="40" y="168" fill="${C.neon}" font-family="${FONTE}" font-size="58" font-weight="700">${total}</text>
  <text x="40" y="214" fill="${C.texto}" font-family="${FONTE}" font-size="16">${ativos} dias ativos</text>
  <text x="40" y="244" fill="${C.texto}" font-family="${FONTE}" font-size="16">melhor dia: ${melhor.contributionCount} em ${data(melhor.date)}</text>
  <text x="40" y="390" fill="${C.apagado}" font-family="${FONTE}" font-size="13">só contribuições públicas; o trabalho profissional fica em repositórios privados · atualizado diariamente</text>
  ${s}
</svg>`
}

function linguagens(repos) {
  const soma = new Map()
  for (const r of repos) for (const e of r.languages.edges) soma.set(e.node.name, { b: (soma.get(e.node.name)?.b ?? 0) + e.size, cor: e.node.color ?? C.neon })
  const total = [...soma.values()].reduce((a, v) => a + v.b, 0) || 1
  const top = [...soma.entries()].sort((p, q) => q[1].b - p[1].b).slice(0, 6)
  const W = 590, H = 340
  const linhas = top.map(([n, v], i) => {
    const pct = (v.b / total) * 100, y = 82 + i * 38
    return `<circle cx="34" cy="${y - 5}" r="6" fill="${v.cor}"/><text x="50" y="${y}" fill="${C.texto}" font-family="${FONTE}" font-size="15">${esc(n)}</text>
      <rect x="200" y="${y - 13}" width="300" height="12" rx="6" fill="${C.chip}"/><rect class="sobe" x="200" y="${y - 13}" width="${Math.max(6, pct * 3)}" height="12" rx="6" fill="${C.neon}"/>
      <text x="${W - 26}" y="${y}" fill="${C.apagado}" font-family="${FONTE}" font-size="14" text-anchor="end">${pct.toFixed(0)}%</text>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Linguagens nos repositórios públicos">${estilo}
  ${painel(0, 0, W, H, 'Linguagens nos repositórios públicos')}${linhas}<text x="30" y="318" fill="${C.apagado}" font-family="${FONTE}" font-size="12">distribuição do código publicado, não da experiência profissional</text></svg>`
}

function projetos(repos) {
  const W = 590, H = 340
  const lista = DESTAQUES.map((n) => repos.find((r) => r.name === n)).filter(Boolean)
  const quebra = (t, n) => { const p = String(t ?? '').split(' '); const l = ['']; for (const w of p) { if ((l.at(-1) + ' ' + w).trim().length > n) l.push(w); else l[l.length - 1] = (l.at(-1) + ' ' + w).trim() } return l.length > 2 ? [l[0], l[1].replace(/[,.;:]?$/, '…')] : l }
  const cards = lista.map((r, k) => {
    const x = 18 + (k % 2) * 282, y = 58 + Math.floor(k / 2) * 128
    const desc = quebra(r.description, 30).map((l, i) => `<text x="${x + 16}" y="${y + 52 + i * 18}" fill="${C.apagado}" font-family="${FONTE}" font-size="12">${esc(l)}</text>`).join('')
    const lang = r.primaryLanguage ? `<circle cx="${x + 22}" cy="${y + 98}" r="5" fill="${r.primaryLanguage.color ?? C.neon}"/><text x="${x + 32}" y="${y + 102}" fill="${C.texto}" font-family="${FONTE}" font-size="12">${esc(r.primaryLanguage.name)}</text>` : ''
    return `<rect x="${x}" y="${y}" width="270" height="116" rx="10" fill="${C.chip}" stroke="${C.borda}"/>
      <text x="${x + 16}" y="${y + 28}" fill="${C.neon}" font-family="${FONTE}" font-size="15" font-weight="700">${esc(r.name)}</text>${desc}${lang}
      <text x="${x + 254}" y="${y + 102}" fill="${C.apagado}" font-family="${FONTE}" font-size="12" text-anchor="end">★ ${r.stargazerCount}</text>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Projetos em destaque">${estilo}
  ${painel(0, 0, W, H, 'Projetos em destaque', '~/repos')}${cards}</svg>`
}

const u = await dados()
const repos = u.repositories.nodes
const dias = u.contributionsCollection.contributionCalendar.weeks.flatMap((w) => w.contributionDays)
const total = u.contributionsCollection.contributionCalendar.totalContributions
const estrelas = repos.reduce((a, r) => a + r.stargazerCount, 0)
await mkdir('perfil', { recursive: true })
await writeFile('perfil/cabecalho.svg', await cabecalho(u, total, estrelas))
await writeFile('perfil/cidade.svg', cidade(dias, total))
await writeFile('perfil/linguagens.svg', linguagens(repos))
await writeFile('perfil/projetos.svg', projetos(repos))
console.log('painéis gerados:', { total, estrelas, repos: repos.length })
