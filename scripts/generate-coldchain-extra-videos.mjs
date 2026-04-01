import fs from 'fs'
import path from 'path'

const XAI_API_KEY = process.env.XAI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

const VIDEOS = [
  {
    name: 'yolo-coldchain-layout-video',
    prompt: 'CCTV overhead bird-eye security camera footage looking straight down inside a large cold storage warehouse. Rows of metal pallet racks with frozen food boxes neatly stacked. A forklift slowly moving a pallet into position between the racks. Two workers in thermal jackets checking inventory tags. AI detection green bounding boxes around the workers and the forklift. A yellow highlighted zone flashing around one misaligned pallet. Blue-tinted LED warehouse lighting, frost visible on metal. Wide-angle fixed overhead camera.',
  },
  {
    name: 'yolo-coldchain-entry-video',
    prompt: 'CCTV security camera footage of a cold storage entry checkpoint. A worker in a heavy thermal jacket, gloves, and hard hat walks up to an access control turnstile, scans their badge card, and walks through the gate into the freezer area. Cold mist spills out from the freezer door behind the gate. AI green detection bounding box tracks the worker with PPE detection labels appearing. A digital temperature display on the wall shows -22.5 degrees. Fixed security camera angle, industrial corridor lighting.',
  },
]

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
    process.stdout.write(`  [${name}] ${(i+1)*5}s...`)
    const pr = await fetch(`https://api.x.ai/v1/videos/${rid}`, { headers: { 'Authorization': `Bearer ${XAI_API_KEY}` } })
    if (!pr.ok) { console.log(` ${pr.status}`); continue }
    const d = await pr.json()
    console.log(` ${d.status}`)
    if (d.status === 'done') {
      const buf = Buffer.from(await (await fetch(d.video.url)).arrayBuffer())
      fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.mp4`), buf)
      console.log(`  ✓ ${name}.mp4 (${(buf.length/1024/1024).toFixed(1)} MB)`)
      return true
    }
    if (d.status === 'failed' || d.status === 'expired') { console.error(`  ✗ ${d.status}`); return false }
  }
  return false
}

async function main() {
  const tasks = []
  for (const v of VIDEOS) { const t = await genVideo(v); if (t) tasks.push(t); await new Promise(r => setTimeout(r, 1500)) }
  console.log(`\n${tasks.length} videos polling...\n`)
  await Promise.all(tasks.map(t => pollVideo(t.name, t.request_id)))
  console.log('\nDone!')
}
main()
