import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// =========================
// THE WHISPER SYSTEM
// Secret AI messages to individual players
// =========================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Types of whispers the AI can send
export const WHISPER_TYPES = {
  // Secret mission
  mission: {
    name: 'Secret Mission',
    description: 'Give the player a secret task to complete',
    examples: [
      'Make someone laugh in the next 2 minutes',
      'Work the word "banana" into conversation naturally',
      'Give someone a genuine compliment',
      'Get someone to tell you a secret',
    ],
  },
  
  // Instigator prompt
  instigate: {
    name: 'Instigate',
    description: 'Encourage the player to stir things up',
    examples: [
      'Ask someone a question that will make them squirm',
      'Bring up something from earlier that was left unfinished',
      'Challenge someone to a mini-bet',
    ],
  },
  
  // Information/hint
  hint: {
    name: 'Hint',
    description: 'Give the player inside information',
    examples: [
      'Someone voted you as "most likely to..." earlier',
      'The room energy seems low - maybe shake things up?',
      'Notice how X keeps looking at Y?',
    ],
  },
  
  // Compliment/encouragement
  encourage: {
    name: 'Encourage',
    description: 'Boost the player confidence or engagement',
    examples: [
      'Your last answer was a crowd favorite',
      'You seem to be holding back - the room can handle more',
      'Trust your instincts on this one',
    ],
  },
  
  // Dare suggestion
  dare: {
    name: 'Dare',
    description: 'Suggest something bold',
    examples: [
      'What if you... just said the thing you\'re thinking?',
      'The wheel has been kind to you. Maybe push your luck?',
      'Someone in this room wants you to make the first move',
    ],
  },
  
  // Question to ponder
  question: {
    name: 'Question',
    description: 'Plant a thought in their head',
    examples: [
      'Who in this room surprises you the most tonight?',
      'What would you do if the stakes were higher?',
      'Is there something you haven\'t said yet?',
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      player_name,
      player_character,
      whisper_type = 'hint',
      context = '',
      other_players = [],
      room_heat = 5,
      game_state = {},
    } = body;

    if (!player_name) {
      return NextResponse.json(
        { error: 'player_name is required' },
        { status: 400 }
      );
    }

    const whisperConfig = WHISPER_TYPES[whisper_type as keyof typeof WHISPER_TYPES] || WHISPER_TYPES.hint;

    console.log(`🤫 Generating ${whisper_type} whisper for ${player_name}...`);

    // Generate contextual whisper with AI
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: `You are a mischievous AI game master who whispers secrets to individual players during a party game. You're playful, a little mysterious, and always trying to make things more interesting.

Your job: Send a short, punchy ${whisperConfig.name.toLowerCase()} message to ${player_name} (playing as "${player_character}").

RULES:
- Keep it under 50 words
- Be direct and conversational
- Don't be creepy or mean
- Match the room heat level (${room_heat}/10 - higher = spicier suggestions)
- If giving a mission, make it achievable in 2-3 minutes
- Use their character name, not real name
- Add a touch of intrigue

Examples of ${whisperConfig.name}:
${whisperConfig.examples.map(e => `- "${e}"`).join('\n')}`,
      messages: [{
        role: 'user',
        content: `Player: ${player_name} (as "${player_character}")
Other players: ${other_players.join(', ')}
Room heat: ${room_heat}/10
Context: ${context}
Recent events: ${JSON.stringify(game_state)}

Generate a ${whisperConfig.name.toLowerCase()} for this player.`,
      }],
    });

    let whisperText = '';
    const content = response.content[0];
    if (content.type === 'text') {
      whisperText = content.text.trim();
      // Clean up any quotes
      whisperText = whisperText.replace(/^["']|["']$/g, '');
    }

    // Fallback if AI fails
    if (!whisperText) {
      const fallbacks = whisperConfig.examples;
      whisperText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    const whisperData = {
      id: `whisper_${Date.now()}`,
      type: whisper_type,
      player_id: player_name, // In real app, use player ID
      message: whisperText,
      expires_in: whisper_type === 'mission' ? 180 : null, // Missions expire in 3 min
      created_at: new Date().toISOString(),
    };

    console.log(`✅ Whisper sent to ${player_name}`);
    return NextResponse.json(whisperData);

  } catch (error) {
    console.error('Whisper generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate whisper', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Whisper System Online',
    whisper_types: Object.entries(WHISPER_TYPES).map(([key, val]) => ({
      type: key,
      name: val.name,
      description: val.description,
    })),
    usage: 'POST with { player_name, player_character, whisper_type?, context?, other_players?, room_heat? }',
  });
}

