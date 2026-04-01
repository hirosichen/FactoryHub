import fs from 'fs'
import path from 'path'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const XAI_API_KEY = process.env.XAI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

// --- Gemini Image Generation ---
const IMAGE_PROMPTS = [
  {
    name: 'yolo-factory-floor',
    prompt: 'CCTV security camera overhead view of a food factory production floor. 8-10 workers in blue uniforms working at different stations. YOLO object detection bounding boxes drawn around each person in bright green rectangles with labels: "person 0.96", "person 0.94", "person 0.91". Some boxes also labeled with action detection: "standing 0.88", "bending 0.85", "walking 0.92". A semi-transparent HUD overlay in the top-right corner showing "Detected: 9 persons | Avg Activity: Medium | Zone Temp: 24.2°C". Realistic CCTV quality with slight wide-angle distortion. Timestamp "CAM-01 AI-DETECT 2026/03/30 14:32:18" in top-left.',
  },
  {
    name: 'yolo-clothing-detect',
    prompt: 'Security camera view of a food factory corridor. 5 workers walking, each with a YOLO-style bounding box. Colored boxes with detailed labels showing clothing detection: green box "Worker #1: Light uniform, short sleeve 0.94", yellow box "Worker #2: Heavy jacket, long sleeve 0.91", green box "Worker #3: Light uniform, short sleeve 0.89". A panel overlay on the right side showing "AI Clothing Analysis: 3 Light / 2 Heavy | Suggested Temp: 23°C → 22°C | Comfort Index: 78%". Professional CCTV footage quality. Clean modern factory interior with LED lighting.',
  },
  {
    name: 'yolo-hvac-dashboard',
    prompt: 'A split-screen monitoring dashboard. Left side: CCTV camera view of a food factory production area with YOLO detection boxes around 6 workers, showing person count and activity levels. Right side: A clean modern HVAC control dashboard showing zone temperature map, with arrows indicating "AI Auto-Adjust" - temperature being lowered from 25°C to 23°C, fan speed increasing from 60% to 75%. A green banner at top reading "AI 環境調控 - 根據現場人數與活動量自動調整". Dark background with colorful data visualizations. Professional control room monitoring software aesthetic.',
  },
]

async function generateImage(promptObj) {
  console.log(`[Gemini] Generating: ${promptObj.name}...`)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptObj.prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    console.error(`  ✗ ${res.status} ${err.slice(0, 200)}`)
    return null
  }
  const data = await res.json()
  for (const part of data.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      const ext = part.inlineData.mimeType === 'image/png' ? 'png' : 'jpg'
      const filePath = path.join(OUTPUT_DIR, `${promptObj.name}.${ext}`)
      const buffer = Buffer.from(part.inlineData.data, 'base64')
      fs.writeFileSync(filePath, buffer)
      console.log(`  ✓ ${filePath} (${(buffer.length / 1024).toFixed(0)} KB)`)
      return filePath
    }
  }
  console.error(`  ✗ No image in response`)
  return null
}

// --- xAI Video Generation ---
const VIDEO_PROMPTS = [
  {
    name: 'yolo-detect-video',
    prompt: 'CCTV security camera footage of a modern food factory floor. Workers in blue uniforms moving around conveyor belts and workstations. Real-time YOLO AI detection bounding boxes appear around each person as bright green rectangles with confidence scores like "person 0.95" and activity labels like "walking", "standing", "operating machine". A heads-up display overlay in the corner shows live person count updating. The camera is a fixed overhead wide-angle view. Industrial lighting, stainless steel equipment. Professional security monitoring system aesthetic with data overlays.',
  },
]

async function generateVideo(promptObj) {
  console.log(`[xAI] Generating video: ${promptObj.name}...`)
  const createRes = await fetch('https://api.x.ai/v1/videos/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-imagine-video',
      prompt: promptObj.prompt,
      duration: 10,
      aspect_ratio: '16:9',
      resolution: '720p',
    }),
  })
  if (!createRes.ok) {
    const err = await createRes.text()
    console.error(`  ✗ Create failed: ${createRes.status} ${err.slice(0, 300)}`)
    return null
  }
  const { request_id } = await createRes.json()
  console.log(`  Request ID: ${request_id}`)

  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000))
    process.stdout.write(`  Polling (${(i + 1) * 5}s)...`)
    const pollRes = await fetch(`https://api.x.ai/v1/videos/${request_id}`, {
      headers: { 'Authorization': `Bearer ${XAI_API_KEY}` },
    })
    if (!pollRes.ok) { console.log(` HTTP ${pollRes.status}`); continue }
    const pollData = await pollRes.json()
    console.log(` ${pollData.status}`)
    if (pollData.status === 'done') {
      const videoUrl = pollData.video?.url
      if (!videoUrl) { console.log('  ✗ No URL'); return null }
      const videoRes = await fetch(videoUrl)
      const buffer = Buffer.from(await videoRes.arrayBuffer())
      const filePath = path.join(OUTPUT_DIR, `${promptObj.name}.mp4`)
      fs.writeFileSync(filePath, buffer)
      console.log(`  ✓ ${filePath} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`)
      return filePath
    }
    if (pollData.status === 'failed' || pollData.status === 'expired') {
      console.error(`  ✗ ${pollData.status}`)
      return null
    }
  }
  console.error(`  ✗ Timed out`)
  return null
}

async function main() {
  console.log(`Output: ${OUTPUT_DIR}\n`)

  // Generate images first
  for (const p of IMAGE_PROMPTS) {
    await generateImage(p)
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('')

  // Generate video
  for (const p of VIDEO_PROMPTS) {
    await generateVideo(p)
  }

  console.log('\nDone!')
}

main()
