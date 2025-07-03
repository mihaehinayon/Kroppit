# Kroppit Deployment Setup

## Conservative Image Cleanup Strategy ✅

### How It Works:
1. **User crops image** → **Upload to Cloudinary** (temporary hosting)
2. **User casts to Farcaster** → **Mark as "cast_successful"** 
3. **Wait 2 hours** → **Farcaster caches image** (conservative delay)
4. **Auto-cleanup runs** → **Delete from Cloudinary** (image stays in Farcaster)

### Required Environment Variables:

```bash
# Cloudinary (Free Tier: 25GB storage + bandwidth)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key  
CLOUDINARY_API_SECRET=your_api_secret

# Cron job security
CRON_SECRET=generate_random_secure_string
```

### Setup Steps:

#### 1. Cloudinary Account (Free)
- Sign up at https://cloudinary.com
- Get credentials from Dashboard
- Add to environment variables

#### 2. Install Dependencies
```bash
npm install cloudinary
```

#### 3. Set Up Cron Job (Vercel)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/cleanup",
    "schedule": "0 */2 * * *"
  }]
}
```

#### 4. Set Environment Variables in Production
- Add all env vars to Vercel/your hosting platform
- Generate secure random string for CRON_SECRET

### Cleanup Schedule:
- **Every 2 hours**: Check for images to delete
- **Successfully cast images**: Delete after 2 hours
- **Abandoned uploads**: Delete after 24 hours

### Cost Estimate:
- **Free tier**: ~250,000 crop images/month
- **Growth phase**: ~$20-50/month for 100k+ images
- **Very cost-effective** for the UX improvement

### Safety Features:
- ✅ **Conservative 2-hour delay** before deletion
- ✅ **Only deletes after successful cast**
- ✅ **Abandoned uploads cleaned up**
- ✅ **Cron job authentication**
- ✅ **Detailed logging**

### Testing:
1. Deploy with environment variables
2. Test image upload: `/api/upload-image`
3. Test cast marking: `/api/mark-cast-success`
4. Test cleanup: `/api/cleanup-images`
5. Verify cron job: `/api/cron/cleanup`

This approach ensures:
- **Zero broken casts** (2-hour safety buffer)
- **Minimal storage costs** (automatic cleanup)
- **Great user experience** (direct casting)