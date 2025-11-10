const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const updateToAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-platform');
        console.log('Connected to MongoDB');

        // Update your user to admin - REPLACE WITH YOUR EMAIL
        const result = await User.updateOne(
            { email: "admin@sabsrul.com" }, // ⭐ REPLACE WITH YOUR ACTUAL EMAIL
            { $set: { role: "admin" } }
        );

        if (result.modifiedCount > 0) {
            console.log('✅ User updated to admin successfully!');
        } else {
            console.log('❌ User not found or already admin');
        }

    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        mongoose.connection.close();
    }
};

updateToAdmin();