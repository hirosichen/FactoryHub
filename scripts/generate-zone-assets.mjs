import fs from 'fs'
import path from 'path'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const XAI_API_KEY = process.env.XAI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

const ZONES = [
  {
    name: 'yolo-zone-dumpling',
    imagePrompt: 'CCTV overhead security camera view of a Taiwanese dumpling (jiaozi/水餃) production line. 6 Taiwanese workers in blue uniforms and hairnets operating high-speed dumpling forming machines. YOLO detection green bounding boxes around each worker with labels "person 0.95", action labels "operating 0.91", "standing 0.88", "inspecting 0.93". A HUD panel showing "CAM-02 水餃產線 | 6 人 | 活動量: 高 | 溫度: 23.2°C". Stainless steel machines, flour visible, bright factory lighting. Realistic CCTV quality.',
    videoPrompt: 'CCTV security camera footage of a Taiwanese dumpling production line. High-speed dumpling forming machines running continuously. Taiwanese workers in blue uniforms monitoring the process. Green YOLO AI detection bounding boxes tracking each person with floating confidence scores and activity labels. Live person count HUD overlay. Fixed overhead wide-angle camera. Industrial lighting, stainless steel equipment, flour dust in air.',
  },
  {
    name: 'yolo-zone-mantou',
    imagePrompt: 'CCTV overhead security camera view of a Taiwanese steamed bun (饅頭) production area with large proofing chambers and steaming machines. 5 Taiwanese workers in blue uniforms. YOLO detection green bounding boxes around each person with labels "person 0.94", action labels "carrying 0.87", "operating 0.92", "walking 0.90". Steam visibly rising from the steamers. A HUD panel showing "CAM-03 饅頭產線 | 5 人 | 活動量: 中 | 溫度: 26.1°C". Warm humid atmosphere. Realistic CCTV quality.',
    videoPrompt: 'CCTV security camera footage of a Taiwanese mantou (steamed bun) production area. Large industrial steaming chambers with visible steam rising. Workers in blue uniforms loading trays of dough into proofing cabinets. Green YOLO AI detection boxes tracking each person. Steam creates atmospheric haze. Fixed overhead security camera angle. Warm lighting mixed with steam.',
  },
  {
    name: 'yolo-zone-packaging',
    imagePrompt: 'CCTV overhead security camera view of a food factory packaging area. 7 Taiwanese workers at packaging stations putting frozen products into boxes on a conveyor belt. An automated packaging machine sealing bags. YOLO detection green bounding boxes around each person with labels "person 0.96", action labels "packaging 0.93", "standing 0.89", "carrying 0.85". Cardboard boxes stacked nearby. HUD panel showing "CAM-04 包裝區 | 7 人 | 活動量: 高 | 溫度: 22.5°C". Bright clean environment. Realistic CCTV quality.',
    videoPrompt: 'CCTV security camera footage of a food factory packaging area. Workers at stations putting frozen food products into boxes on a moving conveyor belt. Automated packaging machine sealing bags. Green YOLO AI detection bounding boxes tracking each worker with activity labels. Boxes being stacked and palletized. Fixed overhead camera. Bright industrial lighting.',
  },
  {
    name: 'yolo-zone-qclab',
    imagePrompt: 'CCTV security camera view of a food quality control laboratory. 3 Taiwanese technicians in white lab coats examining food samples. One using a microscope, one weighing samples on a precision scale, one recording data on a tablet. YOLO detection bounding boxes in green around each person with labels "person 0.97", action labels "inspecting 0.94", "operating 0.91", "standing 0.88". Lab instruments, computer screens showing test results. HUD panel showing "CAM-05 品管實驗室 | 3 人 | 活動量: 低 | 溫度: 22.0°C". Clean bright lab. Realistic CCTV quality.',
    videoPrompt: 'CCTV security camera footage of a food quality control laboratory. Taiwanese technicians in white lab coats carefully examining food samples under magnifying lamps, using precision scales, and recording results. Green YOLO AI detection boxes around each person with activity labels. Clean laboratory environment with instruments and computer screens. Fixed camera angle. Bright clinical lighting.',
  },
  {
    name: 'yolo-zone-warehouse',
    imagePrompt: 'CCTV overhead security camera view of a food factory warehouse corridor. 2 Taiwanese workers walking through a wide aisle between tall metal shelving racks stacked with ingredient sacks and boxes. A forklift parked to the side. YOLO detection green bounding boxes around each person with labels "person 0.93", "walking 0.96". Yellow floor safety lines visible. HUD panel showing "CAM-06 倉儲走道 | 2 人 | 活動量: 低 | 溫度: 24.0°C". Bright LED overhead lights. Realistic CCTV quality with wide-angle.',
    videoPrompt: 'CCTV security camera footage of a food factory warehouse corridor. Two workers walking through an aisle between tall shelving racks of ingredients. A forklift slowly passing through. Green YOLO AI detection bounding boxes tracking the people as they walk. Yellow floor safety markings visible. Wide-angle overhead fixed camera. Bright warehouse LED lighting.',
  },
]

async function genImage(name, prompt) {
  console.log(`[Gemini] ${name}...`)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }) }
  )
  if (!res.ok) { console.error(`  ✗ ${res.status}`); return false }
  const data = await res.json()
  for (const part of data.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      const fp = path.join(OUTPUT_DIR, `${name}.jpg`)
      fs.writeFileSync(fp, Buffer.from(part.inlineData.data, 'base64'))
      console.log(`  ✓ ${name}.jpg (${(fs.statSync(fp).size/1024).toFixed(0)} KB)`)
      return true
    }
  }
  console.error(`  ✗ No image`); return false
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
  console.log(`=== 生成 5 個區域的 YOLO 圖片 ===\n`)
  for (const z of ZONES) {
    await genImage(z.name, z.imagePrompt)
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log(`\n=== 生成 5 支區域影片 ===\n`)
  const tasks = []
  for (const z of ZONES) {
    const t = await genVideo(z.name, z.videoPrompt)
    if (t) tasks.push(t)
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log(`\n${tasks.length} videos submitted. Polling...\n`)
  await Promise.all(tasks.map(t => pollVideo(t.name, t.request_id)))
  console.log('\nDone!')
}
main()
