import { NextRequest, NextResponse } from 'next/server';

// Farcaster image validation based on official spec
function validateImageForFarcaster(file: File): { valid: boolean; error?: string; details?: string } {
  // Check file size (must be < 10 MB)
  const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
  
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Image too large for Farcaster (${fileSizeMB} MB)`,
      details: `Farcaster requires images < 10 MB. Consider compressing your image or using a smaller crop area.`
    };
  }
  
  // Check file type (must be jpg, png, or gif)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported image format: ${file.type}`,
      details: `Farcaster only supports JPG, PNG, and GIF images. SVG is not allowed.`
    };
  }
  
  // Log validation success with details
  console.log(`✅ Image validation passed:`);
  console.log(`   📏 Size: ${fileSizeMB} MB (under 10 MB limit)`);
  console.log(`   📷 Format: ${file.type} (supported)`);
  console.log(`   📁 Filename: ${file.name}`);
  
  return { valid: true };
}

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
    
    // Validate image for Farcaster compatibility
    const validation = validateImageForFarcaster(imageFile);
    if (!validation.valid) {
      console.log('❌ Image validation failed:', validation.error);
      return NextResponse.json({ 
        error: validation.error, 
        details: validation.details 
      }, { status: 400 });
    }
    
    // Convert file to buffer for upload
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Use Cloudinary - confirmed to work well with Farcaster
    const uploadServices = [
      { name: 'Cloudinary', upload: uploadToCloudinary }
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

// Cloudinary - Professional image hosting with CDN, works well with Farcaster
async function uploadToCloudinary(buffer: Buffer, mimeType: string) {
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary not configured - missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET');
  }
  
  const extension = mimeType.split('/')[1] || 'png';
  const timestamp = Date.now();
  const publicId = `kroppit/cropped_image_${timestamp}`;
  
  // Convert buffer to base64 for Cloudinary upload
  const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
  
  const formData = new FormData();
  formData.append('file', base64);
  formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'unsigned');
  formData.append('public_id', publicId);
  formData.append('folder', 'kroppit');
  
  console.log('📤 Uploading to Cloudinary...');
  console.log(`📁 Public ID: ${publicId}`);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );
  
  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  
  // Cloudinary provides URLs with proper file extensions
  const imageUrl = result.secure_url;
  
  console.log(`✅ Cloudinary upload successful: ${imageUrl}`);
  console.log(`📊 Cloudinary public_id: ${result.public_id}`);
  console.log(`🎯 URL with extension: ${imageUrl}`);
  
  return { success: true, url: imageUrl };
}

