# 🚀 Vercel Deployment Guide - Video Platform

## ✅ Pre-Deployment Security Checklist

### 1. Git Ignore (Already Done ✅)
Your `.gitignore` now protects:
- ✅ `.env` files (all variants)
- ✅ `.env.local` (your secrets)
- ✅ `node_modules`
- ✅ `.next` (build cache)
- ✅ `.vercel` (Vercel config)
- ✅ Temp files
- ✅ IDE files

### 2. Environment Variables for Vercel

**Add these in Vercel Dashboard > Project Settings > Environment Variables:**

```env
# MongoDB
MONGODB_URI=mongodb+srv://hakchhaiheang0:a3RBb6LsumMGXXPP@cluster0.pv4ugik.mongodb.net/ekerk?retryWrites=true&w=majority

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=66ea9576b835c174177b96d42139b62b
R2_ACCESS_KEY_ID=430358264506a5ed41accef39cfb2d39
R2_SECRET_ACCESS_KEY=6b4c1828ecaa96352576c9737d2fd930da9b23e206e9c0cf811fd6bb5f1cafec
R2_BUCKET_NAME=video-platform
R2_PUBLIC_URL=https://pub-2311243ea21d457fa767a074b6273a1e.r2.dev

# JWT Secret
JWT_SECRET=wNDH-ewrn&nr87

# Client URL
NEXT_PUBLIC_CLIENT_URL=https://your-domain.vercel.app
```

### 3. Firebase Configuration

**In Firebase Console:**
1. Go to Authentication > Settings > Authorized domains
2. Add your Vercel domain: `your-app.vercel.app`
3. Save

### 4. MongoDB Atlas Configuration

**In MongoDB Atlas:**
1. Go to Network Access
2. Add IP Address: `0.0.0.0/0` (Allow from anywhere)
3. Save (Required for Vercel serverless functions)

### 5. Cloudflare R2 Configuration

**Already configured!** Your R2 bucket is accessible from anywhere.

---

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub
```bash
# Check what will be committed
git status

# Make sure .env.local is NOT tracked
git check-ignore .env.local

# Add and commit your code
git add .
git commit -m "Ready for Vercel deployment"

# Push to GitHub
git push origin main
```

### Step 2: Deploy on Vercel

1. **Go to:** https://vercel.com/new
2. **Import** your GitHub repository
3. **Configure Project:**
   - Framework Preset: Next.js
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)

4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add each variable from section 2 above
   - Mark as "Production" and "Preview"

5. **Deploy!**
   - Click "Deploy"
   - Wait 2-5 minutes
   - Your app is live! 🎉

### Step 3: Post-Deployment

1. **Get your domain:** `https://your-app.vercel.app`
2. **Update Firebase:** Add this domain to authorized domains
3. **Test login:** Make sure Google Sign-In works
4. **Test upload:** Upload a test video

---

## 🔒 Security Features

### What's Protected:
✅ **Environment variables** - Never in git
✅ **API keys** - Stored in Vercel, not code
✅ **Database credentials** - Server-side only
✅ **R2 keys** - Server-side only
✅ **Firebase config** - Public keys only (safe)

### What's Public (Safe):
✅ `NEXT_PUBLIC_*` variables - Required for client-side
✅ Firebase public config - Designed to be public
✅ R2 public URL - Meant to be public

---

## ⚠️ Important Notes

### 1. Serverless Function Limits
- **Max duration:** 10 seconds (Hobby), 60 seconds (Pro)
- **Video uploads:** May timeout for large files
- **Solution:** Use Vercel Pro or implement chunked uploads

### 2. Video Processing
- **FFmpeg not available** in serverless
- **Current setup:** Uploads video as-is to R2
- **Duration detection:** Returns 0 (limitation)

### 3. Build Size
- **Limit:** 50MB
- **Your app:** Should be under limit
- **If over:** Remove unused dependencies

### 4. Cold Starts
- **First request** after inactivity: 2-3 seconds
- **Normal requests:** Fast (< 500ms)
- **Solution:** Vercel Pro has faster cold starts

---

## 🧪 Testing Checklist

Before going live, test:

- [ ] Login with Google
- [ ] Login with Email/Password
- [ ] Upload a video
- [ ] Select thumbnail from video
- [ ] View video page
- [ ] Admin dashboard access
- [ ] Manage videos (edit/delete)
- [ ] Manage categories (add/edit/delete)
- [ ] Mobile responsive design
- [ ] Video playback

---

## 🎯 Custom Domain (Optional)

1. **Buy domain** (Namecheap, GoDaddy, etc.)
2. **In Vercel:** Go to Project Settings > Domains
3. **Add your domain:** `yourdomain.com`
4. **Update DNS** at your registrar:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
5. **Wait 24-48 hours** for DNS propagation

---

## 📊 Monitoring

### Vercel Dashboard:
- **Analytics:** View counts, performance
- **Logs:** Check for errors
- **Deployments:** Rollback if needed

### MongoDB Atlas:
- **Monitor:** Database performance
- **Check:** Connection logs

### Firebase Console:
- **Authentication:** User sign-ins
- **Usage:** API calls

---

## 🆘 Troubleshooting

### Build Fails:
```bash
# Test build locally
npm run build

# Fix any errors shown
# Commit and push again
```

### Environment Variables Not Working:
1. Check variable names match exactly
2. Redeploy after adding variables
3. Check Vercel logs for errors

### API Routes Return 404:
1. Check route file paths: `src/app/api/...`
2. Redeploy
3. Clear browser cache

### Video Upload Fails:
1. Check R2 credentials in Vercel
2. Check file size limits
3. Check Vercel function timeout

---

## ✅ You're Ready!

Your app is **safe and ready** for Vercel deployment!

**Next Steps:**
1. Push to GitHub
2. Deploy on Vercel
3. Add environment variables
4. Test everything
5. Share with users! 🎉

**Good luck!** 🚀
