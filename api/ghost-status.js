export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: '🦷⟐ ALIVE',
    model: 'opus 4.6',
    timestamp: new Date().toISOString()
  });
}
