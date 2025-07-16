# 📸 Kroppit - Photo Cropping Mini App

A professional photo cropping Mini App built for Farcaster that lets users crop images and share them directly to their feed.

## ✨ Features

**Kroppit** makes photo cropping simple and social:

- 📱 **Upload photos** - Drag & drop or click to upload any image (PNG, JPG, GIF up to 10MB)
- ✂️ **Crop with precision** - Interactive crop selection with draggable handles
- 🎯 **Multiple crop shapes** - Rectangle, square, landscape, portrait, or circle
- 📤 **Share to Farcaster** - One-click sharing directly to Warpcast compose interface
- 🔗 **Wallet integration** - Connect with Coinbase Wallet, MetaMask, or WalletConnect
- 📱 **Mobile-friendly** - Optimized for mobile devices with touch support
- 🎨 **Professional UI** - Modern design with dark/light theme support

## 🚀 Live Demo

**Try Kroppit:** https://kroppit.vercel.app

Works in Farcaster apps and web browsers!

## 🛠️ Built With

- **Frontend**: Next.js 15.3.5, React 19.1.0, TypeScript
- **Styling**: Tailwind CSS with custom theme system
- **Image Processing**: HTML5 Canvas API for high-quality cropping
- **Farcaster Integration**: @farcaster/frame-sdk and @coinbase/onchainkit
- **Wallet Support**: Wagmi with multiple connector support
- **Image Hosting**: Cloudinary for permanent storage
- **Deployment**: Vercel with serverless functions

## 🎯 How It Works

1. **Upload** - Drag & drop or click to select your image
2. **Crop** - Select your crop area with interactive handles
3. **Choose Shape** - Pick from rectangle, square, landscape, portrait, or circle
4. **Share** - One-click sharing opens Warpcast with your image ready to cast

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Vercel account for deployment
- Cloudinary account for image hosting

### Local Development
```bash
# Clone the repository
git clone https://github.com/your-username/kroppit.git
cd kroppit

# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables
Create a `.env.local` file with:
```env
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=Kroppit
NEXT_PUBLIC_URL=https://your-app-url.vercel.app
NEXT_PUBLIC_APP_HERO_IMAGE=https://your-app-url.vercel.app/hero.png
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🚀 Development

### Build and Deploy
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Testing
- Test locally at `http://localhost:3000`
- Use ngrok for Farcaster testing: `ngrok http 3000`
- Test in Farcaster client with your Mini App URL

## 📱 Farcaster Integration

Kroppit is built specifically for Farcaster with:
- **Mini App compliance** - Follows Farcaster Mini App specifications
- **Frame metadata** - Proper og:image and fc:frame tags for embedding
- **Warpcast integration** - Direct sharing to Warpcast compose interface
- **Mobile optimization** - Designed for mobile-first Farcaster experience

## 🔍 Technical Architecture

### Core Components
- **PhotoCropperCard** - Main cropping interface with canvas manipulation
- **API Routes** - Image upload, processing, and sharing endpoints
- **Farcaster Integration** - Mini App manifest and frame metadata
- **Wallet Integration** - Multi-provider wallet connection support

### Key Files
- `/app/components/PhotoCropperCard.tsx` - Main cropping component
- `/app/api/upload-image/route.ts` - Image upload and validation
- `/app/share/page.tsx` - Shareable image pages with metadata
- `/app/layout.tsx` - Root layout with Farcaster meta tags

## 🐛 Known Issues

- Download button functionality is limited in Farcaster environments (by design)
- Some mobile browsers may have touch event limitations
- Large images (>5MB) may cause performance issues on older devices

## 📚 Additional Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete deployment instructions
- [Error Analysis](ERROR_ANALYSIS_REPORT.md) - Development lessons learned
- [Future Features](agents.md) - Planned enhancements and development log

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Built for Farcaster

Kroppit is specifically designed for the Farcaster ecosystem, providing users with a professional photo cropping experience that integrates seamlessly with their social feed.

---

Made with ❤️ for the Farcaster community