import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from 'pinata';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

// Pinata - IPFS hosting with fixed folder for file extension URLs
async function uploadToPinata(buffer: Buffer, mimeType: string) {
  // Check if Pinata is configured
  if (!process.env.PINATA_JWT) {
    throw new Error('Pinata JWT not configured');
  }
  
  // Check for Pinata group ID for organized uploads
  const PINATA_GROUP_ID = process.env.PINATA_GROUP_ID;
  
  if (!PINATA_GROUP_ID) {
    console.log('📁 No PINATA_GROUP_ID configured, uploading as single file...');
    
    // Fallback to single file upload
    const pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT!,
      pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
    });

    const extension = mimeType.split('/')[1] || 'png';
    const filename = `cropped_image.${extension}`;
    
    const blob = new Blob([buffer], { type: mimeType });
    const imageFile = new File([blob], filename, { type: mimeType });
    
    console.log('📤 Uploading single file to Pinata...');
    const result = await pinata.upload.file(imageFile);
    
    const cid = result.cid || result.IpfsHash;
    const gateway = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";
    // Always include filename parameter for Farcaster compatibility
    const imageUrl = `https://${gateway}/ipfs/${cid}?filename=${filename}`;
    
    console.log(`✅ Pinata single file upload: ${imageUrl}`);
    return { success: true, url: imageUrl };
  }

  // Use fixed folder approach
  const extension = mimeType.split('/')[1] || 'png';
  const timestamp = Date.now();
  const uniqueFilename = `cropped_image_${timestamp}.${extension}`;
  
  try {
    console.log(`📁 Using Pinata group ID: ${PINATA_GROUP_ID}`);
    console.log(`📄 Unique filename: ${uniqueFilename}`);
    
    // Initialize Pinata SDK
    const pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT!,
      pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
    });

    // Create file object for upload
    const blob = new Blob([buffer], { type: mimeType });
    const imageFile = new File([blob], uniqueFilename, { type: mimeType });
    
    console.log('📤 Uploading file to Pinata group...');
    console.log(`📋 Group ID: ${PINATA_GROUP_ID}`);
    console.log(`📄 File name: ${uniqueFilename}`);
    
    // Upload file to specific group for organization
    const result = await pinata.upload.file(imageFile).group(PINATA_GROUP_ID);
    
    console.log('📊 Pinata upload result:', result);
    
    // Get the uploaded file CID
    const cid = result.cid || result.IpfsHash;
    const gateway = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";
    
    // Always include filename parameter for Farcaster compatibility
    const imageUrl = `https://${gateway}/ipfs/${cid}?filename=${uniqueFilename}`;
    
    console.log(`✅ Pinata group upload successful: ${imageUrl}`);
    console.log(`📊 File CID: ${cid}`);
    console.log(`🎯 Filename with extension: ${uniqueFilename}`);
    console.log(`🔗 Final URL with extension: ${imageUrl}`);
    
    return { success: true, url: imageUrl };
    
  } catch (error) {
    console.error('❌ Pinata group upload failed:', error);
    throw error;
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