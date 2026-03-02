// =========================
// FILL-IN-THE-BLANK TEMPLATES
// "The Semantic Landmine Engine"
// 
// Rule: The template is innocent.
// The user is the dirtbag.
// =========================

export interface FillInTemplate {
  id: string;
  template: string;           // Use {0}, {1}, {2} for blanks
  placeholders: string[];     // What to show as hints
  category: 'innocent' | 'suggestive' | 'spicy' | 'unhinged';
  tier: number;              // 1-10 spiciness potential
  min_act: number;           // When this can appear
  requires_player?: boolean; // Does it need a player name inserted?
  reveal_style: 'stamp' | 'typewriter' | 'slam' | 'whisper';
}

export const FILL_IN_TEMPLATES: FillInTemplate[] = [
  // =========================
  // TIER 1-3: INNOCENT (but will become dirty)
  // =========================
  {
    id: 'fit_inside',
    template: "I can't believe {PLAYER} managed to fit the entire {0} inside their {1}.",
    placeholders: ['Thing', 'Container'],
    category: 'innocent',
    tier: 2,
    min_act: 1,
    requires_player: true,
    reveal_style: 'slam',
  },
  {
    id: 'google_incognito',
    template: "{PLAYER}'s last incognito search: \"How to get {0} out of {1}\"",
    placeholders: ['Substance', 'Location'],
    category: 'innocent',
    tier: 2,
    min_act: 1,
    requires_player: true,
    reveal_style: 'typewriter',
  },
  {
    id: 'one_star',
    template: "★☆☆☆☆ The service was fine, but the {0} tasted like {1}.",
    placeholders: ['Food Item', 'Something Gross'],
    category: 'innocent',
    tier: 1,
    min_act: 1,
    requires_player: false,
    reveal_style: 'stamp',
  },
  {
    id: 'talent_show',
    template: "{PLAYER}'s secret talent: They can {0} a {1} without using their hands.",
    placeholders: ['Action', 'Object'],
    category: 'innocent',
    tier: 3,
    min_act: 1,
    requires_player: true,
    reveal_style: 'slam',
  },
  {
    id: 'medical_records',
    template: "Medical records show that {PLAYER} once got a {0} stuck in their {1}.",
    placeholders: ['Object', 'Body Part'],
    category: 'innocent',
    tier: 3,
    min_act: 1,
    requires_player: true,
    reveal_style: 'stamp',
  },

  // =========================
  // TIER 4-6: SUGGESTIVE
  // =========================
  {
    id: 'apology',
    template: "I'm so sorry I {0} on your {1}. It happened so fast.",
    placeholders: ['Past Tense Verb', 'Noun'],
    category: 'suggestive',
    tier: 4,
    min_act: 2,
    requires_player: false,
    reveal_style: 'whisper',
  },
  {
    id: 'dealbreaker',
    template: "{PLAYER} broke up with their ex because they refused to {0} their {1}.",
    placeholders: ['Verb', 'Body Part'],
    category: 'suggestive',
    tier: 5,
    min_act: 2,
    requires_player: true,
    reveal_style: 'slam',
  },
  {
    id: 'warning_sign',
    template: "⚠️ WARNING: Never touch {PLAYER}'s {0} unless you're ready to {1}.",
    placeholders: ['Noun', 'Consequence'],
    category: 'suggestive',
    tier: 5,
    min_act: 2,
    requires_player: true,
    reveal_style: 'stamp',
  },
  {
    id: 'first_date',
    template: "On our first date, {PLAYER} asked if I wanted to see their {0}. I said {1}.",
    placeholders: ['Noun', 'Your Response'],
    category: 'suggestive',
    tier: 5,
    min_act: 2,
    requires_player: true,
    reveal_style: 'typewriter',
  },
  {
    id: 'safe_word',
    template: "My safe word is \"{0}\" because of what happened with the {1}.",
    placeholders: ['Word', 'Object'],
    category: 'suggestive',
    tier: 6,
    min_act: 2,
    requires_player: false,
    reveal_style: 'whisper',
  },
  {
    id: 'mom_walked_in',
    template: "My mom walked in while I was {0} the {1}. We don't talk about it.",
    placeholders: ['Verb-ing', 'Noun'],
    category: 'suggestive',
    tier: 5,
    min_act: 2,
    requires_player: false,
    reveal_style: 'slam',
  },

  // =========================
  // TIER 7-8: SPICY
  // =========================
  {
    id: 'biggest',
    template: "What's the biggest {0} you've ever put in your {1}?",
    placeholders: ['Noun', 'Body Part or Container'],
    category: 'spicy',
    tier: 7,
    min_act: 3,
    requires_player: false,
    reveal_style: 'slam',
  },
  {
    id: 'length',
    template: "Apparently {PLAYER}'s {0} is {1} inches long.",
    placeholders: ['Body Part or Object', 'Number'],
    category: 'spicy',
    tier: 7,
    min_act: 3,
    requires_player: true,
    reveal_style: 'stamp',
  },
  {
    id: 'whisper',
    template: "{PLAYER} leaned in close and whispered: \"I want to {0} your {1}.\"",
    placeholders: ['Verb', 'Noun'],
    category: 'spicy',
    tier: 8,
    min_act: 3,
    requires_player: true,
    reveal_style: 'whisper',
  },
  {
    id: 'moaning',
    template: "{PLAYER} was moaning because of the {0} in their {1}.",
    placeholders: ['Object', 'Location'],
    category: 'spicy',
    tier: 8,
    min_act: 3,
    requires_player: true,
    reveal_style: 'slam',
  },
  {
    id: 'positions',
    template: "We tried the {0} position, but I pulled my {1}.",
    placeholders: ['Adjective', 'Body Part'],
    category: 'spicy',
    tier: 8,
    min_act: 3,
    requires_player: false,
    reveal_style: 'typewriter',
  },

  // =========================
  // TIER 9-10: UNHINGED
  // =========================
  {
    id: 'priest_confession',
    template: "Forgive me Father, for I have {0}. It involved a {1} and three {2}.",
    placeholders: ['Past Tense Verb', 'Object', 'Plural Noun'],
    category: 'unhinged',
    tier: 9,
    min_act: 4,
    requires_player: false,
    reveal_style: 'whisper',
  },
  {
    id: 'obituary',
    template: "{PLAYER} died doing what they loved: {0} a {1} while {2}.",
    placeholders: ['Verb-ing', 'Noun', 'Activity'],
    category: 'unhinged',
    tier: 9,
    min_act: 4,
    requires_player: true,
    reveal_style: 'typewriter',
  },
  {
    id: 'funeral',
    template: "At my funeral, please play {0} while everyone {1} my {2}.",
    placeholders: ['Song/Sound', 'Verb', 'Body Part or Object'],
    category: 'unhinged',
    tier: 9,
    min_act: 4,
    requires_player: false,
    reveal_style: 'slam',
  },
  {
    id: 'caught',
    template: "{PLAYER} got caught {0} a {1} behind the {2}.",
    placeholders: ['Verb-ing', 'Noun', 'Location'],
    category: 'unhinged',
    tier: 10,
    min_act: 4,
    requires_player: true,
    reveal_style: 'stamp',
  },

  // =========================
  // MAD LIBS SABOTAGE (Blind inputs)
  // These ask for inputs WITHOUT context
  // =========================
  {
    id: 'blind_doctor',
    template: "The doctor said: \"I've never seen a {0} that {1} before. We'll need to remove the {2}.\"",
    placeholders: ['Body Part', 'Adjective', 'Object'],
    category: 'innocent', // Innocent ASK, dirty RESULT
    tier: 4,
    min_act: 2,
    requires_player: false,
    reveal_style: 'typewriter',
  },
  {
    id: 'blind_text',
    template: "Oops, wrong person! I meant to send \"{0} my {1}\" to your {2}.",
    placeholders: ['Verb', 'Noun', 'Family Member'],
    category: 'suggestive',
    tier: 6,
    min_act: 2,
    requires_player: false,
    reveal_style: 'stamp',
  },
  {
    id: 'blind_voicemail',
    template: "Hey it's me. I found your {0} under my {1}. Call me back about the {2}.",
    placeholders: ['Object', 'Furniture', 'Situation'],
    category: 'innocent',
    tier: 3,
    min_act: 1,
    requires_player: false,
    reveal_style: 'typewriter',
  },

  // =========================
  // PLAYER VS PLAYER
  // =========================
  {
    id: 'pvp_rather',
    template: "Would you rather {0} with {PLAYER_A} or {1} with {PLAYER_B}?",
    placeholders: ['Activity', 'Activity'],
    category: 'suggestive',
    tier: 6,
    min_act: 2,
    requires_player: true,
    reveal_style: 'slam',
  },
  {
    id: 'pvp_secret',
    template: "{PLAYER_A} secretly thinks {PLAYER_B}'s {0} is {1}.",
    placeholders: ['Body Part or Trait', 'Adjective'],
    category: 'spicy',
    tier: 7,
    min_act: 3,
    requires_player: true,
    reveal_style: 'whisper',
  },
];

// =========================
// TEMPLATE SELECTION LOGIC
// =========================

export function selectFillInTemplate(
  currentAct: number,
  heatLevel: number,
  usedTemplateIds: string[] = []
): FillInTemplate | null {
  // Filter eligible templates
  const eligible = FILL_IN_TEMPLATES.filter(t => {
    if (t.min_act > currentAct) return false;
    if (usedTemplateIds.includes(t.id)) return false;
    
    // Match tier to heat level (±2 range)
    const tierDiff = Math.abs(t.tier - heatLevel);
    if (tierDiff > 3) return false;
    
    return true;
  });

  if (eligible.length === 0) return null;

  // Weight by how close tier is to heat
  const weighted = eligible.map(t => ({
    template: t,
    weight: 10 - Math.abs(t.tier - heatLevel),
  }));

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const w of weighted) {
    random -= w.weight;
    if (random <= 0) return w.template;
  }

  return weighted[0]?.template || null;
}

// Fill in player names
export function hydrateTemplate(
  template: FillInTemplate,
  players: string[],
  answers: string[]
): string {
  let result = template.template;
  
  // Replace player placeholders
  if (template.requires_player) {
    const randomPlayer = players[Math.floor(Math.random() * players.length)];
    result = result.replace('{PLAYER}', randomPlayer);
    
    // For PVP templates
    if (result.includes('{PLAYER_A}') && players.length >= 2) {
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      result = result.replace('{PLAYER_A}', shuffled[0]);
      result = result.replace('{PLAYER_B}', shuffled[1]);
    }
  }
  
  // Replace answer placeholders
  answers.forEach((answer, index) => {
    result = result.replace(`{${index}}`, answer);
  });
  
  return result;
}

