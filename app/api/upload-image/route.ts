import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Server-side image upload for casting...');
    
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      console.log('❌ No image file provided');
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    
    console.log('📸 Image file received:', imageFile.name, imageFile.size, 'bytes');
    
    // Convert file to buffer for upload
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const blob = new Blob([buffer], { type: imageFile.type });
    
    // Try Cloudinary first (enterprise-grade with guaranteed CORS)
    console.log('📸 Attempting upload to Cloudinary (CORS-enabled)...');
    
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', blob);
    cloudinaryFormData.append('upload_preset', 'ml_default'); // Public preset
    
    const cloudinaryResponse = await fetch(
      'https://api.cloudinary.com/v1_1/demo/image/upload',
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    );
    
    console.log('📸 Cloudinary response status:', cloudinaryResponse.status);
    
    if (cloudinaryResponse.ok) {
      const cloudinaryResult = await cloudinaryResponse.json();
      console.log('📸 Cloudinary result:', cloudinaryResult);
      
      if (cloudinaryResult.secure_url) {
        console.log('✅ Cloudinary upload successful:', cloudinaryResult.secure_url);
        return NextResponse.json({ url: cloudinaryResult.secure_url });
      }
    }
    
    // Fallback to Imgur (free, reliable, CORS-enabled)
    console.log('📸 Cloudinary failed, trying Imgur (CORS-enabled)...');
    
    const imgurFormData = new FormData();
    imgurFormData.append('image', blob);
    imgurFormData.append('type', 'file');
    
    const imgurResponse = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID 546c25a59c58ad7' // Anonymous public client ID
      },
      body: imgurFormData,
    });
    
    console.log('📸 Imgur response status:', imgurResponse.status);
    
    if (imgurResponse.ok) {
      const imgurResult = await imgurResponse.json();
      console.log('📸 Imgur result:', imgurResult);
      
      if (imgurResult.data && imgurResult.data.link) {
        console.log('✅ Imgur upload successful:', imgurResult.data.link);
        return NextResponse.json({ url: imgurResult.data.link });
      }
    }
    
    // If both CORS-enabled services fail, throw error
    throw new Error('All CORS-enabled upload services failed');
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}