const fs = require('fs');
const { put } = require('@vercel/blob');
const convert = require('heic-convert');
const sharp = require('sharp');

const REPO = 'diogorruiz-stack/pedal-nos-balcas';
const BRANCH = 'gallery-transfer';

function safeStem(name, fallback) {
  return String(name || '')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^_+|_+$/g, '') || fallback;
}

async function getText(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
  return r.text();
}

async function getRaw(photo, version) {
  if (photo.sourceUrl) {
    const rr = await fetch(photo.sourceUrl, { cache: 'no-store' });
    if (!rr.ok) throw new Error(`GET source ${photo.name} -> ${rr.status}`);
    return Buffer.from(await rr.arrayBuffer());
  }
  if (photo.rawPath) {
    const rr = await fetch(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/${photo.rawPath}?v=${encodeURIComponent(version)}`, { cache: 'no-store' });
    if (!rr.ok) throw new Error(`GET raw ${photo.rawPath} -> ${rr.status}`);
    return Buffer.from(await rr.arrayBuffer());
  }
  let b64 = '';
  for (const part of photo.parts || []) {
    b64 += (await getText(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/${part}?v=${encodeURIComponent(version)}`)).trim();
  }
  return Buffer.from(b64, 'base64');
}

async function main() {
  const target = JSON.parse(fs.readFileSync('migration-target.json', 'utf8'));
  const days = Array.isArray(target.days) ? target.days.map(Number).filter(Boolean) : [Number(target.day || 0)].filter(Boolean);
  if (!days.length) {
    console.log('[gallery] no migration target; skipping');
    return;
  }

  const version = String(target.version || Date.now());
  for (const day of days) {
    const root = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/transfer/day${day}`;
    const manifest = JSON.parse(await getText(`${root}/manifest.json?v=${encodeURIComponent(version)}`));
    if (!Array.isArray(manifest.photos) || !manifest.photos.length) throw new Error(`empty migration manifest for day ${day}`);

    console.log(`[gallery] prefetching day ${day}: ${manifest.photos.length} photos`);
    const prefetched = await Promise.all(manifest.photos.map(async (photo, i) => {
      const raw = await getRaw(photo, version);
      if (!raw.length) throw new Error(`empty reconstructed photo: ${photo.name}`);
      console.log(`[gallery] prefetched ${i + 1}/${manifest.photos.length} ${photo.name}`);
      return { photo, raw };
    }));

    console.log(`[gallery] converting/uploading day ${day}`);
    for (let i = 0; i < prefetched.length; i++) {
      const { photo, raw } = prefetched[i];
      let input = raw;
      if (/heic|heif/i.test(photo.name || '')) {
        input = Buffer.from(await convert({ buffer: raw, format: 'JPEG', quality: 0.9 }));
      }

      const optimized = await sharp(input)
        .rotate()
        .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 84, mozjpeg: true })
        .toBuffer();

      const stem = safeStem(photo.stem || photo.name, `photo_${String(i + 1).padStart(3, '0')}`);
      const pathname = `curated/day${day}/${stem}.jpg`;
      const blob = await put(pathname, optimized, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'image/jpeg',
        cacheControlMaxAge: 31536000
      });
      console.log(`[gallery] ${i + 1}/${manifest.photos.length} ${photo.name} -> ${blob.url}`);
    }
    console.log(`[gallery] day ${day} complete`);
  }
}

main().catch(err => {
  console.error('[gallery] migration failed', err);
  process.exitCode = 1;
});
