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
    // Get all images in the kroppit-temp folder
    const result = await cloudinary.search
      .expression('folder:kroppit-temp')
      .with_field('context')
      .max_results(500)
      .execute();

    const now = Date.now();
    const twoHoursAgo = now - (2 * 60 * 60 * 1000); // 2 hours - conservative delay
    const oneDayAgo = now - (24 * 60 * 60 * 1000); // 24 hours
    
    let deletedCount = 0;
    
    for (const image of result.resources) {
      const context = image.context?.custom || {};
      const uploadedAt = parseInt(context.uploaded_at || '0');
      const castAt = parseInt(context.cast_at || '0');
      const status = context.status;
      
      let shouldDelete = false;
      let reason = '';
      
      if (status === 'cast_successful' && castAt > 0 && castAt < twoHoursAgo) {
        // Conservative: Delete successful casts 2 hours after casting
        // This gives Farcaster plenty of time to cache the image
        shouldDelete = true;
        reason = 'successful cast, 2 hours since cast time';
      } else if (status === 'pending' && uploadedAt < oneDayAgo) {
        // Delete abandoned uploads after 24 hours
        shouldDelete = true;
        reason = 'abandoned upload, 24 hours since upload';
      }
      
      if (shouldDelete) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
          deletedCount++;
          console.log(`Deleted ${image.public_id}: ${reason}`);
        } catch (deleteError) {
          console.error(`Failed to delete ${image.public_id}:`, deleteError);
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      deletedCount,
      totalImages: result.resources.length 
    });

  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' }, 
      { status: 500 }
    );
  }
}