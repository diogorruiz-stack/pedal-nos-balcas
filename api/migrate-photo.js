const { put } = require('@vercel/blob');
const convert = require('heic-convert');
const sharp = require('sharp');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
    if (String(req.query.key || '') !== 'gallery-20261017-migrate') return res.status(403).json({ error: 'forbidden' });

    const day = String(req.query.day || '').replace(/[^0-9]/g, '');
    const rawName = String(req.query.name || 'photo').trim();
    const transferPath = String(req.query.path || '');
    if (!day || !/^transfer\/day\d+\/[A-Za-z0-9._-]+$/.test(transferPath)) {
      return res.status(400).json({ error: 'bad_transfer_path' });
    }

    const source = 'https://raw.githubusercontent.com/diogorruiz-stack/pedal-nos-balcas/gallery-transfer/' +
      transferPath.split('/').map(encodeURIComponent).join('/');
    const upstream = await fetch(source, { redirect: 'follow' });
    if (!upstream.ok) return res.status(502).json({ error: 'source_fetch_failed', status: upstream.status });

    const raw = Buffer.from(await upstream.arrayBuffer());
    if (!raw.length) return res.status(400).json({ error: 'empty_source' });
    if (raw.length > 12_000_000) return res.status(413).json({ error: 'source_too_large' });

    let jpegInput = raw;
    if (/heic|heif/i.test(rawName)) {
      jpegInput = Buffer.from(await convert({ buffer: raw, format: 'JPEG', quality: 0.9 }));
    }

    const optimized = await sharp(jpegInput)
      .rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();

    const stem = rawName
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/^_+|_+$/g, '') || 'photo';

    const pathname = `curated/day${day}/${stem}.jpg`;
    const blob = await put(pathname, optimized, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/jpeg',
      cacheControlMaxAge: 31536000
    });

    return res.status(200).json({
      ok: true,
      url: blob.url,
      pathname: blob.pathname,
      inputBytes: raw.length,
      outputBytes: optimized.length
    });
  } catch (err) {
    return res.status(500).json({ error: 'migration_failed', detail: String(err && err.message || err) });
  }
};
