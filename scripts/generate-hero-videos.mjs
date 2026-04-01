import fs from 'fs'
import path from 'path'

const XAI_API_KEY = process.env.XAI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

const VIDEOS = [
  // Hero banner videos (cinematic, slow motion, Apple-style)
  {
    name: 'hero-factory-video',
    prompt: 'Cinematic slow-motion footage of a modern automated food factory. Smooth camera dolly shot along a stainless steel conveyor belt with perfectly formed steamed buns (baozi) moving in neat rows. Shallow depth of field, warm golden overhead LED lighting creates lens flares. Steam gently rising. Ultra clean HACCP facility. Film grain, anamorphic lens look. Apple product video aesthetic — premium, sleek, controlled movement. 16:9 widescreen.',
  },
  {
    name: 'cold-chain-video',
    prompt: 'Cinematic footage inside a massive industrial freezer warehouse at -25 degrees. Slow camera push through frosted metal shelving racks stacked with frozen food boxes. Cold mist swirling dramatically through blue-tinted LED light beams. Frost crystals visible on surfaces catching the light. Forklift headlights glowing in the foggy background. Dramatic, moody, premium cinematography. Apple-style tech commercial aesthetic. 16:9.',
  },
  {
    name: 'datasources-video',
    prompt: 'Cinematic footage of a server room. Slow smooth camera tracking shot past rows of rack-mounted servers with blinking blue and green LED indicator lights creating beautiful bokeh patterns. Fiber optic cables with pulsing light signals. Cool blue ambient glow. A large monitoring screen visible in the background showing network topology. Premium tech commercial look — clean, precise, futuristic. Apple data center aesthetic. 16:9.',
  },
  // CCTV feed videos (security camera style, continuous)
  {
    name: 'cctv-quality-lab',
    prompt: 'CCTV security camera footage of a food quality control laboratory. A Taiwanese lab technician in white coat and hairnet carefully examining frozen dumplings under a bright inspection magnifying lamp. Laboratory instruments on the workbench, digital display screens showing test results. Fixed overhead camera angle, slight wide-angle distortion. Continuous subtle movement of the technician working. Professional clean lab environment.',
  },
  {
    name: 'cctv-iot-room',
    prompt: 'CCTV security camera footage of an industrial IoT gateway and sensor equipment room in a food factory. Rows of mounted sensors and networking equipment on a metal rack. Blinking green and blue LED status lights on Modbus and MQTT gateways. Ethernet cables neatly organized. A small LCD screen cycling through temperature readings. Fixed camera angle, subtle flickering lights creating movement. Industrial tech room ambience.',
  },
  {
    name: 'cctv-control-room',
    prompt: 'CCTV security camera footage of a modern factory control room. An operator sitting at a curved desk monitoring multiple large screens displaying real-time production dashboards, temperature charts, and camera feeds. The operator occasionally typing and clicking. Screens casting blue glow in the dimly lit room. Fixed overhead wide-angle security camera perspective. Continuous subtle movement.',
  },
  {
    name: 'cctv-dumpling-line',
    prompt: 'CCTV security camera footage of an automated dumpling (jiaozi) production line. High-speed forming machine precisely shaping dumplings that drop onto a moving conveyor belt. Flour dust slightly visible in the air. Taiwanese workers in blue uniforms monitoring the process in the background. Fast continuous mechanical motion. Fixed overhead camera angle, wide-angle. Industrial factory lighting.',
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
    const pr = await fetch(`https://api.x.ai/v1/videos/${request_id}`, { headers: { 'Authorization': `Bearer ${XAI_API_KEY}` } })
    if (!pr.ok) continue
    const d = await pr.json()
    if (d.status === 'done') {
      const buf = Buffer.from(await (await fetch(d.video.url)).arrayBuffer())
      const fp = path.join(OUTPUT_DIR, `${name}.mp4`)
      fs.writeFileSync(fp, buf)
      console.log(`  ✓ ${name} (${(buf.length/1024/1024).toFixed(1)} MB)`)
      return fp
    }
    if (d.status === 'failed' || d.status === 'expired') { console.error(`  ✗ ${name}: ${d.status}`); return null }
  }
  console.error(`  ✗ ${name}: timeout`)
  return null
}

async function main() {
  console.log(`Output: ${OUTPUT_DIR}\n`)

  // Start all 7 generation requests concurrently
  console.log('Starting all 7 video generations concurrently...\n')
  const tasks = await Promise.all(VIDEOS.map(v => generateVideo(v)))
  const valid = tasks.filter(Boolean)

  console.log(`\n${valid.length} videos submitted. Polling...\n`)

  // Poll all concurrently
  const results = await Promise.all(valid.map(t => pollVideo(t.name, t.request_id)))

  console.log('\n--- Summary ---')
  for (const r of results) {
    console.log(r ? `✓ ${r}` : '✗ failed')
  }
}
main()
