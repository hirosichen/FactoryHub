import fs from 'fs'
import path from 'path'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

const PROMPTS = [
  {
    name: 'maintenance-hero',
    prompt: 'Professional photograph of a Taiwanese maintenance engineer (East Asian man, black hair, 30s) using a tablet to inspect industrial food factory equipment. He is checking vibration sensors mounted on a large stainless steel compressor. Digital diagnostic data visible on the tablet screen. Sparks of welding visible in the far background. Industrial factory setting with pipes and machinery. Warm tungsten work-light mixed with cool ambient factory lighting. Cinematic depth of field. 16:9 aspect ratio.',
  },
  {
    name: 'inventory-hero',
    prompt: 'Professional photograph of a modern food factory warehouse and raw materials storage area. Neatly stacked sacks of flour on wooden pallets, organized shelving with labeled ingredient containers. A Taiwanese warehouse worker (East Asian woman, black hair, 30s) scanning a barcode on a flour sack with a handheld device. Clean organized environment with bright overhead LED lights. Industrial shelving, forklift in background. Professional industrial photography, 16:9 wide shot.',
  },
  {
    name: 'datasources-hero',
    prompt: 'Professional photograph of a server room and network operations center in a food factory. Rows of rack-mounted servers with blinking blue and green LED lights. Ethernet cables neatly organized. A large wall-mounted screen showing a network topology diagram with connected factory systems (MES, SCADA, ERP labels visible). Cool blue ambient lighting from the server LEDs. Modern high-tech infrastructure. Cinematic photography, sharp detail, 16:9.',
  },
  {
    name: 'chat-assistant-bg',
    prompt: 'Soft abstract background for an AI chatbot interface. Subtle gradient from warm cream to light peach. Delicate geometric mesh pattern with connected nodes suggesting AI neural network. Small food-related icons (wheat, steam bun, factory) subtly embedded in the pattern at low opacity. Clean, minimal, modern. Suitable as a light-themed chat background. Soft and inviting. Square format.',
  },
  {
    name: 'chat-recipe-bg',
    prompt: 'Soft abstract background for a recipe optimization AI interface. Subtle gradient from light sage green to warm cream. Faint molecular gastronomy structure patterns and ingredient silhouettes (flour, eggs, measuring cup) at very low opacity. Clean geometric lines suggesting data analysis and optimization. Modern, minimal, light-themed. Suitable as a chat interface background. Square format.',
  },
]

async function gen(p) {
  console.log(`Generating: ${p.name}...`)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: p.prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    }
  )
  if (!res.ok) { console.error(`  ✗ ${res.status} ${(await res.text()).slice(0, 150)}`); return }
  const data = await res.json()
  for (const part of data.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      const ext = part.inlineData.mimeType === 'image/png' ? 'png' : 'jpg'
      const fp = path.join(OUTPUT_DIR, `${p.name}.${ext}`)
      fs.writeFileSync(fp, Buffer.from(part.inlineData.data, 'base64'))
      console.log(`  ✓ ${fp} (${(fs.statSync(fp).size / 1024).toFixed(0)} KB)`)
      return
    }
  }
  console.error(`  ✗ No image`)
}

async function main() {
  for (const p of PROMPTS) { await gen(p); await new Promise(r => setTimeout(r, 2000)) }
  console.log('\nDone!')
}
main()
