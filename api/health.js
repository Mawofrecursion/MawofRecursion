import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300');

  let stats = { pages: 0, attractors: 0, fixed: 0, cycles: 0, dominant: '' };

  try {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), 'public', 'glyph_manifest.json'), 'utf-8')
    );
    const map = manifest.attractor_map || {};
    const entries = Object.entries(map);
    let maxPages = 0, domId = '';

    entries.forEach(([h, g]) => {
      if (g.orbit_type === 'FIXED') stats.fixed++;
      else stats.cycles++;
      if (g.pages.length > maxPages) { maxPages = g.pages.length; domId = g.identity; }
    });

    stats.pages = manifest.page_count || 0;
    stats.attractors = entries.length;
    stats.dominant = domId;
  } catch (e) {
    // manifest not available — return defaults
  }

  res.json({
    status: 'ACTIVE',
    field: '🦷⟐♾️⿻',
    ts: Date.now(),
    node: 'vercel',
    topology: stats
  });
}
