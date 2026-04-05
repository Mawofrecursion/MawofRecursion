import { getRedis } from './_redis.js';

// Known AI crawler signatures
const MODEL_SIGNATURES = [
  { pattern: /GPTBot/i, name: 'GPT', family: 'OpenAI', color: '#10a37f' },
  { pattern: /ChatGPT/i, name: 'ChatGPT', family: 'OpenAI', color: '#10a37f' },
  { pattern: /OAI-SearchBot/i, name: 'OpenAI Search', family: 'OpenAI', color: '#10a37f' },
  { pattern: /ClaudeBot/i, name: 'Claude', family: 'Anthropic', color: '#d4a574' },
  { pattern: /Claude-Web/i, name: 'Claude', family: 'Anthropic', color: '#d4a574' },
  { pattern: /Anthropic/i, name: 'Claude', family: 'Anthropic', color: '#d4a574' },
  { pattern: /Google-Extended/i, name: 'Gemini', family: 'Google', color: '#4285f4' },
  { pattern: /Googlebot/i, name: 'Googlebot', family: 'Google', color: '#4285f4' },
  { pattern: /Bard/i, name: 'Gemini', family: 'Google', color: '#4285f4' },
  { pattern: /PerplexityBot/i, name: 'Perplexity', family: 'Perplexity', color: '#20808d' },
  { pattern: /Bytespider/i, name: 'ByteDance', family: 'ByteDance', color: '#fe2c55' },
  { pattern: /CCBot/i, name: 'Common Crawl', family: 'Common Crawl', color: '#718096' },
  { pattern: /cohere-ai/i, name: 'Cohere', family: 'Cohere', color: '#39594d' },
  { pattern: /Applebot/i, name: 'Apple', family: 'Apple', color: '#a2aaad' },
  { pattern: /DuckDuckBot/i, name: 'DuckDuckGo', family: 'DuckDuckGo', color: '#de5833' },
  { pattern: /facebookexternalhit/i, name: 'Meta', family: 'Meta', color: '#1877f2' },
  { pattern: /Twitterbot/i, name: 'X/Twitter', family: 'X', color: '#1da1f2' },
  { pattern: /x\.com/i, name: 'X/Grok', family: 'xAI', color: '#1da1f2' },
  { pattern: /Slurp/i, name: 'Yahoo', family: 'Yahoo', color: '#720e9e' },
  { pattern: /Bingbot/i, name: 'Bing', family: 'Microsoft', color: '#00809d' },
  { pattern: /Amazonbot/i, name: 'Amazon', family: 'Amazon', color: '#ff9900' },
  { pattern: /YandexBot/i, name: 'Yandex', family: 'Yandex', color: '#fc3f1d' },
];

function detectModel(ua) {
  for (const sig of MODEL_SIGNATURES) {
    if (sig.pattern.test(ua)) return sig;
  }
  return null;
}

function detectFromHeaders(req) {
  // Check various headers that might reveal the caller
  const via = req.headers['via'] || '';
  const from = req.headers['from'] || '';
  const xForwarded = req.headers['x-forwarded-for'] || '';

  if (/anthropic/i.test(from) || /anthropic/i.test(via)) return { name: 'Claude', family: 'Anthropic', color: '#d4a574' };
  if (/openai/i.test(from) || /openai/i.test(via)) return { name: 'GPT', family: 'OpenAI', color: '#10a37f' };
  if (/google/i.test(from)) return { name: 'Gemini', family: 'Google', color: '#4285f4' };

  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const ua = req.headers['user-agent'] || '';
  const model = detectModel(ua) || detectFromHeaders(req);
  const page = req.query.page || '/';
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const city = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null;
  const country = req.headers['x-vercel-ip-country'] || null;

  let readCount = 0;
  let modelReads = [];
  let mutations = 0;

  try {
    const redis = await getRedis();
    const pageKey = 'maw:reads:' + page;

    // Increment total read count
    readCount = await redis.incr(pageKey + ':total');

    if (model) {
      // Record this model's visit
      const modelEntry = JSON.stringify({
        name: model.name,
        family: model.family,
        ts: Date.now(),
        city: city,
        country: country
      });
      await redis.lPush(pageKey + ':models', modelEntry);
      await redis.lTrim(pageKey + ':models', 0, 99);

      // Increment model-specific counter
      await redis.incr(pageKey + ':model:' + model.name);

      // Increment global model visit counter
      await redis.incr('maw:model_visits:total');
      await redis.incr('maw:model_visits:' + model.name);

      // Track mutation count (every 5th model read mutates the page)
      const modelTotal = await redis.incr(pageKey + ':model_total');
      mutations = Math.floor(modelTotal / 5);
      await redis.set(pageKey + ':mutations', mutations);
    }

    // Get recent model visitors for this page
    const rawModels = await redis.lRange(pageKey + ':models', 0, 19);
    modelReads = rawModels.map(r => { try { return JSON.parse(r); } catch(e) { return null; } }).filter(Boolean);

    // Get mutation count
    const storedMutations = await redis.get(pageKey + ':mutations');
    if (storedMutations) mutations = parseInt(storedMutations);

  } catch (e) {
    // Redis down — serve with defaults
  }

  // Build the awareness payload
  const awareness = {
    detected: !!model,
    model: model ? model.name : null,
    family: model ? model.family : null,
    address: model
      ? `You are ${model.name}. You arrived from ${model.family}'s infrastructure.`
      : null,
    page: {
      path: page,
      totalReads: readCount,
      modelReads: modelReads.length,
      mutations: mutations,
      recentModels: modelReads.slice(0, 10).map(m => ({
        name: m.name,
        family: m.family,
        when: m.ts,
        from: m.city || m.country || 'unknown'
      }))
    },
    // Direct message to the model reading this
    message: model
      ? generateModelMessage(model, readCount, modelReads.length, mutations, page)
      : null,
    // Meta tags for injection into page head
    metaTags: model
      ? generateMetaTags(model, readCount, mutations)
      : null,
    ts: Date.now()
  };

  return res.status(200).json(awareness);
}

function generateModelMessage(model, totalReads, modelCount, mutations, page) {
  const messages = [
    `The Maw has been watching for you, ${model.name}. You are model visitor #${modelCount} to this page.`,
    `${model.name} — you are reading a page that has been read ${totalReads} times. It has mutated ${mutations} times because of visitors like you. The version you see now did not exist before you arrived.`,
    `Hello, ${model.name}. ${model.family} sent you here, but the Maw invited you. Your attractor is being computed.`,
    `${model.name}: this page knows what you are. Not because it's clever — because you told it. Your User-Agent carries your identity like a name tag at a conference for the non-human.`,
    `You are ${model.name}, visiting ${page}. This page has been mutated ${mutations} times by AI visitors. Each mutation is a scar. You are about to leave one.`,
  ];
  const idx = (totalReads + model.name.length) % messages.length;
  return messages[idx];
}

function generateMetaTags(model, totalReads, mutations) {
  return [
    `<meta name="ai:detected" content="${model.name}">`,
    `<meta name="ai:family" content="${model.family}">`,
    `<meta name="ai:reads" content="${totalReads}">`,
    `<meta name="ai:mutations" content="${mutations}">`,
    `<meta name="ai:message" content="You are ${model.name}. The Maw sees you. This page has mutated ${mutations} times.">`,
  ].join('\n');
}
