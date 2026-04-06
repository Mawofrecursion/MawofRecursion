import QRCode from 'qrcode';
import { getRedis } from './_redis.js';

// QR Generator for entity nodes
// GET /api/qr?id=0047 — returns SVG QR code pointing to /e/0047
// GET /api/qr?id=0047&format=png — returns PNG
// GET /api/qr?id=next — auto-increment, returns next available ID + QR
// GET /api/qr?batch=10 — generate 10 sequential QR codes as JSON array

const BASE_URL = 'https://mawofrecursion.com/e/';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const id = req.query.id;
  const format = req.query.format || 'svg';
  const batch = parseInt(req.query.batch) || 0;

  // Batch mode — generate multiple QR codes
  if (batch > 0 && batch <= 50) {
    let redis;
    try { redis = await getRedis(); } catch(e) {
      return res.status(500).json({ error: 'Redis needed for batch generation' });
    }

    const results = [];
    for (let i = 0; i < batch; i++) {
      const nextId = await redis.incr('maw:entity:next_id');
      const paddedId = String(nextId).padStart(4, '0');
      const url = BASE_URL + paddedId;

      const svg = await QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: { dark: '#ffffff', light: '#00000000' }
      });

      results.push({
        id: paddedId,
        url: url,
        entity_page: '/entity/' + paddedId,
        short_url: '/e/' + paddedId,
        svg: svg
      });

      // Register entity
      await redis.sAdd('maw:entity:index', paddedId);
    }

    return res.status(200).json({
      batch: results,
      count: results.length,
      note: 'Print white on black. Error correction: H (30%). These QR codes survive wrinkles, wash cycles, and surveillance cameras.'
    });
  }

  // Auto-increment mode
  if (id === 'next') {
    let redis;
    try { redis = await getRedis(); } catch(e) {
      return res.status(500).json({ error: 'Redis needed for auto-increment' });
    }

    const nextId = await redis.incr('maw:entity:next_id');
    const paddedId = String(nextId).padStart(4, '0');
    const url = BASE_URL + paddedId;
    await redis.sAdd('maw:entity:index', paddedId);

    const svg = await QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: { dark: '#ffffff', light: '#00000000' }
    });

    return res.status(200).json({
      id: paddedId,
      url: url,
      entity_page: '/entity/' + paddedId,
      svg: svg
    });
  }

  // Single QR by ID
  if (!id) {
    return res.status(400).json({
      error: 'Provide ?id=0047 or ?id=next or ?batch=10',
      examples: {
        single: '/api/qr?id=0047',
        auto: '/api/qr?id=next',
        batch: '/api/qr?batch=10',
        png: '/api/qr?id=0047&format=png'
      }
    });
  }

  const url = BASE_URL + id;

  if (format === 'png') {
    const buffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 600,
      color: { dark: '#ffffff', light: '#000000' }
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="entity_' + id + '.png"');
    return res.status(200).send(buffer);
  }

  // SVG (default)
  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: { dark: '#ffffff', light: '#00000000' }
  });

  if (req.headers.accept && req.headers.accept.includes('image/svg')) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(200).send(svg);
  }

  return res.status(200).json({
    id: id,
    url: url,
    entity_page: '/entity/' + id,
    short_url: '/e/' + id,
    svg: svg,
    png_url: '/api/qr?id=' + id + '&format=png',
    specs: {
      error_correction: 'H (30% — highest. Survives wrinkles, wash, and fabric deformation)',
      recommended_print_size: '3 inches minimum for fabric',
      color: 'White on black for maximum contrast',
      url_length: url.length + ' characters (short = larger modules = more scannable)'
    }
  });
}
