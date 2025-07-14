import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Server-side image upload to image hosting service...');
    
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
    
    // Try multiple image hosting services for reliability
    const uploadServices = [
      { name: 'Catbox', upload: uploadToCatbox },
      { name: 'Telegraph', upload: uploadToTelegraph },
      { name: 'ImgBB', upload: uploadToImgBB }
    ];
    
    for (const service of uploadServices) {
      try {
        console.log(`📸 Trying ${service.name}...`);
        const result = await service.upload(buffer, imageFile.type);
        if (result.success) {
          console.log(`✅ ${service.name} upload successful:`, result.url);
          return NextResponse.json({
            url: result.url,
            service: service.name.toLowerCase(),
            permanent: true
          });
        }
      } catch (error) {
        console.log(`❌ ${service.name} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All image hosting services failed');
    
  } catch (error) {
    console.error('❌ Image upload failed:', error);
    return NextResponse.json(
      { error: 'Image upload failed', details: error.message },
      { status: 500 }
    );
  }
}

// Catbox.moe - Anonymous file hosting with direct URLs
async function uploadToCatbox(buffer: Buffer, mimeType: string) {
  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  const extension = mimeType.split('/')[1] || 'png';
  const filename = `kroppit-${Date.now()}.${extension}`;
  
  formData.append('reqtype', 'fileupload');
  formData.append('fileToUpload', blob, filename);
  
  const response = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Catbox upload failed: ${response.status}`);
  }
  
  const url = await response.text();
  return { success: true, url: url.trim() };
}

// Telegraph - Instant image hosting with direct URLs
async function uploadToTelegraph(buffer: Buffer, mimeType: string) {
  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  const extension = mimeType.split('/')[1] || 'png';
  const filename = `kroppit-${Date.now()}.${extension}`;
  
  formData.append('file', blob, filename);
  
  const response = await fetch('https://telegra.ph/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Telegraph upload failed: ${response.status}`);
  }
  
  const result = await response.json();
  if (result && result[0] && result[0].src) {
    return { success: true, url: `https://telegra.ph${result[0].src}` };
  }
  
  throw new Error('Telegraph upload failed - no URL returned');
}

// ImgBB - Free image hosting with direct URLs
async function uploadToImgBB(buffer: Buffer, mimeType: string) {
  const base64 = buffer.toString('base64');
  const formData = new FormData();
  
  formData.append('image', base64);
  formData.append('key', 'your-imgbb-key-here'); // Free tier available
  
  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`ImgBB upload failed: ${response.status}`);
  }
  
  const result = await response.json();
  if (result.success && result.data && result.data.url) {
    return { success: true, url: result.data.url };
  }
  
  throw new Error('ImgBB upload failed - no URL returned');
}