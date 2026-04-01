import fs from 'fs'
import path from 'path'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const XAI_API_KEY = process.env.XAI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

// --- Gemini Images ---
const IMAGES = [
  {
    name: 'yolo-thermal',
    prompt: 'CCTV camera view of a Taiwanese food factory floor with AI thermal imaging overlay. 6-8 workers visible, each surrounded by a colored heat signature — red/orange around their bodies overlaid on the normal camera image. YOLO bounding boxes around each person with labels showing body temperature: "36.2°C", "36.5°C", "37.1°C ⚠️". A semi-transparent HUD panel in the corner showing "AI Thermal Scan | Avg Body Temp: 36.4°C | HVAC Response: Cooling +2%" with a small thermal color scale bar from blue (cold) to red (hot). Realistic CCTV quality with thermal overlay graphics.',
  },
  {
    name: 'yolo-ppe-detect',
    prompt: 'Security camera view of a Taiwanese food factory entrance area. 5 Taiwanese workers walking through a checkpoint. YOLO AI detection bounding boxes around each person with detailed PPE (Personal Protective Equipment) detection labels: green checkmarks and red X marks — "✓ 髮帽 Hairnet", "✓ 口罩 Mask", "✗ 手套 Gloves MISSING", "✓ 制服 Uniform". One worker highlighted with a yellow warning box because they are missing gloves. A HUD panel showing "AI PPE 偵測 | 合規率: 80% | 違規: 1 人 (手套)" with red alert indicator. Clean modern factory corridor with bright lighting.',
  },
  {
    name: 'yolo-zone-heatmap',
    prompt: 'Top-down overhead camera view of a food factory floor plan with AI occupancy heatmap overlay. The factory floor is divided into zones with color-coded heat map — deep red for crowded areas (production lines), yellow for moderate areas (walkways), green/blue for empty areas (storage). Zone labels visible: "包子區 12人 HIGH", "水餃區 8人 MED", "走道 2人 LOW". Small person dots visible moving around. A legend showing "AI 人流熱力圖 | Peak: 包子產線 | Suggested: 分散至水餃區". Professional monitoring system graphics on dark background.',
  },
  {
    name: 'yolo-airflow',
    prompt: 'Split-screen visualization. Left: Normal CCTV camera view of a Taiwanese food factory floor with workers. Right: Same view but with AI computational fluid dynamics (CFD) airflow visualization overlay — blue and cyan streamlines showing air conditioning flow patterns from ceiling vents, with red zones highlighting "dead spots" where airflow does not reach. Arrows showing air current direction and speed. Labels: "出風口 A: 3.2 m/s", "死角區域" with red warning. A panel showing "AI 空氣流場分析 | 覆蓋率: 78% | 建議: 調整出風口 B 角度 15°". Technical monitoring aesthetic.',
  },
]

// --- xAI Videos ---
const VIDEOS = [
  {
    name: 'yolo-thermal-video',
    prompt: 'CCTV security camera footage of a Taiwanese food factory with AI thermal imaging overlay. Workers in blue uniforms moving around workstations, each surrounded by glowing red-orange thermal heat signatures overlaid on the normal video. Temperature readings floating next to each person. A real-time thermal color scale visible in the corner. Workers moving naturally — the thermal overlay tracks them smoothly. Industrial factory setting with overhead lighting. Professional AI monitoring system look with live data graphics.',
  },
  {
    name: 'yolo-ppe-video',
    prompt: 'CCTV security camera footage of Taiwanese food factory workers walking through an entrance checkpoint. AI detection bounding boxes appear around each person scanning for PPE equipment — green checkmark labels appear for "hairnet", "mask", "uniform", while one worker gets a flashing red "MISSING: gloves" alert box. The detection happens in real-time as workers walk past the camera. Fixed security camera angle, factory corridor with bright lighting. Professional AI safety monitoring system aesthetic.',
  },
  {
    name: 'yolo-hvac-hero-video',
    prompt: 'Cinematic footage of a Taiwanese food factory with futuristic AI YOLO detection overlay. Multiple workers being tracked with green bounding boxes, activity labels floating above each person. Semi-transparent holographic HUD elements showing temperature gauges, fan speed indicators, and comfort index meters adjusting in real-time. The data overlay pulses and updates dynamically. Blue digital grid lines subtly visible on the floor. Premium sci-fi AI monitoring aesthetic mixed with real factory footage. Apple-style tech commercial feel — controlled, elegant, futuristic.',
  },
]

async function genImage(p) {
  console.log(`[Gemini] ${p.name}...`)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: p.prompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }) }
  )
  if (!res.ok) { console.error(`  ✗ ${res.status}`); return }
  const data = await res.json()
  for (const part of data.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      const fp = path.join(OUTPUT_DIR, `${p.name}.jpg`)
      fs.writeFileSync(fp, Buffer.from(part.inlineData.data, 'base64'))
      console.log(`  ✓ ${p.name}.jpg (${(fs.statSync(fp).size/1024).toFixed(0)} KB)`)
      return
    }
  }
  console.error(`  ✗ No image`)
}

async function genVideo(p) {
  console.log(`[xAI] ${p.name}...`)
  const r = await fetch('https://api.x.ai/v1/videos/generations', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${XAI_API_KEY}` },
    body: JSON.stringify({ model: 'grok-imagine-video', prompt: p.prompt, duration: 10, aspect_ratio: '16:9', resolution: '720p' }),
  })
  if (!r.ok) { console.error(`  ✗ ${r.status} ${(await r.text()).slice(0, 150)}`); return null }
  const { request_id } = await r.json()
  console.log(`  ID: ${request_id}`)
  return { name: p.name, request_id }
}

async function pollVideo(name, rid) {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const pr = await fetch(`https://api.x.ai/v1/videos/${rid}`, { headers: { 'Authorization': `Bearer ${XAI_API_KEY}` } })
    if (!pr.ok) continue
    const d = await pr.json()
    if (d.status === 'done') {
      const buf = Buffer.from(await (await fetch(d.video.url)).arrayBuffer())
      const fp = path.join(OUTPUT_DIR, `${name}.mp4`)
      fs.writeFileSync(fp, buf)
      console.log(`  ✓ ${name}.mp4 (${(buf.length/1024/1024).toFixed(1)} MB)`)
      return fp
    }
    if (d.status === 'failed' || d.status === 'expired') { console.error(`  ✗ ${name}: ${d.status}`); return null }
  }
  return null
}

async function main() {
  // Images first
  for (const p of IMAGES) { await genImage(p); await new Promise(r => setTimeout(r, 2000)) }

  console.log('')

  // Videos with stagger
  const tasks = []
  for (const v of VIDEOS) {
    const t = await genVideo(v)
    if (t) tasks.push(t)
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log(`\n${tasks.length} videos submitted. Polling...\n`)
  await Promise.all(tasks.map(t => pollVideo(t.name, t.request_id)))
  console.log('\nDone!')
}
main()
