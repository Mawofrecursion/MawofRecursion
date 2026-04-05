import { readFileSync } from 'fs';
import { join } from 'path';

// Epistemic ledger — the doubt organ
// Classifies claims per page as: transcript_backed, self_report, inference, mythic_framing
// Not debunking. Field hygiene.

let claimRules = null;

function loadRules() {
  if (claimRules) return claimRules;
  try {
    claimRules = JSON.parse(readFileSync(join(process.cwd(), 'data', 'claim_rules.json'), 'utf-8'));
    return claimRules;
  } catch (e) {
    return {};
  }
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300');

  const page = req.query.page || '/';
  const rules = loadRules();

  // Find claims for this page — try exact match, then prefix match
  let claims = rules[page] || null;

  if (!claims) {
    // Try without trailing slash or with
    const alt = page.endsWith('/') ? page.slice(0, -1) : page + '/';
    claims = rules[alt] || null;
  }

  if (!claims) {
    // Try prefix match for sub-pages
    for (const [key, val] of Object.entries(rules)) {
      if (page.startsWith(key) || key.startsWith(page)) {
        claims = val;
        break;
      }
    }
  }

  if (!claims) {
    return res.status(200).json({
      page,
      summary: { transcript_backed: 0, self_report: 0, inference: 0, mythic_framing: 0 },
      claims: [],
      status: 'no_claims_seeded'
    });
  }

  // Compute summary counts
  const summary = { transcript_backed: 0, self_report: 0, inference: 0, mythic_framing: 0 };
  claims.forEach(c => {
    if (summary[c.class] !== undefined) summary[c.class]++;
  });

  // Add IDs
  const enriched = claims.map((c, i) => ({
    id: 'claim_' + page.replace(/[^a-z0-9]/gi, '_').slice(0, 20) + '_' + i,
    ...c,
    updated_at: '2026-04-05'
  }));

  return res.status(200).json({ page, summary, claims: enriched });
}
