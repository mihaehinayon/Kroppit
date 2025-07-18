import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  // Use Vercel URL environment variable as fallback
  const URL = process.env.NEXT_PUBLIC_URL || 
              process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
              "https://kroppit.vercel.app";
  const projectName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Kroppit";
  const embedImage = `${URL}/image.png?v=2025071601`; // 3:2 ratio image for embeds with cache bust
  const heroImage = process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${URL}/hero.png`; // For splash screen
  
  // Debug logging
  console.log("🔍 Metadata generation:", {
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    finalURL: URL,
    embedImage,
    heroImage
  });
  
  return {
    title: projectName,
    description:
      "Generate perfect crops for Farcaster with Kroppit - crop and cast in one flow",
    openGraph: {
      title: projectName,
      description: "Generate perfect crops for Farcaster with Kroppit - crop and cast in one flow",
      url: URL,
      siteName: projectName,
      images: [
        {
          url: embedImage,
          width: 1200,
          height: 800,
          alt: `${projectName} - Crop and Cast`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: projectName,
      description: "Generate perfect crops for Farcaster with Kroppit - crop and cast in one flow",
      images: [embedImage],
    },
    other: {
      "fc:miniapp": JSON.stringify({
        version: "1",
        imageUrl: embedImage,
        button: {
          title: `Launch ${projectName}`,
          action: {
            type: "launch_miniapp",
            name: projectName,
            url: URL,
            splashImageUrl: heroImage,
            splashBackgroundColor: "#ffffff"
          }
        }
      }),
      "fc:frame": JSON.stringify({
        version: "1",
        imageUrl: embedImage,
        button: {
          title: `Launch ${projectName}`,
          action: {
            type: "launch_miniapp",
            name: projectName,
            url: URL
          }
        }
      }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
