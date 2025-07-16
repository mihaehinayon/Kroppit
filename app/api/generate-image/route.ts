import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');
    
    if (!imageUrl) {
      return new Response('Missing imageUrl parameter', { status: 400 });
    }

    // Just return the cropped image directly - no need for extra branding or fixed dimensions
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return new Response('Failed to fetch image', { status: 400 });
    }
    
    // Return the original cropped image as-is
    return new Response(imageResponse.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}