import { Suspense } from 'react';
import { notFound } from 'next/navigation';

interface SharePageProps {
  searchParams: {
    img?: string;
  };
}

export async function generateMetadata({ searchParams }: SharePageProps) {
  const imageUrl = searchParams.img;
  
  if (!imageUrl) {
    return {
      title: 'Image not found - Kroppit',
    };
  }

  const decodedImageUrl = decodeURIComponent(imageUrl);
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://kroppit.vercel.app';
  const heroImage = process.env.NEXT_PUBLIC_APP_HERO_IMAGE;
  
  return {
    title: 'Cropped with Kroppit - Photo Crop Tool',
    description: 'Check out this perfectly cropped photo made with Kroppit!',
    openGraph: {
      title: 'Cropped with Kroppit - Photo Crop Tool',
      description: 'Check out this perfectly cropped photo made with Kroppit!',
      images: [
        {
          url: decodedImageUrl,
          width: 1200,
          height: 630,
          alt: 'Cropped image from Kroppit',
        },
      ],
      url: `${baseUrl}/share?img=${imageUrl}`,
      siteName: 'Kroppit',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Cropped with Kroppit - Photo Crop Tool',
      description: 'Check out this perfectly cropped photo made with Kroppit!',
      images: [decodedImageUrl],
    },
    other: {
      // Farcaster Mini App metadata
      'fc:miniapp': JSON.stringify({
        version: "1",
        imageUrl: decodedImageUrl,
        button: {
          title: "Try Kroppit",
          action: {
            type: "launch_miniapp",
            splashImageUrl: heroImage,
            splashBackgroundColor: "#ffffff"
          }
        }
      }),
      'fc:frame': JSON.stringify({
        version: "1",
        imageUrl: decodedImageUrl,
        button: {
          title: "Try Kroppit",
          action: {
            type: "launch_miniapp"
          }
        }
      }),
    },
  };
}

function SharePageContent({ searchParams }: SharePageProps) {
  const imageUrl = searchParams.img;
  
  if (!imageUrl) {
    notFound();
  }

  const decodedImageUrl = decodeURIComponent(imageUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          📸 Cropped with Kroppit
        </h1>
        
        <div className="mb-6">
          <img 
            src={decodedImageUrl} 
            alt="Cropped image"
            className="max-w-full h-auto rounded-lg shadow-md mx-auto"
            style={{ maxHeight: '400px' }}
          />
        </div>
        
        <p className="text-gray-600 mb-6">
          This image was perfectly cropped using Kroppit - the easiest photo crop tool for Farcaster!
        </p>
        
        <div className="space-y-4">
          <a 
            href={process.env.NEXT_PUBLIC_URL || 'https://kroppit.vercel.app'}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            🎯 Try Kroppit Yourself
          </a>
          
          <div className="text-sm text-gray-500">
            Kroppit - Professional photo cropping for Farcaster
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SharePage(props: SharePageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SharePageContent {...props} />
    </Suspense>
  );
}