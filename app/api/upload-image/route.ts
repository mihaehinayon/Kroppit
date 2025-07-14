import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Server-side image upload to IPFS via Pinata...');
    
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
    
    // Upload to Pinata (IPFS) for permanent, decentralized storage
    console.log('📸 Uploading to IPFS via Pinata...');
    
    const pinataFormData = new FormData();
    const blob = new Blob([buffer], { type: imageFile.type });
    
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const filename = `kroppit-crop-${timestamp}.png`;
    
    pinataFormData.append('file', blob, filename);
    
    // Add metadata for better organization
    const pinataMetadata = JSON.stringify({
      name: filename,
      keyvalues: {
        app: 'kroppit',
        type: 'cropped-image',
        timestamp: timestamp.toString()
      }
    });
    pinataFormData.append('pinataMetadata', pinataMetadata);
    
    // Upload to IPFS via Pinata with proper authentication
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT || 'your-pinata-jwt-here'}`,
      },
      body: pinataFormData,
    });
    
    console.log('📸 Pinata response status:', pinataResponse.status);
    
    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.log('❌ Pinata error response:', errorText);
      throw new Error(`Pinata upload failed: ${pinataResponse.status}`);
    }
    
    const pinataResult = await pinataResponse.json();
    console.log('📸 Pinata result:', pinataResult);
    
    if (pinataResult.IpfsHash) {
      // Create IPFS URL with .png extension for proper Warpcast rendering
      const ipfsUrl = `https://ipfs.io/ipfs/${pinataResult.IpfsHash}.png`;
      console.log('✅ IPFS upload successful via Pinata with .png extension:', ipfsUrl);
      return NextResponse.json({ 
        url: ipfsUrl,
        ipfsHash: pinataResult.IpfsHash,
        permanent: true,
        decentralized: true,
        service: 'pinata-ipfs'
      });
    } else {
      throw new Error('Invalid Pinata response - no IpfsHash');
    }
    
  } catch (error) {
    console.error('❌ IPFS upload failed:', error);
    return NextResponse.json(
      { error: 'IPFS upload failed', details: error.message },
      { status: 500 }
    );
  }
}