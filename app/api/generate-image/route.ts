import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageData = searchParams.get('imageData');
    const imageUrl = searchParams.get('imageUrl');
    
    let imageBuffer: ArrayBuffer;
    
    if (imageData) {
      // Handle base64 data directly
      console.log('📸 GENERATE IMAGE: Processing base64 data');
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (imageUrl) {
      // Handle external URL (fallback)
      console.log('📸 GENERATE IMAGE: Fetching from URL');
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return new Response('Failed to fetch image', { status: 400 });
      }
      imageBuffer = await imageResponse.arrayBuffer();
    } else {
      return new Response('Missing imageData or imageUrl parameter', { status: 400 });
    }
    
    // Return the original cropped image as-is
    return new Response(imageBuffer, {
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