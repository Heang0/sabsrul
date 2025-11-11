const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// --- 1. Middleware ---
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses incoming requests with urlencoded payloads

// --- 2. Serve Static Files (Frontend) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- 3. Import Routes ---
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const categoryRoutes = require('./routes/categories');
const analyticsRoutes = require('./routes/analytics');

// ADD USER ROUTES HERE
const userRoutes = require('./routes/user'); // Add this line

// --- 4. Database Connection ---
const connectDB = async () => {
    try {
        // Use the URI from .env or a local fallback
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/video-platform-db';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        // Exit process with failure
        process.exit(1); 
    }
};
const fs = require('fs');
const tempDir = './temp_thumbs';
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('✅ Created temp directory for thumbnails');
}

// --- 5. Mount API Routes ---

// Public basic health check
app.get('/api', (req, res) => {
    res.json({ 
        message: 'Video Platform API is running!',
        version: '1.0.0'
    });
});

// Primary Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/analytics', analyticsRoutes); 

// ADD THESE ROUTES AFTER YOUR EXISTING ONES
const interactionRoutes = require('./routes/interactions');
const playlistRoutes = require('./routes/playlists');

// Add these after your existing app.use() routes
app.use('/api/interactions', interactionRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/users', userRoutes); // Add this line for user routes

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- 6.5. Specific Frontend Routes ---
// Serve video detail page (old format)
app.get('/video/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'video.html'));
});

// 🔥 ADD THIS: Serve video page with clean URL
app.get('/video', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'video.html'));
});

// Serve other specific pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve profile page
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// 🔥 ADD THESE NEW EXTENSIONLESS URL ROUTES:
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

app.get('/videos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'videos.html'));
});

app.get('/categories', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'categories.html'));
});

app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

app.get('/terms-privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'terms-privacy.html'));
});

app.get('/delete-account', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'delete-account.html'));
});

app.get('/confirm-deletion', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'confirm-deletion.html'));
});

// Serve index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔥 ADD THIS: Serve index page with /index URL
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// This serves the frontend application for all non-API requests.
// NOTE: For better SPA routing, you might need to adjust this, 
// but for simple HTML pages, this works fine.
app.get('*', (req, res) => {
    // If the request path does not start with /api, serve the main HTML file.
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Add after your other routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;

// Connect to DB and then start the server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🔗 API Base: http://localhost:${PORT}/api`);
        console.log(`👤 Admin Login: http://localhost:${PORT}/login`); // Remove .html
        console.log(`👤 User Profile: http://localhost:${PORT}/profile`); // Remove .html
    });
});
