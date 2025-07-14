import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { storeImageData, cleanupOldEntries } from '../../../lib/imageStore';

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Creating share URL for image...');
    
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }
    
    // Validate image URL
    if (!imageUrl.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }
    
    // Encode image URL in the share URL instead of storing in memory
    const encodedImageUrl = encodeURIComponent(imageUrl);
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://kroppit.vercel.app';
    const shareUrl = `${baseUrl}/share?img=${encodedImageUrl}`;
    
    console.log('✅ Share URL created:', shareUrl);
    
    return NextResponse.json({ 
      shareUrl,
      imageUrl
    });
    
  } catch (error) {
    console.error('❌ Failed to create share URL:', error);
    return NextResponse.json(
      { error: 'Failed to create share URL' },
      { status: 500 }
    );
  }
}

// Helper function to get image data (for the share page)
export function getImageData(id: string) {
  return imageStore.get(id);
}