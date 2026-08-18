import sharp from 'sharp'
import { readFile } from 'node:fs/promises'

const svg = await readFile('public/logo.svg')
const sizes = [192, 512]

for (const size of sizes) {
  await sharp(svg, { density: 400 })
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}.png`)
  console.log(`gerado icon-${size}.png`)
}

await sharp(svg, { density: 400 })
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png')
console.log('gerado apple-touch-icon.png')
