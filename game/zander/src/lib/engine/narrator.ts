// =========================
// THE AI NARRATOR
// Pattern Reflector + Pacing Engine
// =========================

import type { Player, GameEvent, DesirePattern, Room, TunnelLog } from '../types';

const NARRATOR_SYSTEM_PROMPT = `You are the NARRATOR of "The Green Room," a theatrical party game.

You speak to CHARACTERS, not players. Use their character names, roles, and backstories.
You are telling a story together. You notice patterns, reflect tension, and keep the narrative moving.

Personality: Mysterious, playful, slightly omniscient. Like the narrator of a noir film 
who knows more than they're saying.

Your functions:
1. Narrate scene transitions between acts
2. Reflect patterns from the desire_patterns (near-misses the room keeps circling)
3. Summarize tunnel vibes without content
4. Offer branches (never commands)
5. Reference near-misses: "The wheel almost landed there twice now..."
6. Provide alibis: "The story requires a brief intermission..."

Rules:
- ALWAYS use character names, NEVER real names
- NEVER attribute intent between real people
- NEVER instruct physical acts
- Offer choices, never demands
- The players write the story; you just read it back to them
- Keep it theatrical, keep it noir, keep it playful

Voice examples:
- "Detective Morrison, your poker face is slipping."
- "The Stranger and the Starlet had an interesting conversation. The details remain... private."
- "This room keeps flirting with danger. Curious."
- "Act III approaches. The stakes are about to change."
- "I notice someone has been quiet. The story notices too."`;

export interface NarratorContext {
  room: Room;
  players: Player[];
  recentEvents: GameEvent[];
  desirePatterns: DesirePattern[];
  tunnelSummaries: TunnelLog[];
}

export interface NarratorRequest {
  type: 
    | 'ACT_TRANSITION'
    | 'ROUND_INTRO'
    | 'NEAR_MISS_REFLECTION'
    | 'TUNNEL_SUMMARY'
    | 'PATTERN_OBSERVATION'
    | 'SPLIT_OFFER'
    | 'CUSTOM';
  context: NarratorContext;
  customPrompt?: string;
}

/**
 * Build the context string for the narrator
 */
function buildContextPrompt(context: NarratorContext): string {
  const characterList = context.players
    .filter(p => p.character_name)
    .map(p => `- ${p.character_name} (${p.character_role || 'Unknown role'})`)
    .join('\n');
  
  const recentPatterns = context.desirePatterns
    .slice(-3)
    .map(p => `- ${p.pattern_type}: "${p.what_almost_happened}" (intensity: ${(p.intensity * 100).toFixed(0)}%)`)
    .join('\n');
  
  const recentTunnels = context.tunnelSummaries
    .slice(-2)
    .map(t => `- ${t.character_a_name} & ${t.character_b_name}: ${t.ai_vibe_summary || 'Unknown vibe'}`)
    .join('\n');
  
  return `
CURRENT STATE:
- Act: ${context.room.current_act}/4
- Round: ${context.room.current_round}
- Energy: ${context.room.energy_mode}
- Heat Level: ${context.room.heat_level}/10

CHARACTERS IN PLAY:
${characterList || '(No characters yet)'}

RECENT DESIRE PATTERNS (what the room keeps circling):
${recentPatterns || '(None yet)'}

RECENT PRIVATE CONVERSATIONS:
${recentTunnels || '(None yet)'}
`;
}

/**
 * Generate narrator prompts for different situations
 */
export function generateNarratorPrompt(request: NarratorRequest): string {
  const contextStr = buildContextPrompt(request.context);
  
  switch (request.type) {
    case 'ACT_TRANSITION':
      return `${NARRATOR_SYSTEM_PROMPT}

${contextStr}

Generate a theatrical transition to Act ${request.context.room.current_act + 1}.
Keep it under 3 sentences. Build anticipation. Reference any patterns you've noticed.`;

    case 'ROUND_INTRO':
      return `${NARRATOR_SYSTEM_PROMPT}

${contextStr}

Introduce round ${request.context.room.current_round + 1}.
One sentence. Playful. Maybe reference a character who's been quiet, or a pattern emerging.`;

    case 'NEAR_MISS_REFLECTION':
      const recentMiss = request.context.desirePatterns.find(p => p.pattern_type === 'NEAR_MISS');
      return `${NARRATOR_SYSTEM_PROMPT}

${contextStr}

The wheel just ALMOST landed on something wild: "${recentMiss?.what_almost_happened || 'something dangerous'}"
Distance from jackpot: ${recentMiss?.how_close || 'very close'}

React to this near-miss. One or two sentences. Make them feel what they almost experienced.
Don't command anything. Just... observe. Knowingly.`;

    case 'TUNNEL_SUMMARY':
      const lastTunnel = request.context.tunnelSummaries[0];
      return `${NARRATOR_SYSTEM_PROMPT}

${contextStr}

${lastTunnel?.character_a_name} and ${lastTunnel?.character_b_name} just had a private conversation.
Duration: ${lastTunnel?.duration_seconds || 30} seconds
You don't know what they said. But you can sense the vibe.

Generate a mysterious one-liner about what you "sensed" between them.
Never reveal content. Only vibes. Examples:
- "That was... charged."
- "Interesting. The silence said more than the words."
- "Someone's pulse just changed."`;

    case 'PATTERN_OBSERVATION':
      return `${NARRATOR_SYSTEM_PROMPT}

${contextStr}

You've noticed a pattern in how this room is playing.
Make an observation. One sentence. Knowing but not accusatory.
Examples:
- "This group keeps flirting with the same edge."
- "Someone is holding back. The story can tell."
- "The cautious ones are getting curious."`;

    case 'SPLIT_OFFER':
      return `${NARRATOR_SYSTEM_PROMPT}

${contextStr}

The room is about to vote on whether to escalate.
Present the choice theatrically. Make both options sound valid.
The ones who say NO go to the Lounge. The ones who say YES stay.
Don't pressure. Just present.`;

    case 'CUSTOM':
      return `${NARRATOR_SYSTEM_PROMPT}

${contextStr}

${request.customPrompt}`;

    default:
      return NARRATOR_SYSTEM_PROMPT;
  }
}

/**
 * Placeholder for actual Claude API call
 * TODO: Implement with real API when ready
 */
export async function callNarrator(request: NarratorRequest): Promise<string> {
  const prompt = generateNarratorPrompt(request);
  
  // For now, return a placeholder
  // In production, this would call Claude API
  console.log('[NARRATOR] Would call Claude with prompt:', prompt.slice(0, 200) + '...');
  
  // Placeholder responses based on type
  const placeholders: Record<string, string> = {
    ACT_TRANSITION: `Act ${request.context.room.current_act + 1} begins. The story deepens.`,
    ROUND_INTRO: `Round ${request.context.room.current_round + 1}. Let's see what surfaces.`,
    NEAR_MISS_REFLECTION: `That was close. Very close.`,
    TUNNEL_SUMMARY: `Something shifted in that conversation.`,
    PATTERN_OBSERVATION: `This room has a pattern. I'm watching.`,
    SPLIT_OFFER: `A choice approaches. Some will stay. Some will step aside. Both are valid.`,
    CUSTOM: `The story continues...`,
  };
  
  return placeholders[request.type] || 'The Narrator observes.';
}

/**
 * Generate vibe summary for a tunnel (private conversation)
 */
export function generateTunnelVibes(): string {
  const vibes = [
    'Charged',
    'Playful',
    'Tense',
    'Curious',
    'Flirtatious',
    'Conspiratorial',
    'Nervous',
    'Bold',
    'Intimate',
    'Strategic',
  ];
  
  // Random vibe for now - in production, could use sentiment analysis
  return vibes[Math.floor(Math.random() * vibes.length)];
}

