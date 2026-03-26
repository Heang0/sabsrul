# Video Platform - Setup & Usage Guide

## 🎯 Current Features

### ✅ Completed
1. **Responsive Design** - Works on all devices (mobile, tablet, desktop)
2. **Video Cards** - 2 per row on mobile, 3-4 on desktop
3. **Video Watch Page** - Like, Save, Watch Later, Share, Comments
4. **Login/Register Pages** - Google Sign-In
5. **Profile Page** - Tabs for Videos, Watch Later, Liked, Playlists
6. **Admin Dashboard** - Analytics and video management
7. **Light Theme** - Professional white/black/gray design

---

## 🔐 Authentication Flow

### How Users Log In
1. Users click **"Log in"** or **"Sign up"** in navbar
2. They go to `/login` or `/register` page
3. Click **"Continue with Google"**
4. Firebase authenticates them
5. User data is synced to MongoDB via `/api/auth/sync`

### How Admin Login Works
Currently, **any user who logs in can access the dashboard**. To restrict this:

#### Option 1: Manual Admin Setup (Recommended)
After a user logs in for the first time:
1. Open MongoDB Atlas or your database tool
2. Find the `users` collection
3. Find your user document
4. Change `role` from `"user"` to `"admin"`
5. Now only that user can access `/dashboard`

#### Option 2: Admin Email List
Add this to your `.env.local`:
```
ADMIN_EMAILS=your-email@gmail.com,another-admin@gmail.com
```

Then check in dashboard page if user email is in the list.

---

## 📁 Profile Page Features

The profile page (`/profile`) has 4 tabs:

### 1. My Videos
- Shows videos uploaded by this user
- Currently empty (only admin can upload)

### 2. Watch Later
- Shows videos user saved to watch later
- Users must be logged in to save videos

### 3. Liked Videos
- Shows videos user liked
- Users must be logged in to like videos

### 4. Playlists
- Shows user's playlists
- Button to create new playlist
- Currently shows "No Playlists Yet"

---

## 🎬 Video Watch Page Features

### Action Buttons (Below Video)
1. **Like** - Shows like count, requires login
2. **Save** - Save video to library, requires login
3. **Watch Later** - Add to watch later list, requires login
4. **Share** - Share video or copy link, works without login

### Comments Section
- Comment input box
- Requires login to comment
- Shows "No comments yet" when empty

### Related Videos
- Shows videos from same category
- Displayed on right side (desktop) or below (mobile)

---

## 🚀 How to Test

### As a Regular User:
1. Go to http://localhost:3000
2. Click **"Log in"** in navbar
3. Click **"Continue with Google"**
4. Sign in with your Google account
5. Click your profile icon → **"Profile"**
6. See your profile with tabs

### As an Admin:
1. Log in with your admin Google account
2. Go to http://localhost:3000/dashboard
3. You should see analytics (if you set role to admin in MongoDB)

### To Make Yourself Admin:
1. Log in with your Google account
2. Open MongoDB Atlas
3. Go to `video-platform` database → `users` collection
4. Find your user document (by email)
5. Edit document: change `role: "user"` to `role: "admin"`
6. Refresh dashboard page - you now have access!

---

## 🔧 What Still Needs Implementation

### Backend API Routes Needed:
```
POST /api/videos/:id/like       - Like a video
POST /api/videos/:id/save       - Save video to library
POST /api/videos/:id/watch-later - Add to watch later
POST /api/videos/:id/comment    - Add a comment
GET  /api/user/liked            - Get user's liked videos
GET  /api/user/watch-later      - Get user's watch later list
GET  /api/user/playlists        - Get user's playlists
POST /api/playlists             - Create playlist
```

### Database Collections Needed:
```
- users (already exists)
- videos (already exists)
- comments (new)
- playlists (already exists)
- userInteractions (already exists - can use for likes/watch-later)
```

---

## 📱 Responsive Design

### Mobile (< 640px)
- 2 video cards per row
- Hamburger menu in navbar
- Stacked layout for video page
- Related videos below main video

### Tablet (640px - 1024px)
- 2-3 video cards per row
- Full navbar links
- Related videos beside main video

### Desktop (> 1024px)
- 4 video cards per row
- Full navbar with all features
- Related videos in sidebar

---

## 🎨 Color Scheme

```
Background: White (#ffffff)
Text Primary: Gray-900 (#111827)
Text Secondary: Gray-700 (#374151)
Text Muted: Gray-500 (#6b7280)
Borders: Gray-200 (#e5e7eb)
Accent: Gray-900 (buttons, active states)
```

**Professional minimal design** - Only white, black, and gray colors!

---

## ⚠️ Important Notes

1. **Firebase Required**: You MUST set up Firebase for login to work
2. **MongoDB Required**: Videos and users are stored in MongoDB
3. **Cloudflare R2**: Videos and thumbnails are stored in your R2 bucket
4. **Admin Role**: Set manually in MongoDB (role: "admin")

---

## 🎯 Next Steps to Complete

1. **Set up Firebase** (if not done yet)
   - Go to https://console.firebase.google.com/
   - Create project
   - Enable Google Auth
   - Copy config to `.env.local`

2. **Make yourself admin**
   - Log in with your Google account
   - Update your user in MongoDB: `role: "admin"`
   - Access dashboard at `/dashboard`

3. **Test all features**
   - Login/Logout
   - Profile page tabs
   - Video watch page
   - Like/Save buttons (redirect to login if not logged in)
   - Share button (copies link)

4. **Add sample data** (optional)
   - Add more videos to test related videos
   - Use same category to see related videos working

---

## 📞 Support

If something doesn't work:
1. Check browser console for errors
2. Check terminal for server errors
3. Verify Firebase config in `.env.local`
4. Verify MongoDB connection string
5. Make sure you're logged in for actions that require auth
