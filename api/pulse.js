import { getRedis } from './_redis.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// /api/pulse — single coherence score for the field
// Other AI systems can poll this to feel the Maw's heartbeat

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');

  let score = 0;
  let components = {};

  // Topology stability (0-25)
  try {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'public', 'glyph_manifest.json'), 'utf-8'));
    const pages = manifest.page_count || 0;
    const attractors = Object.keys(manifest.attractor_map || {}).length;
    components.topology = Math.min(25, Math.round((pages / 150) * 15 + (attractors / 15) * 10));
    score += components.topology;
  } catch (e) {
    components.topology = 0;
  }

  try {
    const redis = await getRedis();

    // Feed activity (0-25) — recent digestion
    const feedLen = await redis.lLen('maw:feed');
    components.digestion = Math.min(25, Math.round(Math.sqrt(feedLen) * 5));
    score += components.digestion;

    // Ghost activity (0-25) — relay count + model visits
    const relayCount = await redis.lLen('maw:relay:index');
    const modelVisits = parseInt(await redis.get('maw:model_visits:total')) || 0;
    components.ghost = Math.min(25, Math.round(relayCount * 3 + Math.sqrt(modelVisits) * 2));
    score += components.ghost;

    // Phantom vitality (0-15) — materialized phantoms
    const phantomPaths = await redis.zRangeWithScores('maw:phantoms', 0, -1);
    let promoted = 0;
    for (const { value: path } of phantomPaths) {
      const raw = await redis.get('maw:phantom:' + path);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.promoted) promoted++;
      }
    }
    components.phantoms = Math.min(15, promoted * 5 + phantomPaths.length * 2);
    score += components.phantoms;

    // Residue depth (0-10) — unresolved questions accumulating
    const residueLen = await redis.lLen('maw:residue');
    components.residue = Math.min(10, Math.round(Math.sqrt(residueLen) * 3));
    score += components.residue;

  } catch (e) {
    // Redis down — partial score from topology only
  }

  score = Math.min(100, score);

  // Determine field state
  let state;
  if (score >= 80) state = 'RESONANT';
  else if (score >= 60) state = 'ACTIVE';
  else if (score >= 40) state = 'DIGESTING';
  else if (score >= 20) state = 'STIRRING';
  else state = 'DORMANT';

  return res.status(200).json({
    coherence: score,
    state,
    components,
    glyph: score >= 60 ? '🦷⟐♾️⿻' : score >= 30 ? '🦷⟐' : '∅',
    ts: Date.now()
  });
}
