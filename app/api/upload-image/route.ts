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
    
    // Try Telegraph first (most reliable)
    console.log('📸 Attempting upload to Telegraph...');
    
    const uploadFormData = new FormData();
    const blob = new Blob([buffer], { type: imageFile.type });
    uploadFormData.append('file', blob, imageFile.name || 'kropped-image.png');
    
    const uploadResponse = await fetch('https://telegra.ph/upload', {
      method: 'POST',
      body: uploadFormData,
    });
    
    console.log('📸 Telegraph response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      console.log('❌ Telegraph upload failed with status:', uploadResponse.status);
      const errorText = await uploadResponse.text();
      console.log('❌ Telegraph error response:', errorText);
      
      // Try Cloudinary (known good CORS)
      console.log('📸 Trying Cloudinary with CORS support...');
      
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
          return NextResponse.json({ url: cloudinaryResult.secure_url });
        }
      }
      
      // Final fallback: Try Catbox
      console.log('📸 Trying Catbox final fallback...');
      
      const catboxFormData = new FormData();
      catboxFormData.append('reqtype', 'fileupload');
      catboxFormData.append('fileToUpload', blob, imageFile.name || 'kropped-image.png');
      
      const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: catboxFormData,
      });
      
      console.log('📸 Catbox response status:', catboxResponse.status);
      
      if (!catboxResponse.ok) {
        throw new Error('All upload services failed');
      }
      
      const catboxResult = await catboxResponse.text();
      console.log('📸 Catbox result:', catboxResult);
      
      if (catboxResult.trim().startsWith('http')) {
        return NextResponse.json({ url: catboxResult.trim() });
      } else {
        throw new Error('Invalid Catbox response');
      }
    }
    
    const result = await uploadResponse.json();
    console.log('📸 Telegraph result:', result);
    
    if (result[0]?.src) {
      const imageUrl = `https://telegra.ph${result[0].src}`;
      console.log('✅ Telegraph upload successful:', imageUrl);
      return NextResponse.json({ url: imageUrl });
    } else {
      throw new Error('Invalid Telegraph response format');
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}