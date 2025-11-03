// addShortIds.js
const mongoose = require('mongoose');
require('dotenv').config();

const Video = require('./models/Video');

const addShortIds = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-platform-db');
    console.log('✅ Connected to MongoDB');

    const videos = await Video.find({ shortId: { $exists: false } });
    console.log(`Found ${videos.length} videos without shortId`);

    for (let video of videos) {
      const shortId = Math.random().toString(36).substr(2, 9);
      video.shortId = shortId;
      await video.save();
      console.log(`✅ Added shortId ${shortId} to video: ${video.title}`);
    }

    console.log(`✅ Successfully added shortIds to ${videos.length} videos`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addShortIds();