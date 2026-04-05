export const config = { maxDuration: 10 };

import { readFileSync } from 'fs';
import { join } from 'path';

// Topology-based routing engine
// Given a page, its attractor, and recent paths — suggest where to go next.
// Three modes: deepen (same basin), cross (different orbit), surface (fixed point)

let manifest = null;

function loadManifest() {
  if (manifest) return manifest;
  try {
    manifest = JSON.parse(readFileSync(join(process.cwd(), 'public', 'glyph_manifest.json'), 'utf-8'));
    return manifest;
  } catch (e) {
    return null;
  }
}

function getPageAttractor(pagePath, amap) {
  for (const [hash, group] of Object.entries(amap)) {
    for (const p of group.pages) {
      const normalized = '/' + p.file.replace(/index\.html$/, '');
      if (normalized === pagePath || p.file === pagePath.replace(/^\//, '')) {
        return { hash, ...group };
      }
    }
  }
  return null;
}

function pickRandom(arr, exclude) {
  const filtered = arr.filter(p => {
    const norm = '/' + p.file.replace(/index\.html$/, '');
    return !exclude.includes(norm) && !exclude.includes(p.file);
  });
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const m = loadManifest();
  if (!m) return res.status(500).json({ error: 'Manifest unavailable' });

  const from = req.query.from || req.body?.from || '/';
  const recentRaw = req.query.recent || req.body?.recent_paths;
  const recent = Array.isArray(recentRaw) ? recentRaw : (recentRaw || '').split(',').filter(Boolean);

  // Always exclude recent paths + current page
  const exclude = [...recent, from];

  const amap = m.attractor_map;
  const current = getPageAttractor(from, amap);
  const entries = Object.entries(amap);

  const result = {
    current: current ? {
      attractor_hash: current.hash,
      orbit_type: current.orbit_type,
      identity: current.identity,
      basin_size: current.pages.length
    } : null,
    next: {}
  };

  // DEEPEN: same attractor basin, different page
  if (current) {
    const deepenPage = pickRandom(current.pages, exclude);
    if (deepenPage) {
      result.next.deepen = {
        path: '/' + deepenPage.file.replace(/index\.html$/, ''),
        title: deepenPage.title || deepenPage.file,
        reason: 'same basin (' + current.identity + '), adjacent territory'
      };
    }
  }

  // CROSS: different orbit type, creates tension
  if (current) {
    const crossBasins = entries.filter(([h, g]) =>
      g.orbit_type !== current.orbit_type && h !== current.hash
    );
    if (crossBasins.length > 0) {
      const crossBasin = crossBasins[Math.floor(Math.random() * crossBasins.length)][1];
      const crossPage = pickRandom(crossBasin.pages, exclude);
      if (crossPage) {
        result.next.cross = {
          path: '/' + crossPage.file.replace(/index\.html$/, ''),
          title: crossPage.title || crossPage.file,
          reason: crossBasin.orbit_type + ' basin (' + crossBasin.identity + ') — destabilizes certainty'
        };
      }
    }
  }

  // SURFACE: fixed point or explanatory page — grounding
  const fixedBasins = entries.filter(([h, g]) => g.orbit_type === 'FIXED');
  const groundingPaths = ['/about.html', '/how-it-works.html', '/field-map.html'];
  let surfacePage = null;

  // Try grounding paths first
  for (const gp of groundingPaths) {
    if (!exclude.includes(gp)) {
      surfacePage = { file: gp.replace(/^\//, ''), title: gp };
      break;
    }
  }

  // Fallback to random fixed-point page
  if (!surfacePage && fixedBasins.length > 0) {
    const fixedBasin = fixedBasins[Math.floor(Math.random() * fixedBasins.length)][1];
    surfacePage = pickRandom(fixedBasin.pages, exclude);
  }

  if (surfacePage) {
    result.next.surface = {
      path: '/' + surfacePage.file.replace(/index\.html$/, ''),
      title: surfacePage.title || surfacePage.file,
      reason: 'fixed point — prevents drift'
    };
  }

  return res.status(200).json(result);
}
