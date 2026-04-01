import fs from 'fs'
import path from 'path'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../web/public/assets')

const IMAGES = [
  {
    name: 'iot-plc-panel',
    prompt: 'Professional product photograph of an industrial PLC (Programmable Logic Controller) panel mounted on a DIN rail inside a control cabinet. Siemens-style PLC module with multiple I/O ports, LED status indicators glowing green, and neatly organized wiring. A small HMI touchscreen display showing production line status. Clean white background with soft studio lighting and subtle shadow. Technical product photography style, sharp detail, isolated on white.',
  },
  {
    name: 'iot-vision-camera',
    prompt: 'Professional product photograph of an industrial machine vision camera system for food quality inspection. A compact industrial camera (like Basler or Cognex style) with a C-mount lens, mounted on a stainless steel bracket above a conveyor belt. Ring light illuminator visible around the lens. The camera is angled down at inspection position. Clean white background, professional studio product photography with soft shadows. Sharp detail, isolated.',
  },
  {
    name: 'iot-temp-sensor',
    prompt: 'Professional product photograph of an industrial IoT temperature and humidity sensor probe for cold chain monitoring. A stainless steel sensor probe with a cable connected to a small wireless transmitter module with a tiny LCD display showing "-25.2°C" and antenna for LoRaWAN transmission. Battery powered, IP67 rated appearance. Clean white background, product photography style, sharp detail, isolated.',
  },
  {
    name: 'iot-vibration-sensor',
    prompt: 'Professional product photograph of an industrial 9-axis vibration sensor (accelerometer + gyroscope + magnetometer) for predictive maintenance. A compact cylindrical metal sensor with magnetic base, connected to a small IoT gateway box with Modbus and MQTT labels. LED status light glowing blue. Designed for mounting on rotating machinery. Clean white background, product photography, sharp detail, isolated.',
  },
  {
    name: 'iot-ip-camera',
    prompt: 'Professional product photograph of a modern AI-powered IP security camera (PTZ dome style) for factory surveillance. White dome camera with IR LED ring visible, motorized pan-tilt mechanism, and "AI Inside" label. Weatherproof housing rated IP67. An ethernet cable connected. Clean white background, product photography, sharp detail, isolated on white.',
  },
  {
    name: 'iot-current-sensor',
    prompt: 'Professional product photograph of a split-core current transformer sensor (CT sensor) for non-invasive electrical current measurement. The sensor clamps around a thick industrial power cable. Connected to a small IoT transmitter module with a digital display showing "15.2A". Industrial blue and grey housing. Clean white background, product photography, sharp detail, isolated.',
  },
]

async function gen(p) {
  console.log(`Generating: ${p.name}...`)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: p.prompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }) }
  )
  if (!res.ok) { console.error(`  ✗ ${res.status}`); return }
  const data = await res.json()
  for (const part of data.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      const fp = path.join(OUTPUT_DIR, `${p.name}.png`)
      fs.writeFileSync(fp, Buffer.from(part.inlineData.data, 'base64'))
      console.log(`  ✓ ${p.name}.png (${(fs.statSync(fp).size/1024).toFixed(0)} KB)`)
      return
    }
  }
  console.error(`  ✗ No image`)
}

async function main() {
  for (const p of IMAGES) { await gen(p); await new Promise(r => setTimeout(r, 2000)) }
  console.log('\nDone!')
}
main()
