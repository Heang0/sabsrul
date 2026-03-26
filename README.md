# Video Platform - Next.js Fullstack Application

A complete video streaming platform built with Next.js 14, Firebase Authentication, MongoDB, and Cloudflare R2 storage.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth (Google Sign-In)
- **Database**: MongoDB with Mongoose
- **Storage**: Cloudflare R2 (videos & thumbnails)
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
next-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── analytics/     # Analytics endpoint
│   │   │   ├── auth/          # Auth endpoints
│   │   │   ├── categories/    # Categories endpoints
│   │   │   └── videos/        # Videos endpoints
│   │   ├── analytics/         # Analytics dashboard page
│   │   ├── categories/        # Categories page
│   │   ├── dashboard/         # Admin dashboard page
│   │   ├── profile/           # User profile page
│   │   ├── upload/            # Video upload page
│   │   ├── video/[id]/        # Video watch page
│   │   ├── videos/            # All videos page
│   │   └── page.tsx           # Home page
│   ├── components/            # Reusable React components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── VideoCard.tsx
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx    # Firebase auth context
│   ├── lib/                   # Utility libraries
│   │   ├── db.ts              # MongoDB connection
│   │   ├── firebase.ts        # Firebase config
│   │   └── r2.ts              # Cloudflare R2 upload
│   ├── middleware.ts          # Route protection middleware
│   └── models/                # Mongoose models
│       ├── Category.ts
│       ├── Playlist.ts
│       ├── User.ts
│       ├── UserInteraction.ts
│       └── Video.ts
├── .env.local                 # Environment variables (create from .env.local.example)
└── package.json
```

## ⚙️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

#### Required Environment Variables:

**MongoDB:**
- `MONGODB_URI` - Your MongoDB connection string

**Firebase:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Get these from Firebase Console > Project Settings > Your apps > SDK setup

**Cloudflare R2:**
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

Get these from Cloudflare Dashboard > R2 > API Tokens

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable **Authentication** > **Sign-in method** > **Google**
4. Add your web app and copy the configuration
5. Add your domain to authorized domains (localhost for development)

### 4. MongoDB Setup

Make sure your MongoDB connection string allows connections from Vercel (if deploying).
For MongoDB Atlas:
- Add `0.0.0.0/0` to Network Access IP whitelist
- Use connection string format: `mongodb+srv://username:password@cluster.mongodb.net/video-platform`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Build for Production

```bash
npm run build
npm start
```

## 📄 Features

### Authentication
- ✅ Google Sign-In via Firebase
- ✅ Automatic user sync with MongoDB
- ✅ Role-based access (user/admin)
- ✅ Protected routes

### Video Management
- ✅ Upload videos to Cloudflare R2
- ✅ Upload custom thumbnails
- ✅ Video categories and tags
- ✅ Video search and filtering
- ✅ Related videos

### User Features
- ✅ User profiles
- ✅ Watch history
- ✅ Like videos
- ✅ Favorites/Watch Later

### Admin Dashboard
- ✅ Analytics overview
- ✅ Video management
- ✅ Category management
- ✅ Performance metrics

## 🌐 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/videos` | Get all videos | Public |
| GET | `/api/videos/[id]` | Get single video | Public |
| POST | `/api/videos/upload` | Upload video | Admin |
| PUT | `/api/videos/[id]` | Update video | Admin |
| DELETE | `/api/videos/[id]` | Delete video | Admin |
| GET | `/api/categories` | Get categories | Public |
| POST | `/api/categories` | Create category | Admin |
| GET | `/api/analytics` | Get analytics | Admin |
| POST | `/api/auth/sync` | Sync Firebase user | Public |

## 🚀 Deployment (Vercel)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Vercel Environment Variables

Make sure to add all environment variables from `.env.local` to your Vercel project settings.

## 📝 Notes

- Video processing (duration detection) is simplified. For production, consider using a background job or serverless function with ffprobe.
- Admin role is stored in MongoDB. You can manually set a user's role to 'admin' in the database.
- The middleware provides basic route protection. For production, implement proper JWT verification.

## 🐛 Known Limitations

1. **Video Duration**: Currently returns 0. Use a background job with ffprobe for accurate duration.
2. **Video Compression**: Not implemented. Videos are uploaded as-is to R2.
3. **Multiple Qualities**: Only original quality is stored. Implement HLS streaming for adaptive quality.

## 📫 Support

For issues or questions, please create an issue in the repository.

## 📄 License

MIT License
