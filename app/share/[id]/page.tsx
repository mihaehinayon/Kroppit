import { notFound } from 'next/navigation';
import { getImageData as getStoredImageData } from '../../../lib/imageStore';

interface SharePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: SharePageProps) {
  const imageData = getStoredImageData(params.id);
  
  if (!imageData) {
    return {
      title: 'Image not found - Kroppit',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://kroppit.vercel.app';
  
  return {
    title: 'Cropped with Kroppit - Photo Crop Tool',
    description: 'Check out this perfectly cropped photo made with Kroppit!',
    openGraph: {
      title: 'Cropped with Kroppit - Photo Crop Tool',
      description: 'Check out this perfectly cropped photo made with Kroppit!',
      images: [
        {
          url: imageData.imageUrl,
          width: 1200,
          height: 630,
          alt: 'Cropped image from Kroppit',
        },
      ],
      url: `${baseUrl}/share/${params.id}`,
      siteName: 'Kroppit',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Cropped with Kroppit - Photo Crop Tool',
      description: 'Check out this perfectly cropped photo made with Kroppit!',
      images: [imageData.imageUrl],
    },
    other: {
      // Farcaster Frame metadata
      'fc:frame': 'vNext',
      'fc:frame:image': imageData.imageUrl,
      'fc:frame:button:1': 'Try Kroppit',
      'fc:frame:button:1:action': 'link',
      'fc:frame:button:1:target': baseUrl,
    },
  };
}

export default function SharePage({ params }: SharePageProps) {
  const imageData = getStoredImageData(params.id);
  
  if (!imageData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          📸 Cropped with Kroppit
        </h1>
        
        <div className="mb-6">
          <img 
            src={imageData.imageUrl} 
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