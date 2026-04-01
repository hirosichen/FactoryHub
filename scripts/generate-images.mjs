import fs from 'fs'
import path from 'path'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

const PROMPTS = [
  {
    name: 'hero-factory',
    prompt: 'Professional photograph of a modern automated food factory interior. Stainless steel conveyor belts with steamed buns (baozi) being produced in neat rows. Warm overhead LED lighting, clean white walls, workers in blue uniforms and hairnets operating touchscreen control panels. Ultra-clean HACCP certified facility. Shot with wide angle lens, shallow depth of field. Cinematic industrial photography style, 16:9 aspect ratio.',
  },
  {
    name: 'cold-chain',
    prompt: 'Professional photograph of a large industrial cold storage warehouse at -25°C. Rows of metal shelving stacked with frozen food packaging boxes. Visible frost on surfaces, cold mist in the air. Blue-tinted LED lighting creating a dramatic atmosphere. Digital temperature display showing -25.2°C on the wall. Forklift in the background. Industrial photography, sharp detail, cool blue color grading.',
  },
  {
    name: 'quality-lab',
    prompt: 'Professional photograph of a food quality control laboratory. A technician in white lab coat examining frozen dumplings under bright inspection light. Laboratory instruments, digital scales, microscope on the workbench. HACCP documentation clipboard visible. Clean, bright, clinical environment with stainless steel surfaces. Professional product photography lighting.',
  },
  {
    name: 'iot-sensors',
    prompt: 'Close-up professional photograph of industrial IoT sensors and gateway devices mounted on stainless steel equipment in a food factory. Visible MQTT/Modbus protocol labels, blinking LED status lights (green), ethernet cables connected. A small LCD screen showing temperature readings. Sharp focus, macro photography style, shallow depth of field with bokeh background showing factory floor.',
  },
  {
    name: 'control-room',
    prompt: 'Professional photograph of a modern factory control room. Multiple large curved monitors displaying real-time production dashboards with charts, temperature graphs, and production line status. An operator sitting at the desk monitoring data. Dark room illuminated by the blue glow of screens. Futuristic smart manufacturing operations center aesthetic. Cinematic wide shot.',
  },
  {
    name: 'production-line',
    prompt: 'Professional photograph of an automated dumpling (jiaozi) production line in a food factory. Close-up of the forming machine precisely shaping dumplings on a conveyor belt. Steam rising, flour dust visible in the air. Stainless steel machinery, high-speed production. Dynamic action shot with slight motion blur on the conveyor. Industrial manufacturing photography.',
  },
]

async function generateImage(promptObj) {
  console.log(`Generating: ${promptObj.name}...`)

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptObj.prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    console.error(`  ✗ ${promptObj.name}: ${res.status} ${err.slice(0, 200)}`)
    return null
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts ?? []

  for (const part of parts) {
    if (part.inlineData) {
      const ext = part.inlineData.mimeType === 'image/png' ? 'png' : 'jpg'
      const filePath = path.join(OUTPUT_DIR, `${promptObj.name}.${ext}`)
      const buffer = Buffer.from(part.inlineData.data, 'base64')
      fs.writeFileSync(filePath, buffer)
      console.log(`  ✓ ${filePath} (${(buffer.length / 1024).toFixed(0)} KB)`)
      return filePath
    }
  }

  console.error(`  ✗ ${promptObj.name}: No image in response`)
  return null
}

async function main() {
  console.log(`Output: ${OUTPUT_DIR}\n`)
  const results = []
  for (const p of PROMPTS) {
    const result = await generateImage(p)
    results.push({ name: p.name, path: result })
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000))
  }
  console.log('\n--- Summary ---')
  for (const r of results) {
    console.log(`${r.path ? '✓' : '✗'} ${r.name}`)
  }
}

main()
