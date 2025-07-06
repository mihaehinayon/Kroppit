# Kroppit Deployment Guide

## Quick Deploy to Vercel (Recommended)

### 1. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (run from your project root)
vercel

# Follow prompts:
# - Link to existing project? N
# - Project name: kroppit
# - Directory: ./
# - Override settings? N
```

### 2. Configure Environment Variables in Vercel
Go to your Vercel dashboard → Project → Settings → Environment Variables

Add these variables:
```
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=Kroppit
NEXT_PUBLIC_APP_SUBTITLE=Perfect crops for Farcaster
NEXT_PUBLIC_APP_DESCRIPTION=Quick, easy, beautiful photo cropping tool for Farcaster. Upload, crop, and share your perfect photos in seconds.
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=#000000
NEXT_PUBLIC_APP_PRIMARY_CATEGORY=productivity
NEXT_PUBLIC_APP_TAGLINE=Perfect crops for Farcaster. Quick, easy, beautiful.
NEXT_PUBLIC_APP_OG_TITLE=Kroppit - Photo Cropping for Farcaster
NEXT_PUBLIC_APP_OG_DESCRIPTION=Perfect crops for Farcaster. Quick, easy, beautiful photo cropping tool.
```

### 3. Update URLs After Deployment
After deployment, update your .env with the production URL:
```
NEXT_PUBLIC_URL=https://your-app-name.vercel.app
```

Then redeploy: `vercel --prod`

## Continuous Development Workflow

### Making Changes
1. Work on feature branches: `git checkout -b feature/new-feature`
2. Test locally: `npm run dev`
3. Commit changes: `git add . && git commit -m "Add new feature"`
4. Push to GitHub: `git push origin feature/new-feature`
5. Merge to main: Create PR → Merge
6. Auto-deploy: Vercel automatically deploys main branch

### Environment Management
- **Development**: Use `.env` for local development
- **Production**: Set environment variables in Vercel dashboard
- **Staging**: Use preview deployments for testing

## Farcaster & Coinbase Wallet Submission

### Farcaster Mini App Directory
1. Visit: https://farcaster.xyz/developers/frames
2. Submit your app with:
   - URL: `https://your-app.vercel.app`
   - Manifest: `https://your-app.vercel.app/.well-known/farcaster.json`

### Coinbase Wallet
1. Your app is already compatible with Coinbase Wallet via MiniKit
2. No separate submission needed - works automatically
3. Ensure manifest is accessible at `/.well-known/farcaster.json`

## Required Assets
Make sure you have these images in your `public/` folder:
- `icon.png` (512x512px) - App icon
- `splash.png` (1200x630px) - Splash screen
- `hero.png` (1200x630px) - Hero/OG image

## Testing Checklist
- [ ] App loads at production URL
- [ ] Farcaster manifest accessible: `/well-known/farcaster.json`
- [ ] Photo upload works
- [ ] Cropping functionality works
- [ ] Farcaster sharing works
- [ ] Mobile responsive
- [ ] All images load properly