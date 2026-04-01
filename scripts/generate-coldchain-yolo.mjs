import fs from 'fs'
import path from 'path'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const XAI_API_KEY = process.env.XAI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

const IMAGES = [
  {
    name: 'yolo-coldchain-door',
    prompt: 'CCTV overhead security camera view of a large industrial freezer door entrance in a food factory. The heavy insulated freezer door is partially OPEN with cold mist spilling out. YOLO AI detection: a green bounding box around the door labeled "door: OPEN ⚠️ 0.98", a red warning zone overlay near the door. Two Taiwanese workers in cold-weather gear near the entrance with green bounding boxes "person 0.95", "person entering 0.93". A HUD panel showing "CAM-07 冷凍庫門 | 狀態: 開啟 ⚠️ | 開啟時間: 45秒 | 冷量流失: 高". Frost on metal surfaces, bright LED lighting. Realistic CCTV quality.',
  },
  {
    name: 'yolo-coldchain-layout',
    prompt: 'Top-down bird-eye view of an industrial cold storage warehouse interior from a ceiling-mounted camera. Rows of metal pallet racks with frozen food boxes. YOLO AI detection showing: green bounding boxes around 3 workers with labels "person 0.94", a yellow zone highlight around a misaligned pallet labeled "排列異常 ⚠️ 0.91", and blue zone boundaries showing proper storage areas labeled "A區 正常", "B區 正常", "C區 異常". A HUD panel: "AI 排列分析 | 合規率: 85% | 異常: C區棧板偏移 15cm". Wide-angle overhead CCTV perspective. Cold warehouse with blue-tinted LED lighting.',
  },
  {
    name: 'yolo-coldchain-entry',
    prompt: 'CCTV security camera view of a cold storage entry checkpoint area. A Taiwanese worker in thermal jacket scanning an access card at a turnstile gate before entering the freezer. YOLO AI detection: green bounding box around the person "Worker #12 進入 0.96", a green checkmark for PPE detection "✓ 防寒衣 ✓ 手套 ✓ 安全帽". A digital display showing current freezer temperature. A HUD panel: "CAM-08 進出管制 | 今日進出: 47次 | 平均停留: 8分鐘 | 當前庫內: 2人". Clean industrial environment. Realistic CCTV quality.',
  },
]

const VIDEOS = [
  {
    name: 'yolo-coldchain-door-video',
    prompt: 'CCTV security camera footage of an industrial freezer door in a food factory. The large insulated door slowly opens, releasing dramatic cold mist into the corridor. A worker in thermal gear walks through pushing a pallet jack loaded with frozen food boxes. AI detection green bounding boxes track the worker and the door status. Cold mist swirling around. The door then slowly closes. Fixed overhead security camera angle. Blue-tinted industrial cold storage lighting.',
  },
  {
    name: 'yolo-coldchain-inside-video',
    prompt: 'CCTV security camera overhead footage inside a large industrial freezer warehouse at -25 degrees. A forklift slowly driving between tall pallet rack aisles. Frost visible on metal shelves. Two workers in thermal jackets checking inventory on shelves. AI green bounding boxes tracking the forklift and workers. Cold mist in the air creating atmospheric depth. Blue LED lighting. Fixed overhead wide-angle security camera. Realistic cold storage footage.',
  },
]

async function genImage(name, prompt) {
  console.log(`[Gemini] ${name}...`)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }) }
  )
  if (!res.ok) { console.error(`  ✗ ${res.status}`); return }
  for (const part of (await res.json()).candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      const fp = path.join(OUTPUT_DIR, `${name}.jpg`)
      fs.writeFileSync(fp, Buffer.from(part.inlineData.data, 'base64'))
      console.log(`  ✓ ${name}.jpg (${(fs.statSync(fp).size/1024).toFixed(0)} KB)`)
      return
    }
  }
  console.error(`  ✗ No image`)
}

async function genVideo(name, prompt) {
  console.log(`[xAI] ${name}...`)
  const r = await fetch('https://api.x.ai/v1/videos/generations', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${XAI_API_KEY}` },
    body: JSON.stringify({ model: 'grok-imagine-video', prompt, duration: 10, aspect_ratio: '16:9', resolution: '720p' }),
  })
  if (!r.ok) { console.error(`  ✗ ${r.status} ${(await r.text()).slice(0, 150)}`); return null }
  const { request_id } = await r.json()
  console.log(`  ID: ${request_id}`)
  return { name, request_id }
}

async function pollVideo(name, rid) {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const pr = await fetch(`https://api.x.ai/v1/videos/${rid}`, { headers: { 'Authorization': `Bearer ${XAI_API_KEY}` } })
    if (!pr.ok) continue
    const d = await pr.json()
    if (d.status === 'done') {
      const buf = Buffer.from(await (await fetch(d.video.url)).arrayBuffer())
      fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.mp4`), buf)
      console.log(`  ✓ ${name}.mp4 (${(buf.length/1024/1024).toFixed(1)} MB)`)
      return true
    }
    if (d.status === 'failed' || d.status === 'expired') { console.error(`  ✗ ${name}: ${d.status}`); return false }
  }
  return false
}

async function main() {
  for (const p of IMAGES) { await genImage(p.name, p.prompt); await new Promise(r => setTimeout(r, 2000)) }
  console.log('')
  const tasks = []
  for (const v of VIDEOS) { const t = await genVideo(v.name, v.prompt); if (t) tasks.push(t); await new Promise(r => setTimeout(r, 1500)) }
  console.log(`\n${tasks.length} videos polling...\n`)
  await Promise.all(tasks.map(t => pollVideo(t.name, t.request_id)))
  console.log('\nDone!')
}
main()
