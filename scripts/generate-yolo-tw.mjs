import fs from 'fs'
import path from 'path'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const XAI_API_KEY = process.env.XAI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

const IMAGE_PROMPTS = [
  {
    name: 'yolo-factory-floor',
    prompt: 'CCTV overhead security camera view of a Taiwanese food factory production floor. 8-10 Taiwanese workers (East Asian, black hair) in blue factory uniforms with hairnets working at stainless steel conveyor belt stations producing steamed buns (baozi). YOLO object detection bounding boxes drawn around each person in bright green rectangles with labels: "person 0.96", "person 0.94". Action detection labels below each box: "standing 0.88", "bending 0.85", "walking 0.92", "operating 0.90". A semi-transparent HUD overlay panel in the top-right corner showing "Detected: 9 persons | Avg Activity: Medium | Zone Temp: 24.2°C". Realistic CCTV quality with wide-angle lens. Timestamp "CAM-01 AI-DETECT 2026/03/30 14:32:18" in top-left corner. Modern clean HACCP-certified factory interior with bright LED overhead lights.',
  },
  {
    name: 'yolo-clothing-detect',
    prompt: 'Security camera view of a Taiwanese food factory corridor. 5 Taiwanese workers (East Asian, black hair) walking towards the camera. Each person has a YOLO-style colored bounding box. Detailed clothing detection labels: green box around person "Worker #1: 薄制服 Light uniform 0.94", yellow box "Worker #2: 厚外套 Heavy jacket 0.91", green box "Worker #3: 薄制服 Light uniform 0.89". A HUD info panel on the right side showing "AI 衣著分析: 薄衣 3 / 厚衣 2 | 建議溫度: 23°C → 22°C | 舒適指數: 78%". Clean modern Taiwanese food factory interior with stainless steel walls, bright fluorescent lighting. Professional CCTV footage quality.',
  },
  {
    name: 'yolo-hvac-dashboard',
    prompt: 'A professional split-screen factory monitoring dashboard. Left half: CCTV camera view of a Taiwanese food factory production area with 6 Taiwanese workers (East Asian, black hair, blue uniforms) each surrounded by green YOLO detection bounding boxes showing person count and activity recognition labels. Right half: A modern HVAC control dashboard with a zone temperature heat map in red-blue colors, with animated arrows showing "AI Auto-Adjust" — temperature dropping from 25°C to 23°C, fan speed gauge increasing from 60% to 75%. A Chinese banner at top: "AI 環境調控 — 根據現場人數與活動量自動調整". Dark background, colorful data visualizations, professional industrial monitoring software look.',
  },
]

const VIDEO_PROMPTS = [
  {
    name: 'yolo-detect-video',
    prompt: 'CCTV security camera footage of a modern Taiwanese food factory floor. Taiwanese workers in blue factory uniforms and hairnets moving around stainless steel conveyor belts producing steamed buns. Real-time YOLO AI object detection: bright green bounding boxes track each person with floating labels showing "person 0.95" and activity text "walking", "standing", "operating machine". A translucent heads-up display counter in the corner updates the live person count. Fixed overhead wide-angle camera angle. Bright industrial LED lighting, spotless factory floor, stainless steel equipment. Professional AI-powered security monitoring system look with data overlay graphics.',
  },
]

async function generateImage(p) {
  console.log(`[Gemini] ${p.name}...`)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: p.prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    }
  )
  if (!res.ok) { console.error(`  ✗ ${res.status} ${(await res.text()).slice(0, 150)}`); return }
  const data = await res.json()
  for (const part of data.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      const ext = part.inlineData.mimeType === 'image/png' ? 'png' : 'jpg'
      const fp = path.join(OUTPUT_DIR, `${p.name}.${ext}`)
      const buf = Buffer.from(part.inlineData.data, 'base64')
      fs.writeFileSync(fp, buf)
      console.log(`  ✓ ${fp} (${(buf.length / 1024).toFixed(0)} KB)`)
      return
    }
  }
  console.error(`  ✗ No image`)
}

async function generateVideo(p) {
  console.log(`[xAI] ${p.name}...`)
  const r = await fetch('https://api.x.ai/v1/videos/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${XAI_API_KEY}` },
    body: JSON.stringify({ model: 'grok-imagine-video', prompt: p.prompt, duration: 10, aspect_ratio: '16:9', resolution: '720p' }),
  })
  if (!r.ok) { console.error(`  ✗ ${r.status} ${(await r.text()).slice(0, 200)}`); return }
  const { request_id } = await r.json()
  console.log(`  ID: ${request_id}`)
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000))
    process.stdout.write(`  ${(i+1)*5}s...`)
    const pr = await fetch(`https://api.x.ai/v1/videos/${request_id}`, { headers: { 'Authorization': `Bearer ${XAI_API_KEY}` } })
    if (!pr.ok) { console.log(` ${pr.status}`); continue }
    const d = await pr.json()
    console.log(` ${d.status}`)
    if (d.status === 'done') {
      const buf = Buffer.from(await (await fetch(d.video.url)).arrayBuffer())
      const fp = path.join(OUTPUT_DIR, `${p.name}.mp4`)
      fs.writeFileSync(fp, buf)
      console.log(`  ✓ ${fp} (${(buf.length/1024/1024).toFixed(1)} MB)`)
      return
    }
    if (d.status === 'failed' || d.status === 'expired') { console.error(`  ✗ ${d.status}`); return }
  }
}

async function main() {
  console.log(`Output: ${OUTPUT_DIR}\n`)
  for (const p of IMAGE_PROMPTS) { await generateImage(p); await new Promise(r => setTimeout(r, 2000)) }
  console.log('')
  for (const p of VIDEO_PROMPTS) { await generateVideo(p) }
  console.log('\nDone!')
}
main()
