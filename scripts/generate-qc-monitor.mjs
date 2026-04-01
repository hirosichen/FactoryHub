import fs from 'fs'
import path from 'path'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const XAI_API_KEY = process.env.XAI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

const LINES = [
  {
    name: 'qc-baozi',
    imagePrompt: 'Professional photograph of food quality inspection of steamed buns (baozi) in a factory QC lab. A technician in white coat and gloves examining freshly steamed buns under bright inspection light. Digital weighing scale showing weight reading. X-ray metal detection machine in the background with green pass indicator light. AI vision camera above the conveyor scanning bun surface quality. Stainless steel lab bench with HACCP checklist clipboard. Clean, bright clinical environment. Industrial food safety photography, 16:9.',
    videoPrompt: 'CCTV footage of a food quality control inspection station for steamed buns. Buns moving on a small conveyor belt passing through an X-ray metal detector. A QC technician in white coat picking up buns, weighing them on a digital scale, and examining them under bright light. AI vision camera with green scanning overlay. Timestamp "QC-CAM-L1 包子品檢 2026/03/31 10:22:05" in top-left. Bright laboratory lighting. Realistic security camera footage.',
  },
  {
    name: 'qc-dumpling',
    imagePrompt: 'Professional photograph of food quality inspection of frozen dumplings (jiaozi) in a factory QC lab. A quality inspector in white coat examining dumplings on a stainless steel tray, checking wrapper seal integrity. A high-precision digital scale, and an AI-powered vision inspection camera mounted above. X-ray conveyor scanner with monitor showing internal scan. Temperature probe inserted in a dumpling showing -18°C. Clean laboratory environment. Industrial food inspection photography, 16:9.',
    videoPrompt: 'CCTV footage of a quality control station for frozen dumplings. Dumplings on a small conveyor passing through an AI vision inspection system with colored overlay boxes. Inspector in white coat checking seal integrity and placing samples on digital scale. X-ray monitor showing internal scans. Timestamp "QC-CAM-L2 水餃品檢 2026/03/31 10:22:05" in top-left. Clinical bright lighting. Realistic security camera footage quality.',
  },
  {
    name: 'qc-mantou',
    imagePrompt: 'Professional photograph of food quality inspection of steamed bread mantou in a factory QC lab. Brown sugar mantou and taro mantou on inspection tray. A technician using a digital caliper measuring diameter, another mantou on a precision scale. AI computer vision screen showing surface defect detection with green bounding boxes. Microbiological sampling swab kit on the side. Clean stainless steel workstation with QC records. Bright inspection lighting. Industrial food photography, 16:9.',
    videoPrompt: 'CCTV footage of quality control inspection station for mantou steamed bread. Brown and white mantou pieces being inspected on a stainless steel table. Inspector measuring with caliper and weighing on digital scale. AI vision monitor showing defect detection overlay on mantou surface. Timestamp "QC-CAM-L3 饅頭品檢 2026/03/31 10:22:05" in top-left. Bright laboratory lighting. Realistic security camera footage.',
  },
  {
    name: 'qc-prepared',
    imagePrompt: 'Professional photograph of food quality inspection of scallion pancakes (蔥抓餅) and egg crepe wrappers in a factory QC lab. Flat golden pancakes laid out on inspection tray under bright light. Inspector checking thickness uniformity with a micrometer. AI vision system overhead with screen showing dimensional analysis. Metal detector conveyor with green indicator. Core temperature probe showing reading. Clean clinical QC environment. Industrial food photography, 16:9.',
    videoPrompt: 'CCTV footage of quality control station for prepared foods - scallion pancakes and egg crepes. Flat round pancakes on inspection table being measured by inspector in white coat. AI vision screen showing dimensional overlay analysis. Pancakes passing through metal detector conveyor with green pass light. Timestamp "QC-CAM-L4 調理品檢 2026/03/31 10:22:05" in top-left. Bright clinical lighting. Realistic security camera footage quality.',
  },
]

async function generateImage(line) {
  console.log(`🖼  Generating image: ${line.name}...`)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: line.imagePrompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    }
  )
  if (!res.ok) {
    console.error(`  ✗ ${line.name}: ${res.status} ${(await res.text()).slice(0, 200)}`)
    return null
  }
  const data = await res.json()
  for (const part of (data.candidates?.[0]?.content?.parts ?? [])) {
    if (part.inlineData) {
      const ext = part.inlineData.mimeType === 'image/png' ? 'png' : 'jpg'
      const filePath = path.join(OUTPUT_DIR, `${line.name}.${ext}`)
      const buffer = Buffer.from(part.inlineData.data, 'base64')
      fs.writeFileSync(filePath, buffer)
      console.log(`  ✓ ${line.name}.${ext} (${(buffer.length / 1024).toFixed(0)} KB)`)
      return filePath
    }
  }
  console.error(`  ✗ ${line.name}: No image in response`)
  return null
}

async function generateVideo(line) {
  console.log(`🎬 Generating video: ${line.name}...`)
  const createRes = await fetch('https://api.x.ai/v1/videos/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-imagine-video',
      prompt: line.videoPrompt,
      duration: 10,
      aspect_ratio: '16:9',
      resolution: '720p',
    }),
  })
  if (!createRes.ok) {
    console.error(`  ✗ Create failed: ${createRes.status} ${(await createRes.text()).slice(0, 300)}`)
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
      if (!videoUrl) { console.log('  ✗ No video URL'); return null }
      const buffer = Buffer.from(await (await fetch(videoUrl)).arrayBuffer())
      const filePath = path.join(OUTPUT_DIR, `${line.name}.mp4`)
      fs.writeFileSync(filePath, buffer)
      console.log(`  ✓ ${line.name}.mp4 (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`)
      return filePath
    }
    if (pollData.status === 'failed' || pollData.status === 'expired') {
      console.error(`  ✗ ${pollData.status}`); return null
    }
  }
  console.error(`  ✗ Timed out`); return null
}

async function main() {
  console.log(`Output: ${OUTPUT_DIR}\n`)
  console.log('=== Phase 1: Images (Gemini) ===\n')
  for (const line of LINES) {
    await generateImage(line)
    await new Promise(r => setTimeout(r, 2000))
  }
  console.log('\n=== Phase 2: Videos (xAI) ===\n')
  for (const line of LINES) {
    await generateVideo(line)
    console.log('')
  }
  console.log('=== Done ===')
}

main()
