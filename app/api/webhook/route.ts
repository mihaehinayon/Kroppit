import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the webhook payload for debugging
    console.log('Farcaster webhook received:', {
      timestamp: new Date().toISOString(),
      payload: body,
      headers: Object.fromEntries(request.headers.entries())
    });

    // Handle different webhook event types
    switch (body.type) {
      case 'frame_added':
        console.log('Frame added by user:', body.data?.user);
        // Add your logic here for when a user adds your frame
        break;
      
      case 'frame_removed':
        console.log('Frame removed by user:', body.data?.user);
        // Add your logic here for when a user removes your frame
        break;
      
      case 'notification_details':
        console.log('Notification details received:', body.data);
        // Store notification details for push notifications
        break;
      
      default:
        console.log('Unknown webhook event type:', body.type);
    }

    // Return success response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint is active' });
}