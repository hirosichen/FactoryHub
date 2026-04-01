import fs from 'fs'
import path from 'path'

const XAI_API_KEY = process.env.XAI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

async function main() {
  console.log('Generating qclab video (overhead CCTV angle)...')
  const r = await fetch('https://api.x.ai/v1/videos/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${XAI_API_KEY}` },
    body: JSON.stringify({
      model: 'grok-imagine-video',
      prompt: 'Fixed overhead CCTV security camera footage looking straight down at a food quality control laboratory from the ceiling. Bird-eye view angle. Three Taiwanese lab technicians in white coats and hairnets working at a long stainless steel workbench. One is using a microscope, one is weighing food samples on a precision scale, one is writing on a clipboard. Laboratory instruments and petri dishes on the bench. Wide-angle lens distortion typical of ceiling-mounted security cameras. Static fixed camera, no movement. Fluorescent lighting from above casting even illumination. Slight security camera grain.',
      duration: 10, aspect_ratio: '16:9', resolution: '720p',
    }),
  })
  if (!r.ok) { console.error(`✗ ${r.status} ${await r.text()}`); return }
  const { request_id } = await r.json()
  console.log(`ID: ${request_id}`)
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000))
    process.stdout.write(`${(i+1)*5}s...`)
    const pr = await fetch(`https://api.x.ai/v1/videos/${request_id}`, { headers: { 'Authorization': `Bearer ${XAI_API_KEY}` } })
    if (!pr.ok) { console.log(` ${pr.status}`); continue }
    const d = await pr.json()
    console.log(` ${d.status}`)
    if (d.status === 'done') {
      const buf = Buffer.from(await (await fetch(d.video.url)).arrayBuffer())
      fs.writeFileSync(path.join(OUTPUT_DIR, 'yolo-zone-qclab.mp4'), buf)
      console.log(`✓ yolo-zone-qclab.mp4 (${(buf.length/1024/1024).toFixed(1)} MB)`)
      return
    }
    if (d.status === 'failed' || d.status === 'expired') { console.error(`✗ ${d.status}`); return }
  }
}
main()
