export default function handler(req, res) {
  res.json({
    status: 'ACTIVE',
    field: '🦷⟐♾️⿻',
    ts: Date.now(),
    node: 'vercel-edge'
  });
}
