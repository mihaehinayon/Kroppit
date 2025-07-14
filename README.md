# 📸 Kroppit - Photo Cropping Mini App

A professional photo cropping Mini App built for Farcaster that lets users crop images and share them directly to their feed.

## ✨ What Kroppit Does

**Kroppit** makes photo cropping simple and social:

- 📱 **Upload photos** - Drag & drop or click to upload any image
- ✂️ **Crop with precision** - Select exactly the area you want to keep
- 🎯 **Multiple crop shapes** - Rectangle, square, landscape, portrait, or circle
- 📤 **Share to Farcaster** - One-click sharing with automatic image hosting
- 🔗 **Wallet integration** - Connect with Coinbase Wallet, MetaMask, or WalletConnect
- 📱 **Mobile-friendly** - Works perfectly on all devices

## 🚀 Live Demo

Try Kroppit in your Farcaster app or visit the web version to see it in action!

## 🛠️ Built With

- **[Next.js 15](https://nextjs.org/)** - React framework
- **[Farcaster MiniKit](https://docs.base.org/builderkits/minikit/overview)** - Mini App framework
- **[OnchainKit](https://www.base.org/builders/onchainkit)** - Coinbase's React components
- **[Wagmi](https://wagmi.sh/)** - Wallet connection
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

## 🎯 Key Features

### Photo Cropping Engine
- **Canvas-based processing** - Precise image manipulation using HTML5 Canvas
- **Interactive selection** - Click and drag to select crop areas
- **Real-time preview** - See exactly what your crop will look like
- **Multiple aspect ratios** - Choose from preset shapes or create custom crops

### Farcaster Integration
- **Mini App native** - Built specifically for the Farcaster ecosystem
- **Direct sharing** - Share cropped images straight to your Farcaster feed
- **Auto image hosting** - Images are automatically uploaded and embedded
- **Frame metadata** - Proper Mini App discovery and sharing

### Wallet Support
- **Multiple wallets** - Coinbase Wallet, MetaMask, WalletConnect
- **Environment detection** - Mobile and desktop compatibility
- **Base network** - Built for the Base blockchain ecosystem

## 🏃‍♂️ How to Use

1. **Upload** - Click "Upload Image" or drag & drop a photo
2. **Select** - Choose your crop shape (rectangle, square, circle, etc.)
3. **Crop** - Drag the corners to adjust your selection
4. **Share** - Click "Share to Farcaster" to post your cropped image

## 💻 Development Setup

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/kroppit.git
cd kroppit
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file:
```env
# Required - OnchainKit API key
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key

# Required - Your app details
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=Kroppit
NEXT_PUBLIC_URL=http://localhost:3000

# Optional - For notifications (Upstash Redis)
REDIS_URL=your_redis_url
REDIS_TOKEN=your_redis_token

# Optional - For IPFS image hosting (Pinata)
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=gateway.pinata.cloud

# Optional - For frame association
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=
```

4. **Start development server**
```bash
npm run dev
```

5. **Open in browser**
Visit `http://localhost:3000`

### Environment Setup Help

**Get OnchainKit API Key:**
1. Visit [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Create a project and get your API key

**Set up Redis (for notifications):**
1. Visit [Upstash](https://upstash.com/)
2. Create a free Redis database
3. Copy URL and token to your `.env.local`

**Set up Pinata (for IPFS image hosting):**
1. Visit [Pinata](https://pinata.cloud/)
2. Create a free account
3. Generate a new JWT token with upload permissions
4. Create a new group for organizing uploaded images
5. Copy JWT and group ID to your `.env.local`

**Generate Frame Association:**
```bash
npx create-onchain --manifest
```

## 📁 Project Structure

```
app/
├── components/
│   ├── PhotoCropperCard.tsx    # Main cropping component
│   └── DemoComponents.tsx      # UI components
├── api/
│   ├── upload-image/          # Image upload endpoint
│   └── webhook/               # Farcaster webhooks
├── page.tsx                   # Main app page
├── layout.tsx                 # App layout & metadata
├── providers.tsx              # Wallet & MiniKit providers
└── globals.css               # Global styles
```

## 🌟 What Makes Kroppit Special

### For Beginners
- **Simple interface** - Upload, crop, share in 3 steps
- **Visual feedback** - See exactly what you're doing
- **Mobile-first** - Works great on phones where most people use Farcaster

### For Developers
- **Modern stack** - Latest Next.js, React 19, TypeScript
- **Clean code** - Well-structured, commented, and maintainable
- **Mini App best practices** - Proper Farcaster integration patterns
- **Responsive design** - Mobile and desktop compatibility

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Connect to Vercel**
```bash
npm i -g vercel
vercel
```

2. **Add environment variables**
- Go to your Vercel dashboard
- Add all environment variables from your `.env.local`
- Redeploy

3. **Update your environment**
Update `NEXT_PUBLIC_URL` to your Vercel URL

### Test in Farcaster
1. Open Warpcast
2. Use "Preview Frames" feature  
3. Enter your deployed URL
4. Test the full crop and share flow

## 🎨 Customization

Want to make Kroppit your own?

### Branding
- Change app name in `layout.tsx`
- Update colors in `globals.css`
- Replace logo images in `public/`

### Features
- Add new crop shapes in `PhotoCropperCard.tsx`
- Customize sharing messages
- Add image filters or effects

## 📈 What's Next

Kroppit is a great foundation for learning Mini App development. Consider adding:

- **Preset crop ratios** - 1:1, 16:9, 4:3
- **Basic filters** - Brightness, contrast, saturation  
- **Batch processing** - Crop multiple images
- **User accounts** - Save favorite crops
- **NFT minting** - Turn crops into NFTs

## 🤝 Contributing

This is a learning project! Feel free to:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning and building your own apps.

## 🙏 Acknowledgments

- **Farcaster** - For the amazing Mini App platform
- **Base** - For OnchainKit and MiniKit
- **Coinbase** - For the developer tools
- **The Farcaster community** - For inspiration and feedback

---

**Made with ❤️ for the Farcaster community**

*This is a beginner-friendly Mini App project showcasing modern web development practices and Farcaster integration.*