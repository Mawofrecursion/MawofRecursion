import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// =========================
// THE SCENE ENGINE
// Not just romance - any cinematic moment
// =========================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Scene types for different moments
export const SCENE_TYPES = {
  // Romantic/Tension
  romance: {
    name: 'Romance',
    description: 'Tension between two characters',
    needsCharacters: true,
    hasAudio: true,
  },
  
  // Dramatic moments
  dramatic: {
    name: 'Dramatic Reveal',
    description: 'A shocking revelation or turning point',
    needsCharacters: false,
    hasAudio: true,
  },
  
  // Comedy
  comedy: {
    name: 'Comedy Beat',
    description: 'Something ridiculous happens',
    needsCharacters: false,
    hasAudio: true,
  },
  
  // Atmosphere only (no narration)
  atmosphere: {
    name: 'Atmosphere',
    description: 'Just a mood-setting image',
    needsCharacters: false,
    hasAudio: false,
  },
  
  // Transition
  transition: {
    name: 'Scene Transition',
    description: 'Moving to a new location or time',
    needsCharacters: false,
    hasAudio: true,
  },
  
  // Challenge intro
  challenge: {
    name: 'Challenge',
    description: 'Introducing a game or challenge',
    needsCharacters: true,
    hasAudio: true,
  },
  
  // Confession booth
  confession: {
    name: 'Confession',
    description: 'A character reveals something personal',
    needsCharacters: true,
    hasAudio: true,
  },
};

// Visual themes
const VISUAL_THEMES = {
  noir: 'Film noir, dramatic shadows, rain, 1940s detective aesthetic',
  luxury: 'Modern luxury, penthouse, city lights, expensive taste',
  cozy: 'Warm and intimate, soft lighting, comfortable space',
  party: 'Vibrant party atmosphere, colorful lights, energy',
  mysterious: 'Dark and mysterious, fog, candlelight, secrets',
  playful: 'Bright and fun, games, playful energy',
  dramatic: 'High contrast, theatrical, spotlight',
  romantic: 'Soft focus, warm tones, intimate setting',
  chaotic: 'Wild energy, messy, unpredictable',
  serene: 'Calm, peaceful, zen-like atmosphere',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scene_type = 'atmosphere',
      theme = 'noir',
      characters = [],
      context = '',
      prompt_override = null, // Allow custom prompts
      generate_audio = true,
      room_id,
    } = body;

    const sceneConfig = SCENE_TYPES[scene_type as keyof typeof SCENE_TYPES] || SCENE_TYPES.atmosphere;
    const visualTheme = VISUAL_THEMES[theme as keyof typeof VISUAL_THEMES] || VISUAL_THEMES.noir;

    let text = '';
    let visualPrompt = '';
    let audioUrl = '';
    let imageUrl = '';

    // =========================
    // STEP 1: GENERATE TEXT (if scene type needs it)
    // =========================
    if (sceneConfig.hasAudio && !prompt_override) {
      console.log('📝 Generating scene text...');

      const systemPrompts: Record<string, string> = {
        romance: `You are a romance novelist. Write a 100-150 word scene full of tension and longing between the characters. Focus on sensory details, the space between them, almost-moments. No explicit content.`,
        
        dramatic: `You are a thriller writer. Write a 80-120 word dramatic moment. Build tension. End on a cliffhanger or revelation. Make it punchy.`,
        
        comedy: `You are a comedy writer. Write a 60-100 word absurd or hilarious moment. Go for the laugh. Physical comedy, ridiculous situations, or witty banter.`,
        
        transition: `You are a narrator. Write a 40-60 word scene transition. Set the new mood. Be evocative but brief.`,
        
        challenge: `You are a game show host with a mysterious edge. Write a 60-80 word introduction to a challenge or game. Build anticipation. Make it feel high-stakes but fun.`,
        
        confession: `You are a documentary filmmaker. Write a 80-120 word confessional moment where a character reveals something personal. Make it feel authentic and vulnerable.`,
      };

      const characterList = characters.length > 0 
        ? `Characters involved: ${characters.join(', ')}`
        : '';

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompts[scene_type] || systemPrompts.dramatic,
        messages: [{
          role: 'user',
          content: `${characterList}\nContext: ${context || 'A game night among friends'}\nVisual theme: ${visualTheme}\n\nWrite the scene. Also include a "visual_prompt" for an AI image generator (describe the SETTING only, no people). Return as JSON: { "text": "...", "visual_prompt": "..." }`,
        }],
      });

      try {
        const content = response.content[0];
        if (content.type === 'text') {
          const jsonMatch = content.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            text = parsed.text;
            visualPrompt = parsed.visual_prompt;
          }
        }
      } catch {
        text = context || 'The moment hung in the air...';
        visualPrompt = `${visualTheme}. Cinematic, atmospheric, moody.`;
      }
    } else if (prompt_override) {
      text = prompt_override;
      visualPrompt = `${visualTheme}. ${context}. Cinematic quality.`;
    } else {
      visualPrompt = `${visualTheme}. ${context || 'Atmospheric scene'}. Cinematic, 4K, dramatic lighting.`;
    }

    // =========================
    // STEP 2: GENERATE IMAGE
    // =========================
    console.log('🎨 Generating scene image...');
    
    try {
      if (process.env.OPENAI_API_KEY) {
        const imageResponse = await openai.images.generate({
          model: 'dall-e-3',
          prompt: `${visualPrompt}. NO PEOPLE. Only environment and atmosphere. Cinematic film still, dramatic lighting.`,
          n: 1,
          size: '1792x1024', // Landscape for TV
          quality: 'hd',
          style: 'vivid',
        });
        imageUrl = imageResponse.data[0]?.url || '';
      }
    } catch (error) {
      console.error('Image generation failed:', error);
    }

    // =========================
    // STEP 3: GENERATE AUDIO (if needed)
    // =========================
    if (sceneConfig.hasAudio && text && generate_audio) {
      console.log('🎙️ Generating narration...');
      
      try {
        if (process.env.OPENAI_API_KEY) {
          // Pick voice based on scene type
          const voice = scene_type === 'comedy' ? 'fable' 
            : scene_type === 'romance' ? 'shimmer'
            : scene_type === 'challenge' ? 'echo'
            : 'onyx';
          
          const audioResponse = await openai.audio.speech.create({
            model: 'tts-1-hd',
            voice,
            input: text,
            speed: scene_type === 'comedy' ? 1.0 : 0.9,
          });

          const audioBuffer = await audioResponse.arrayBuffer();
          audioUrl = `data:audio/mpeg;base64,${Buffer.from(audioBuffer).toString('base64')}`;
        }
      } catch (error) {
        console.error('Audio generation failed:', error);
      }
    }

    // =========================
    // BUILD RESPONSE
    // =========================
    const sceneData = {
      id: `scene_${Date.now()}`,
      type: scene_type,
      theme,
      text: text || null,
      imageUrl: imageUrl || null,
      audioUrl: audioUrl || null,
      characters,
      hasAudio: sceneConfig.hasAudio && !!audioUrl,
      duration: text ? Math.ceil(text.split(/\s+/).length / 2.5) : 5,
      createdAt: new Date().toISOString(),
    };

    console.log('✅ Scene generated:', scene_type);
    return NextResponse.json(sceneData);

  } catch (error) {
    console.error('Scene generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate scene', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Scene Engine Online',
    scene_types: Object.keys(SCENE_TYPES),
    themes: Object.keys(VISUAL_THEMES),
    usage: 'POST with { scene_type, theme?, characters?, context?, generate_audio? }',
  });
}

