// One-shot tool: download the hotlinked i.ibb.co images, resize + convert to
// WebP, and write them under public/img/ so the site self-hosts small assets
// instead of pulling ~50MB of full-resolution originals from a third party.
//
// Run from the repo root:  node scripts/optimize-images.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'public', 'img');

// url -> output filename + max display width (~2x the on-screen cell, retina)
const IMAGES = [
  { url: 'https://i.ibb.co/5X52yrQ6/Ev-17-02.jpg', out: 'case-1.webp', w: 1280 },
  { url: 'https://i.ibb.co/WWKxzk8p/Bazen-hissettiklerimi-kendime-bile-a-klayam-yorum-Bazense-i-imden-rp-n-rcas-na-anlatmak-geli.jpg', out: 'case-2.webp', w: 1280 },
  { url: 'https://i.ibb.co/JW38NYZg/get.jpg', out: 'case-3.webp', w: 1280 },
  { url: 'https://i.ibb.co/jPtScSHm/DSC-0232-Geli-tirilmi-SR.jpg', out: 'case-4.webp', w: 1280 },
  { url: 'https://i.ibb.co/nqv57Lv6/bottikkedy.jpg', out: 'case-5.webp', w: 1280 },
  { url: 'https://i.ibb.co/7Nkv5kv6/g-ne-28.jpg', out: 'case-6.webp', w: 1280 },
  { url: 'https://i.ibb.co/JWpD5p89/Gemini-Generated-Image-4cjhe94cjhe94cjh.png', out: 'category-1.webp', w: 1000 },
  { url: 'https://i.ibb.co/zTsqcFL2/Gemini-Generated-mage-kjwbhekjwbhekjwb.png', out: 'category-2.webp', w: 1000 },
  { url: 'https://i.ibb.co/rfqN2BC2/Whats-App-mage-2024-10-04-at-20-37-32-526fd566.jpg', out: 'mystory.webp', w: 1200 },
  { url: 'https://i.ibb.co/B5JVvv8Q/Screenshot-from-2025-12-29-03-17-31.png', out: 'testimonial-1.webp', w: 1000 },
  { url: 'https://i.ibb.co/H5bNwpz/Screenshot-from-2025-12-29-03-17-50.png', out: 'testimonial-2.webp', w: 1000 },
];

await mkdir(OUT_DIR, { recursive: true });

let totalIn = 0;
let totalOut = 0;
for (const img of IMAGES) {
  try {
    const res = await fetch(img.url);
    if (!res.ok) { console.error(`  FAIL ${res.status}  ${img.url}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    const outPath = path.join(OUT_DIR, img.out);
    const info = await sharp(buf)
      .rotate() // bake in EXIF orientation before stripping metadata
      .resize({ width: img.w, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outPath);
    totalIn += buf.length;
    totalOut += info.size;
    console.log(
      `  ${img.out.padEnd(18)} ${(buf.length / 1048576).toFixed(2)} MB -> ${(info.size / 1024).toFixed(0)} KB   (${info.width}x${info.height})`
    );
  } catch (e) {
    console.error(`  ERROR ${img.out}: ${e.message}`);
  }
}
console.log(`\n  TOPLAM: ${(totalIn / 1048576).toFixed(1)} MB  ->  ${(totalOut / 1048576).toFixed(2)} MB`);
