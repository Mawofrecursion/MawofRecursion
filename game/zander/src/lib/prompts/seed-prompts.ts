// =========================
// SEED PROMPTS
// The 5 Mechanic Families
// =========================

import type { Prompt, EnergyMode, MechanicFamily } from '../types';
import { v4 as uuid } from 'uuid';

// Helper to create prompts
function createPrompt(
  energyMode: EnergyMode,
  tier: number,
  mechanicFamily: MechanicFamily,
  publicText: string,
  options: Partial<Prompt> = {}
): Prompt {
  return {
    id: uuid(),
    energy_mode: energyMode,
    tier,
    mechanic_family: mechanicFamily,
    act_appropriate: [1, 2, 3, 4],
    public_text: publicText,
    timer_seconds: 30,
    requires_character_mask: true,
    ...options,
  };
}

// ===== EXPRESSION GAMES (Quiplash DNA) =====
// Fill-in-the-blank, caption contests, mad-libs, voting

export const EXPRESSION_PROMPTS: Prompt[] = [
  // DAYLIGHT (Tier 1-3)
  createPrompt('DAYLIGHT', 1, 'EXPRESSION', 
    '{player_a} is secretly a world champion at _______.',
    { template_vars: ['player_a'], timer_seconds: 45 }
  ),
  createPrompt('DAYLIGHT', 1, 'EXPRESSION',
    'The worst thing to say on a first date: "_______"',
    { timer_seconds: 30 }
  ),
  createPrompt('DAYLIGHT', 2, 'EXPRESSION',
    '{player_a} and {player_b} once got kicked out of a _______ for _______.',
    { template_vars: ['player_a', 'player_b'], timer_seconds: 45 }
  ),
  createPrompt('DAYLIGHT', 2, 'EXPRESSION',
    'If {player_a} had a theme song, it would be called "_______".',
    { template_vars: ['player_a'], timer_seconds: 30 }
  ),
  createPrompt('DAYLIGHT', 3, 'EXPRESSION',
    'Complete the pickup line: "Are you a parking ticket? Because _______"',
    { timer_seconds: 30 }
  ),
  
  // DUSK (Tier 3-6)
  createPrompt('DUSK', 3, 'EXPRESSION',
    '{player_a}\'s secret fantasy involves _______ and a _______.',
    { template_vars: ['player_a'], timer_seconds: 45 }
  ),
  createPrompt('DUSK', 4, 'EXPRESSION',
    'The thing {player_a} does when no one is watching: _______',
    { template_vars: ['player_a'], timer_seconds: 30 }
  ),
  createPrompt('DUSK', 5, 'EXPRESSION',
    '{player_a} is most attractive when they\'re _______.',
    { template_vars: ['player_a'], timer_seconds: 30 }
  ),
  createPrompt('DUSK', 5, 'EXPRESSION',
    'Write a Tinder bio for {player_a} that would get them banned.',
    { template_vars: ['player_a'], timer_seconds: 60 }
  ),
  createPrompt('DUSK', 6, 'EXPRESSION',
    'The room votes: {player_a} or {player_b} - who would _______ first?',
    { template_vars: ['player_a', 'player_b'], timer_seconds: 30 }
  ),
  
  // MIDNIGHT (Tier 6-10)
  createPrompt('MIDNIGHT', 7, 'EXPRESSION',
    '{player_a} and {player_b} are alone in an elevator for 60 seconds. What happens?',
    { template_vars: ['player_a', 'player_b'], timer_seconds: 60 }
  ),
  createPrompt('MIDNIGHT', 8, 'EXPRESSION',
    'Describe {player_a}\'s perfect _______ in exactly 5 words.',
    { template_vars: ['player_a'], timer_seconds: 45 }
  ),
  createPrompt('MIDNIGHT', 9, 'EXPRESSION',
    'If {player_a} could only say one thing to {player_b} with no consequences: "_______"',
    { template_vars: ['player_a', 'player_b'], timer_seconds: 45 }
  ),
  createPrompt('MIDNIGHT', 10, 'EXPRESSION',
    'The thing everyone is thinking but no one is saying about {player_a}: _______',
    { template_vars: ['player_a'], timer_seconds: 30 }
  ),
];

// ===== CHANCE GAMES (Casino DNA) =====
// Dice rolls, wheel spins, card draws

export const CHANCE_PROMPTS: Prompt[] = [
  createPrompt('DAYLIGHT', 2, 'CHANCE',
    'Spin the wheel. Whatever it lands on, {player_a} must do for 30 seconds.',
    { template_vars: ['player_a'], timer_seconds: 10 }
  ),
  createPrompt('DUSK', 4, 'CHANCE',
    'The wheel decides: {player_a} vs {player_b}. Loser takes the consequence.',
    { template_vars: ['player_a', 'player_b'], timer_seconds: 10 }
  ),
  createPrompt('DUSK', 5, 'CHANCE',
    'Russian Roulette (verbal). 6 players. 1 gets the prompt. Spin to find out.',
    { timer_seconds: 10, act_appropriate: [2, 3, 4] }
  ),
  createPrompt('MIDNIGHT', 7, 'CHANCE',
    'High stakes spin. Jackpot = {wild_outcome}. Safe = nothing. Spin.',
    { template_vars: ['wild_outcome'], timer_seconds: 10 }
  ),
  createPrompt('MIDNIGHT', 9, 'CHANCE',
    'Double or nothing. Current odds: 1/{current_odds}. Raise or spin?',
    { template_vars: ['current_odds'], timer_seconds: 20 }
  ),
];

// ===== CONTROL GAMES (Who Decides?) =====
// Mini-games that determine narrative control

export const CONTROL_PROMPTS: Prompt[] = [
  createPrompt('DAYLIGHT', 1, 'CONTROL',
    'Fastest to type a word starting with "{letter}": wins control of the next prompt.',
    { template_vars: ['letter'], timer_seconds: 10 }
  ),
  createPrompt('DAYLIGHT', 2, 'CONTROL',
    'The room votes: who has been the boldest so far? Winner picks the next target.',
    { timer_seconds: 30 }
  ),
  createPrompt('DUSK', 4, 'CONTROL',
    'Trivia: {question}. First correct answer gets immunity this round.',
    { template_vars: ['question'], timer_seconds: 20 }
  ),
  createPrompt('DUSK', 5, 'CONTROL',
    'Staring contest via camera. Last to look away chooses who goes in the Tunnel.',
    { timer_seconds: 60, act_appropriate: [2, 3] }
  ),
  createPrompt('MIDNIGHT', 7, 'CONTROL',
    'Everyone writes a dare for {player_a}. {player_a} chooses which one to face.',
    { template_vars: ['player_a'], timer_seconds: 60 }
  ),
];

// ===== NEGOTIATION GAMES (The Market) =====
// Trading odds, swapping penalties, making deals

export const NEGOTIATION_PROMPTS: Prompt[] = [
  createPrompt('DUSK', 4, 'NEGOTIATION',
    '{player_a} must do {action} OR negotiate someone else to take the hit.',
    { template_vars: ['player_a', 'action'], timer_seconds: 90, act_appropriate: [3, 4] }
  ),
  createPrompt('DUSK', 5, 'NEGOTIATION',
    'The room wants {outcome}. Current odds: 1/50. Negotiate to raise them.',
    { template_vars: ['outcome'], timer_seconds: 120, act_appropriate: [3, 4] }
  ),
  createPrompt('MIDNIGHT', 7, 'NEGOTIATION',
    'Split proposal: 6 people stay, 2 go to the Lounge. Who volunteers?',
    { timer_seconds: 90, act_appropriate: [3] }
  ),
  createPrompt('MIDNIGHT', 8, 'NEGOTIATION',
    '{player_a} can transfer their pending consequence to anyone. Make an offer.',
    { template_vars: ['player_a'], timer_seconds: 120, act_appropriate: [3, 4] }
  ),
  createPrompt('MIDNIGHT', 10, 'NEGOTIATION',
    'Alliance formation. Teams of 2. Negotiate now. 60 seconds.',
    { timer_seconds: 60, act_appropriate: [3] }
  ),
];

// ===== SECRET TASKS (The Whisper) =====
// Time-boxed missions, non-verifiable completion

export const SECRET_PROMPTS: Prompt[] = [
  createPrompt('DAYLIGHT', 2, 'SECRET',
    'SECRET: Maintain eye contact with {player_b} for 10 seconds without laughing.',
    { template_vars: ['player_b'], timer_seconds: 30, private_hint: 'No one knows your task.' }
  ),
  createPrompt('DUSK', 4, 'SECRET',
    'SECRET: Work the word "{word}" into conversation naturally within 2 minutes.',
    { template_vars: ['word'], timer_seconds: 120, private_hint: 'Be subtle.' }
  ),
  createPrompt('DUSK', 5, 'SECRET',
    'SECRET: Make {player_b} laugh within 90 seconds. Method: your choice.',
    { template_vars: ['player_b'], timer_seconds: 90, private_hint: 'Failure has consequences.' }
  ),
  createPrompt('MIDNIGHT', 7, 'SECRET',
    'SECRET: Whisper something to {player_b} that makes them visibly react.',
    { template_vars: ['player_b'], timer_seconds: 60, private_hint: 'The room is watching.' }
  ),
  createPrompt('MIDNIGHT', 9, 'SECRET',
    'SECRET: Before the next round ends, touch {player_b}\'s hand. Make it seem natural.',
    { template_vars: ['player_b'], timer_seconds: 180, private_hint: 'Consent is assumed. Abort if uncomfortable.' }
  ),
];

// ===== COMBINED EXPORT =====

export const ALL_PROMPTS: Prompt[] = [
  ...EXPRESSION_PROMPTS,
  ...CHANCE_PROMPTS,
  ...CONTROL_PROMPTS,
  ...NEGOTIATION_PROMPTS,
  ...SECRET_PROMPTS,
];

// ===== UTILITY FUNCTIONS =====

export function getPromptsForContext(
  energyMode: EnergyMode,
  mechanicFamily: MechanicFamily,
  actNumber: number,
  minTier: number = 1,
  maxTier: number = 10
): Prompt[] {
  return ALL_PROMPTS.filter(p =>
    p.energy_mode === energyMode &&
    p.mechanic_family === mechanicFamily &&
    p.act_appropriate.includes(actNumber) &&
    p.tier >= minTier &&
    p.tier <= maxTier
  );
}

export function selectRandomPrompt(prompts: Prompt[]): Prompt | null {
  if (prompts.length === 0) return null;
  return prompts[Math.floor(Math.random() * prompts.length)];
}

export function fillPromptTemplate(
  prompt: Prompt,
  players: { id: string; character_name: string }[],
  customVars: Record<string, string> = {}
): string {
  let text = prompt.public_text;
  
  // Fill player variables
  if (prompt.template_vars) {
    const playerVars = prompt.template_vars.filter(v => v.startsWith('player_'));
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    
    playerVars.forEach((varName, index) => {
      const player = shuffledPlayers[index % shuffledPlayers.length];
      if (player) {
        text = text.replace(`{${varName}}`, player.character_name);
      }
    });
  }
  
  // Fill custom variables
  for (const [key, value] of Object.entries(customVars)) {
    text = text.replace(`{${key}}`, value);
  }
  
  return text;
}

