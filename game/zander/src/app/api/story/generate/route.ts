import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// =========================
// THE PREMIUM STORY ENGINE
// "Audio Erotica" / "The Cutscene"
// Cost: ~$0.50-2.00 per scene (worth it)
// =========================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Romance tropes for variety
const TROPES = {
  'enemies_to_lovers': 'They despise each other. But the tension says otherwise.',
  'one_bed': 'There\'s only one bed. Neither will admit they want the same thing.',
  'secret_meeting': 'They shouldn\'t be here. They both know it. Neither leaves.',
  'almost_kiss': 'Their lips are inches apart. Something interrupts. The moment shatters.',
  'trapped_together': 'The door won\'t open. The walls feel smaller. So does the distance.',
  'forbidden': 'Everyone would disapprove. That makes it harder to resist.',
  'confession': 'The truth spills out. The silence that follows is deafening.',
  'jealousy': 'Watching them with someone else is unbearable. The mask is slipping.',
  'reunion': 'Years apart. One look and it all comes flooding back.',
  'power_play': 'One has control. The other wants to take it. Or give it.',
};

const GENRES = {
  'noir': 'Dark, smoky, 1940s detective noir. Rain on windows, shadows, whiskey.',
  'regency': 'Period romance. Ballrooms, stolen glances, forbidden touches through gloves.',
  'modern': 'Contemporary. Luxury apartments, city lights, expensive taste.',
  'gothic': 'Dark mansion, candlelight, secrets in the walls, dangerous beauty.',
  'cyberpunk': 'Neon-soaked, rain-slicked streets, chrome and flesh, dangerous liaisons.',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      character_a,
      character_b,
      trope = 'almost_kiss',
      genre = 'noir',
      intensity = 7, // 1-10
      room_id,
    } = body;

    // Validate
    if (!character_a || !character_b) {
      return NextResponse.json(
        { error: 'character_a and character_b are required' },
        { status: 400 }
      );
    }

    const tropeDescription = TROPES[trope as keyof typeof TROPES] || TROPES.almost_kiss;
    const genreDescription = GENRES[genre as keyof typeof GENRES] || GENRES.noir;

    // =========================
    // STEP 1: THE SCRIPT (Claude)
    // =========================
    console.log('📝 Generating story script...');
    
    const scriptResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are an award-winning romance novelist known for tension, longing, and sensory details.

RULES:
- Write EXACTLY 120-150 words. No more.
- Focus on the ALMOST. The tension. The space between them closing.
- Use sensory language: breath, heat, proximity, the electricity in the air.
- Do NOT use explicit anatomical terms or describe sex acts.
- Do NOT use clichés like "electricity" or "butterflies."
- Make it feel REAL. Specific details. The way fabric shifts. The sound of a breath catching.
- End on a moment of peak tension - interrupted or suspended.
- The reader should ACHE for what doesn't happen.

GENRE: ${genreDescription}
TROPE: ${tropeDescription}
INTENSITY: ${intensity}/10 (higher = more charged, but still tasteful)

Return JSON only:
{
  "text": "The story text here...",
  "visual_prompt": "A detailed prompt for DALL-E to generate the SETTING (not the people). Include lighting, mood, atmosphere. Cinematic quality."
}`,
      messages: [
        {
          role: 'user',
          content: `Write a scene between "${character_a}" and "${character_b}".`,
        },
      ],
    });

    // Parse the script response
    let scriptData: { text: string; visual_prompt: string };
    try {
      const content = scriptResponse.content[0];
      if (content.type === 'text') {
        // Try to extract JSON from the response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          scriptData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } else {
        throw new Error('Unexpected response type');
      }
    } catch (parseError) {
      console.error('Failed to parse script:', parseError);
      // Fallback
      scriptData = {
        text: `${character_a} and ${character_b} found themselves alone. The air between them grew heavy with unspoken words. Neither moved. Neither breathed. The moment stretched like taffy, sweet and unbearable.`,
        visual_prompt: 'A dimly lit room with warm amber lighting, rain streaking down tall windows, the city lights blurred in the background. Intimate, cinematic, moody atmosphere.',
      };
    }

    // =========================
    // STEP 2: THE SET (DALL-E 3)
    // =========================
    console.log('🎨 Generating scene image...');
    
    let imageUrl = '/fallback-scene.jpg'; // Fallback
    
    try {
      if (process.env.OPENAI_API_KEY) {
        const imageResponse = await openai.images.generate({
          model: 'dall-e-3',
          prompt: `Cinematic film still. ${scriptData.visual_prompt}. 
                   Style: High-end cinematography, dramatic lighting, 4K quality.
                   Mood: Intimate, charged, romantic tension.
                   NO PEOPLE in the image. Only the setting/environment.
                   Aspect: Portrait orientation, like a movie poster.`,
          n: 1,
          size: '1024x1792',
          quality: 'hd',
          style: 'vivid',
        });
        imageUrl = imageResponse.data[0]?.url || imageUrl;
      }
    } catch (imageError) {
      console.error('Image generation failed:', imageError);
      // Continue without image - the story still works
    }

    // =========================
    // STEP 3: THE VOICE (OpenAI TTS)
    // =========================
    console.log('🎙️ Generating narration...');
    
    let audioUrl = '';
    let audioDuration = 0;
    
    try {
      if (process.env.OPENAI_API_KEY) {
        // Choose voice based on intensity
        const voice = intensity > 7 ? 'onyx' : 'shimmer';
        
        const audioResponse = await openai.audio.speech.create({
          model: 'tts-1-hd',
          voice: voice,
          input: scriptData.text,
          speed: 0.9, // Slightly slower for dramatic effect
        });

        // Convert to base64 for client
        const audioBuffer = await audioResponse.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
        
        // Estimate duration (roughly 150 words per minute at 0.9 speed)
        const wordCount = scriptData.text.split(/\s+/).length;
        audioDuration = Math.ceil((wordCount / 150) * 60 * (1 / 0.9));
      }
    } catch (audioError) {
      console.error('Audio generation failed:', audioError);
      // Continue without audio - text display still works
    }

    // =========================
    // BUILD THE RESPONSE
    // =========================
    const storyData = {
      id: `story_${Date.now()}`,
      text: scriptData.text,
      imageUrl,
      audioUrl,
      audioDuration,
      characters: [character_a, character_b],
      trope,
      genre,
      intensity,
      visualPrompt: scriptData.visual_prompt,
      createdAt: new Date().toISOString(),
    };

    console.log('✅ Story generated successfully');
    
    return NextResponse.json(storyData);

  } catch (error) {
    console.error('Story generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate story', details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'Story Engine Online',
    tropes: Object.keys(TROPES),
    genres: Object.keys(GENRES),
    usage: 'POST with { character_a, character_b, trope?, genre?, intensity? }',
  });
}

