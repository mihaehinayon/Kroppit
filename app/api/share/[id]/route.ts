import { NextRequest, NextResponse } from 'next/server';
import { getImageData } from '../../../../lib/imageStore';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const imageData = getImageData(params.id);
  
  if (!imageData) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 });
  }
  
  return NextResponse.json(imageData);
}