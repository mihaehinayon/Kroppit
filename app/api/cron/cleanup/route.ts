import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request (you can add auth here)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Call the cleanup function
    const cleanupResponse = await fetch(`${request.nextUrl.origin}/api/cleanup-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await cleanupResponse.json();
    
    console.log(`Cron cleanup completed: ${result.deletedCount} images deleted`);
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${result.deletedCount} images deleted`,
      ...result
    });

  } catch (error) {
    console.error('Cron cleanup failed:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: error }, 
      { status: 500 }
    );
  }
}