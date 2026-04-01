import fs from 'fs'
import path from 'path'

const XAI_API_KEY = process.env.XAI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

const VIDEOS = [
  {
    name: 'quality-lab-video',
    prompt: 'Cinematic slow-motion footage of a Taiwanese food quality control laboratory. A female Taiwanese technician in white lab coat and hairnet carefully inspecting frozen steamed buns under a bright magnifying inspection lamp. She picks one up with gloved hands, rotates it, places it on a precision digital scale. Clean bright laboratory with stainless steel surfaces, microscope and testing instruments visible. Shallow depth of field, soft warm highlights. Apple product commercial cinematography style — deliberate, elegant, premium feel. 16:9.',
  },
  {
    name: 'maintenance-video',
    prompt: 'Cinematic footage of a Taiwanese maintenance engineer using a tablet computer to inspect factory machinery. He holds up the tablet showing real-time diagnostic graphs and vibration data overlay on the screen. Camera slowly tracks from the glowing tablet screen to the large stainless steel industrial compressor he is inspecting. Sparks from welding visible in the distant background bokeh. Cool blue diagnostic light from the tablet mixed with warm tungsten factory lighting. Premium tech commercial look — controlled slow movement, shallow depth of field. Apple-style. 16:9.',
  },
  {
    name: 'inventory-video',
    prompt: 'Cinematic footage of a modern food factory warehouse. A Taiwanese female worker in safety vest and hard hat scanning barcodes on stacked flour sacks with a handheld laser scanner. Red scanning laser beam visible. Camera slowly dollies past tall organized shelving racks. A yellow forklift smoothly glides past in the background carrying pallets. Bright clean overhead LED lighting, yellow floor safety lines. Premium industrial cinematography, shallow depth of field, smooth controlled camera movement. Apple commercial aesthetic. 16:9.',
  },
]

async function generateVideo(p) {
  console.log(`[${p.name}] Starting...`)
  const r = await fetch('https://api.x.ai/v1/videos/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${XAI_API_KEY}` },
    body: JSON.stringify({ model: 'grok-imagine-video', prompt: p.prompt, duration: 10, aspect_ratio: '16:9', resolution: '720p' }),
  })
  if (!r.ok) { console.error(`  ✗ ${r.status} ${(await r.text()).slice(0, 200)}`); return null }
  const { request_id } = await r.json()
  console.log(`  ID: ${request_id}`)
  return { name: p.name, request_id }
}

async function pollVideo(name, request_id) {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000))
    process.stdout.write(`  [${name}] ${(i+1)*5}s...`)
    const pr = await fetch(`https://api.x.ai/v1/videos/${request_id}`, { headers: { 'Authorization': `Bearer ${XAI_API_KEY}` } })
    if (!pr.ok) { console.log(` ${pr.status}`); continue }
    const d = await pr.json()
    console.log(` ${d.status}`)
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
  console.log(`Generating 3 final hero videos...\n`)

  // Start all 3 with slight delay to avoid rate limit
  const tasks = []
  for (const v of VIDEOS) {
    const t = await generateVideo(v)
    if (t) tasks.push(t)
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log(`\n${tasks.length} submitted. Polling...\n`)
  const results = await Promise.all(tasks.map(t => pollVideo(t.name, t.request_id)))

  console.log('\n--- Summary ---')
  results.forEach(r => console.log(r ? `✓ ${r}` : '✗ failed'))
}
main()
