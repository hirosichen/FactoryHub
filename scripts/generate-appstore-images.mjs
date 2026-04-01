import fs from 'fs'
import path from 'path'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets/appstore')

const PROMPTS = [
  {
    name: 'production',
    prompt: 'Cinematic wide-angle photograph of a modern automated food production line in motion. Stainless steel machinery, steamed buns moving on conveyor belts, warm golden factory lighting from above, subtle steam rising. Shallow depth of field, bokeh lights in background. Premium industrial photography, moody and atmospheric, 3:2 aspect ratio.',
  },
  {
    name: 'quality',
    prompt: 'Close-up macro photograph of a food scientist examining product samples under bright inspection light. White lab coat, gloved hands holding a magnifying lens over golden-brown pastries. Laboratory instruments softly blurred in background. Dramatic side lighting, clinical precision feel. Premium editorial photography style, 3:2 aspect ratio.',
  },
  {
    name: 'coldchain',
    prompt: 'Atmospheric photograph inside a massive industrial cold storage warehouse at sub-zero temperature. Rows of frozen goods on tall metal racks disappearing into misty cold fog. Blue-tinted LED strip lighting creating dramatic rays through the frost-filled air. Ice crystals visible on surfaces. Cinematic mood, cool blue-cyan color grading, 3:2 aspect ratio.',
  },
  {
    name: 'maintenance',
    prompt: 'Dramatic close-up photograph of precision industrial gears and mechanical components of a factory machine. Metallic surfaces with subtle oil sheen reflecting warm amber workshop lighting. A digital diagnostic sensor with glowing green LED attached to the machinery. Shallow depth of field, rich textures of machined metal. Premium industrial still-life photography, 3:2 aspect ratio.',
  },
  {
    name: 'inventory',
    prompt: 'Aerial top-down photograph of a modern automated warehouse with organized rows of inventory bins and packages. Robotic arm or AGV cart visible. Clean geometric patterns of boxes in warm earth tones. Soft overhead lighting creating gentle shadows. Minimalist, orderly, satisfying composition. Premium logistics photography, 3:2 aspect ratio.',
  },
  {
    name: 'energy-monitor',
    prompt: 'Artistic photograph of a modern smart electrical panel with glowing digital meters and status LEDs in green and amber. Cable bundles neatly organized. Dark background with the panel dramatically lit, creating a futuristic tech aesthetic. Light trails suggesting energy flow. Premium tech photography, moody lighting, 3:2 aspect ratio.',
  },
  {
    name: 'haccp-tracker',
    prompt: 'Clean editorial photograph of a food safety inspection scene. Stainless steel prep table with a digital thermometer probe inserted into food product showing precise temperature. Clipboard with checklist and green checkmarks nearby. Bright, clean, clinical white lighting. Professional food-safety documentation aesthetic, 3:2 aspect ratio.',
  },
  {
    name: 'protocol-gateway',
    prompt: 'Artistic close-up photograph of an industrial IoT gateway device with multiple ethernet cables and blinking status LEDs in blue and green. Circuit board traces subtly visible through translucent casing. Dark background with dramatic rim lighting creating a high-tech atmosphere. Data streams visualized as subtle light trails. Premium technology product photography, 3:2 aspect ratio.',
  },
  {
    name: 'traceability',
    prompt: 'Stylish overhead flat-lay photograph of a supply chain concept. QR codes, barcode labels, raw ingredient samples, packaged food products, and shipping documents arranged artfully on a dark slate surface. Connected by subtle drawn lines suggesting flow. Warm directional lighting, editorial product photography style, 3:2 aspect ratio.',
  },
  {
    name: 'wastewater',
    prompt: 'Serene environmental photograph of a modern wastewater treatment facility at golden hour. Clear treated water flowing through stainless steel channels, reflecting warm sunset light. pH sensor probes and monitoring equipment visible. Lush green vegetation surrounding the facility. Clean, hopeful, environmental-tech aesthetic, 3:2 aspect ratio.',
  },
  {
    name: 'digital-twin',
    prompt: 'Futuristic concept image of a factory floor with a glowing holographic digital twin overlay. Semi-transparent wireframe 3D model of industrial equipment floating above the real machines. Blue and purple holographic light effects. Dark ambient factory setting with dramatic volumetric lighting. Sci-fi cinematic style, 3:2 aspect ratio.',
  },
  {
    name: 'carbon-footprint',
    prompt: 'Artistic environmental concept photograph. A single young green leaf sprouting from cracked industrial concrete, with a modern factory softly blurred in the background. Morning golden light illuminating the leaf. Symbolizing sustainability and green manufacturing. Shallow depth of field, warm hopeful tones, premium nature-meets-industry photography, 3:2 aspect ratio.',
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
    console.error(`  ✗ ${promptObj.name}: ${res.status} ${err.slice(0, 300)}`)
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
      return { path: filePath, ext }
    }
  }

  console.error(`  ✗ ${promptObj.name}: No image in response`)
  console.error(`    Parts:`, JSON.stringify(parts.map(p => Object.keys(p)), null, 2))
  return null
}

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  console.log(`Output: ${OUTPUT_DIR}\n`)

  const results = []
  for (const p of PROMPTS) {
    const result = await generateImage(p)
    results.push({ name: p.name, ...result })
    // Delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 3000))
  }

  console.log('\n--- Summary ---')
  for (const r of results) {
    console.log(`${r.path ? '✓' : '✗'} ${r.name}${r.ext ? ` (.${r.ext})` : ''}`)
  }
}

main()
