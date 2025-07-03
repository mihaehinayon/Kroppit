import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${image.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary (no auto-delete initially)
    const result = await cloudinary.uploader.upload(base64, {
      folder: 'kroppit-temp',
      public_id: `crop_${Date.now()}`,
      resource_type: 'image',
      invalidate: true,
      eager: [
        { width: 800, height: 800, crop: 'limit', format: 'auto', quality: 'auto' }
      ],
      // Add metadata for tracking
      context: `uploaded_at=${Date.now()}|status=pending`,
    });

    return NextResponse.json({ 
      imageUrl: result.secure_url,
      publicId: result.public_id 
    });

  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: 'Upload failed' }, 
      { status: 500 }
    );
  }
}