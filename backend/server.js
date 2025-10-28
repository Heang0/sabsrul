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

// Admin Analytics (using /api/analytics for cleaner endpoint structure)
app.use('/api/analytics', analyticsRoutes); 


// --- 6. Frontend Catch-All Route ---

// This serves the frontend application for all non-API requests.
// NOTE: For better SPA routing, you might need to adjust this, 
// but for simple HTML pages, this works fine.
app.get('*', (req, res) => {
    // If the request path does not start with /api, serve the main HTML file.
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});


// --- 7. Start Server ---

const PORT = process.env.PORT || 3000;

// Connect to DB and then start the server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🔗 API Base: http://localhost:${PORT}/api`);
        console.log(`👤 Admin Login: http://localhost:${PORT}/login.html`);
    });
});
