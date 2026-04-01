import fs from 'fs'
import path from 'path'

const XAI_API_KEY = process.env.XAI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

const VIDEO_PROMPTS = [
  {
    name: 'cctv-production-line',
    prompt: 'CCTV security camera footage of an automated food factory production line. Steamed buns (baozi) moving smoothly on a stainless steel conveyor belt. Workers in blue uniforms and hairnets monitoring the machinery. Overhead wide-angle security camera perspective. Timestamp text "CAM-01 PRODUCTION 2026/03/30 14:32:15" overlaid in top-left. Industrial fluorescent lighting, clean factory floor. Realistic security camera footage quality.',
  },
  {
    name: 'cctv-cold-storage',
    prompt: 'CCTV security camera footage of an industrial cold storage freezer warehouse. A forklift slowly driving down an aisle between tall shelving racks stacked with frozen food boxes. Cold mist and frost visible. Blue-tinted LED overhead lighting. Timestamp "CAM-03 FREEZER-A -25C 2026/03/30 14:32" in corner. Static overhead wide-angle camera. Realistic grainy security camera footage quality.',
  },
]

async function generateVideo(promptObj) {
  console.log(`Generating video: ${promptObj.name}...`)

  // Step 1: Start generation request
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

  const createData = await createRes.json()
  const requestId = createData.request_id
  console.log(`  Request ID: ${requestId}`)

  // Step 2: Poll for completion at /v1/videos/{request_id}
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const elapsed = (i + 1) * 5
    process.stdout.write(`  Polling (${elapsed}s)...`)

    const pollRes = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      headers: { 'Authorization': `Bearer ${XAI_API_KEY}` },
    })

    if (!pollRes.ok) {
      console.log(` HTTP ${pollRes.status}`)
      continue
    }

    const pollData = await pollRes.json()
    const status = pollData.status
    console.log(` ${status}`)

    if (status === 'done') {
      const videoUrl = pollData.video?.url
      if (!videoUrl) {
        console.log('  ✗ Done but no video URL. Response:')
        console.log(JSON.stringify(pollData, null, 2).slice(0, 500))
        return null
      }
      console.log(`  Downloading: ${videoUrl.slice(0, 80)}...`)
      const videoRes = await fetch(videoUrl)
      const buffer = Buffer.from(await videoRes.arrayBuffer())
      const filePath = path.join(OUTPUT_DIR, `${promptObj.name}.mp4`)
      fs.writeFileSync(filePath, buffer)
      console.log(`  ✓ ${filePath} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`)
      return filePath
    }

    if (status === 'failed' || status === 'expired') {
      console.error(`  ✗ Video generation ${status}`)
      console.error(`  ${JSON.stringify(pollData).slice(0, 300)}`)
      return null
    }
  }

  console.error(`  ✗ Timed out after 10 minutes`)
  return null
}

async function main() {
  console.log(`Output: ${OUTPUT_DIR}\n`)
  for (const p of VIDEO_PROMPTS) {
    await generateVideo(p)
    console.log('')
  }
}

main()
