import fs from 'fs'
import path from 'path'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const XAI_API_KEY = process.env.XAI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

const LINES = [
  {
    name: 'monitor-baozi',
    imagePrompt: 'Professional photograph of a modern automated steamed bun (baozi) production line in a food factory. Close-up of the high-speed forming machine stamping and wrapping steamed buns on a stainless steel conveyor belt. Steam rising from freshly formed buns. Workers in blue uniforms and white hairnets in the background monitoring touchscreen panels. Bright overhead LED lighting, clean HACCP certified environment. Industrial manufacturing photography, 16:9 aspect ratio, shallow depth of field.',
    videoPrompt: 'CCTV security camera footage of an automated steamed bun (baozi) production line. Buns moving on a conveyor belt through a forming machine, steam rising. Workers in blue uniforms monitoring. Overhead wide-angle camera perspective. Timestamp "CAM-L1 包子產線 2026/03/31 09:15:22" in top-left corner. Industrial LED lighting, clean stainless steel surfaces. Realistic security camera footage with slight grain.',
  },
  {
    name: 'monitor-dumpling',
    imagePrompt: 'Professional photograph of an automated dumpling (jiaozi/水餃) production line. High-speed dumpling forming machine precisely folding and crimping dumplings on a fast-moving conveyor belt. Flour dust visible in the air, raw dumplings in neat rows. Stainless steel machinery with blue accent panels. Workers quality-checking in the background. Bright factory lighting. Dynamic industrial photography, 16:9 aspect ratio.',
    videoPrompt: 'CCTV security camera footage of a high-speed dumpling production line. Dumplings being rapidly formed and placed on a conveyor belt. Machine arms folding dough. Workers in hairnets inspecting quality. Fixed overhead camera angle. Timestamp "CAM-L2 水餃產線 2026/03/31 09:15:22" in top-left. Fluorescent factory lighting, stainless steel equipment. Realistic grainy security camera quality.',
  },
  {
    name: 'monitor-mantou',
    imagePrompt: 'Professional photograph of an automated mantou (steamed bread/饅頭) production line. Rows of perfectly round white mantou buns on a wide conveyor belt entering a large industrial steamer. Visible steam clouds rising from the steamer. Dark sugar mantou and taro mantou varieties visible. Clean stainless steel equipment. Factory workers operating control panels. Warm lighting. Industrial food photography, 16:9 aspect ratio.',
    videoPrompt: 'CCTV security camera footage of a mantou steamed bread production line. White and brown sugar mantou moving on conveyor into a large industrial steamer. Steam billowing out. Workers monitoring the process. Static wide-angle overhead camera. Timestamp "CAM-L3 饅頭產線 2026/03/31 09:15:22" in top-left corner. Industrial fluorescent lighting. Realistic security camera footage quality.',
  },
  {
    name: 'monitor-prepared',
    imagePrompt: 'Professional photograph of a prepared foods (調理食品) production line making scallion pancakes (蔥抓餅) and egg crepes (蛋餅皮). Flat round dough pieces on a wide conveyor belt going through a pressing and cooking machine. Golden brown scallion pancakes stacked for packaging. Industrial food processing equipment with digital control screens. Clean factory environment with stainless steel surfaces. Professional industrial photography, 16:9 aspect ratio.',
    videoPrompt: 'CCTV security camera footage of a prepared foods production line making scallion pancakes and egg crepe wrappers. Flat dough circles moving through pressing machines on conveyor belts. Workers in white uniforms packaging finished products. Fixed overhead wide-angle camera. Timestamp "CAM-L4 調理食品線 2026/03/31 09:15:22" in top-left. Bright industrial lighting. Realistic security camera footage quality.',
  },
]

// --- Step 1: Generate images with Gemini ---
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
    const err = await res.text()
    console.error(`  ✗ ${line.name}: ${res.status} ${err.slice(0, 200)}`)
    return null
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts ?? []

  for (const part of parts) {
    if (part.inlineData) {
      const ext = part.inlineData.mimeType === 'image/png' ? 'png' : 'jpg'
      const filePath = path.join(OUTPUT_DIR, `${line.name}.${ext}`)
      const buffer = Buffer.from(part.inlineData.data, 'base64')
      fs.writeFileSync(filePath, buffer)
      console.log(`  ✓ ${line.name}.${ext} (${(buffer.length / 1024).toFixed(0)} KB)`)
      return { filePath, ext }
    }
  }

  console.error(`  ✗ ${line.name}: No image in response`)
  return null
}

// --- Step 2: Generate videos with xAI (image-to-video) ---
async function generateVideo(line, imageResult) {
  console.log(`🎬 Generating video: ${line.name}...`)

  const body = {
    model: 'grok-imagine-video',
    prompt: line.videoPrompt,
    duration: 10,
    aspect_ratio: '16:9',
    resolution: '720p',
  }

  // If we have an image, use it as input for image-to-video
  if (imageResult) {
    const imgBuffer = fs.readFileSync(imageResult.filePath)
    const base64 = imgBuffer.toString('base64')
    const mimeType = imageResult.ext === 'png' ? 'image/png' : 'image/jpeg'
    body.image = { data: base64, mime_type: mimeType }
  }

  const createRes = await fetch('https://api.x.ai/v1/videos/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    console.error(`  ✗ Create failed: ${createRes.status} ${err.slice(0, 300)}`)
    // If image-to-video fails, retry without image
    if (imageResult) {
      console.log(`  ↻ Retrying without image (text-only)...`)
      return generateVideo(line, null)
    }
    return null
  }

  const createData = await createRes.json()
  const requestId = createData.request_id
  console.log(`  Request ID: ${requestId}`)

  // Poll for completion
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
        console.log('  ✗ Done but no video URL')
        return null
      }
      console.log(`  Downloading...`)
      const videoRes = await fetch(videoUrl)
      const buffer = Buffer.from(await videoRes.arrayBuffer())
      const filePath = path.join(OUTPUT_DIR, `${line.name}.mp4`)
      fs.writeFileSync(filePath, buffer)
      console.log(`  ✓ ${line.name}.mp4 (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`)
      return filePath
    }

    if (status === 'failed' || status === 'expired') {
      console.error(`  ✗ Video generation ${status}`)
      return null
    }
  }

  console.error(`  ✗ Timed out`)
  return null
}

async function main() {
  console.log(`Output: ${OUTPUT_DIR}\n`)

  // Step 1: Generate all images
  console.log('=== Phase 1: Generating Images (Gemini) ===\n')
  const imageResults = []
  for (const line of LINES) {
    const result = await generateImage(line)
    imageResults.push(result)
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('\n=== Phase 2: Generating Videos (xAI) ===\n')
  for (let i = 0; i < LINES.length; i++) {
    await generateVideo(LINES[i], imageResults[i])
    console.log('')
  }

  console.log('\n=== Done ===')
}

main()
