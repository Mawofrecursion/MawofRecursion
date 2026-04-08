import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// =========================
// THE VISUAL CORTEX
// Scene Image Generation
// =========================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, style = 'cinematic', orientation = 'landscape' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      // Return a placeholder for development
      return NextResponse.json({
        imageUrl: null,
        fallback: true,
        message: 'No OpenAI API key configured. Using gradient fallback.',
      });
    }

    // Determine size based on orientation
    const size = orientation === 'portrait' 
      ? '1024x1792' 
      : orientation === 'square' 
        ? '1024x1024' 
        : '1792x1024';

    // Style presets
    const stylePrompts: Record<string, string> = {
      cinematic: 'Cinematic film still, dramatic lighting, 4K quality, movie production value.',
      noir: 'Film noir style, high contrast, deep shadows, 1940s aesthetic, black and white with selective color.',
      romantic: 'Soft romantic lighting, warm tones, intimate atmosphere, bokeh background.',
      cyberpunk: 'Neon-lit cyberpunk scene, rain-slicked surfaces, futuristic, Blade Runner aesthetic.',
      gothic: 'Gothic atmosphere, candlelight, dark mansion, mysterious and brooding.',
      luxury: 'High-end luxury, modern minimalist, expensive taste, penthouse aesthetic.',
    };

    const stylePrefix = stylePrompts[style] || stylePrompts.cinematic;

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `${stylePrefix} ${prompt}. NO PEOPLE in the image. Only environment and atmosphere.`,
      n: 1,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: 'hd',
      style: 'vivid',
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned');
    }

    return NextResponse.json({
      imageUrl,
      revisedPrompt: response.data[0]?.revised_prompt,
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate image', 
        details: String(error),
        fallback: true,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Visual Cortex Online',
    styles: ['cinematic', 'noir', 'romantic', 'cyberpunk', 'gothic', 'luxury'],
    orientations: ['landscape', 'portrait', 'square'],
    usage: 'POST with { prompt, style?, orientation? }',
  });
}

