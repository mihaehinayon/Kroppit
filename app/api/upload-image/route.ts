import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from 'pinata';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
      { name: 'Pinata', upload: uploadToPinata },
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

// Pinata - IPFS hosting with folder upload for file extension URLs
async function uploadToPinata(buffer: Buffer, mimeType: string) {
  // Check if Pinata is configured
  if (!process.env.PINATA_JWT) {
    throw new Error('Pinata JWT not configured');
  }
  
  const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT!,
    pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
  });

  const extension = mimeType.split('/')[1] || 'png';
  const filename = `cropped_image.${extension}`;
  const uniqueId = uuidv4();
  
  // Create temporary folder structure
  const tempDir = path.join(os.tmpdir(), `kroppit-${uniqueId}`);
  fs.mkdirSync(tempDir, { recursive: true });
  
  try {
    // Save image to temporary folder with proper filename
    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    console.log(`📁 Created temporary folder: ${tempDir}`);
    console.log(`📄 Saved image as: ${filename}`);
    
    // Upload folder to Pinata using pinFromFS
    const options = {
      pinataMetadata: {
        name: `Kroppit Image ${uniqueId}`,
        keyvalues: {
          app: 'kroppit',
          type: 'cropped-image',
          timestamp: Date.now().toString()
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };
    
    console.log('📤 Uploading folder to Pinata...');
    const result = await pinata.pinFromFS(tempDir, options);
    const folderCID = result.IpfsHash;
    
    // Construct URL with file extension
    const gateway = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";
    const imageUrl = `https://${gateway}/ipfs/${folderCID}/${filename}`;
    
    console.log(`✅ Pinata upload successful: ${imageUrl}`);
    console.log(`📊 Folder CID: ${folderCID}`);
    return { success: true, url: imageUrl };
    
  } catch (error) {
    console.error('❌ Pinata upload failed:', error);
    throw error;
  } finally {
    // Clean up temporary files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`🗑️ Cleaned up temporary folder: ${tempDir}`);
    }
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