const UserInteraction = require('../models/UserInteraction');
const Video = require('../models/Video');

// Like/unlike a video
exports.likeVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.user.id;

        console.log('Like request:', { videoId, userId });

        let interaction = await UserInteraction.findOne({ user: userId, video: videoId });

        if (interaction) {
            // Toggle like
            const wasLiked = interaction.liked;
            interaction.liked = !interaction.liked;
            await interaction.save();
            
            // Update video likes count
            const video = await Video.findById(videoId);
            if (!video) {
                return res.status(404).json({ success: false, message: 'Video not found' });
            }

            if (interaction.liked && !wasLiked) {
                video.likes += 1;
            } else if (!interaction.liked && wasLiked) {
                video.likes = Math.max(0, video.likes - 1);
            }
            await video.save();

            res.json({
                success: true,
                liked: interaction.liked,
                likesCount: video.likes
            });
        } else {
            // Create new interaction
            interaction = new UserInteraction({
                user: userId,
                video: videoId,
                liked: true
            });
            await interaction.save();

            // Update video likes count
            const video = await Video.findById(videoId);
            if (!video) {
                return res.status(404).json({ success: false, message: 'Video not found' });
            }
            video.likes += 1;
            await video.save();

            res.json({
                success: true,
                liked: true,
                likesCount: video.likes
            });
        }
    } catch (error) {
        console.error('Like video error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Toggle watch later
exports.toggleWatchLater = async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.user.id;

        console.log('Watch later request:', { videoId, userId });

        let interaction = await UserInteraction.findOne({ user: userId, video: videoId });

        if (interaction) {
            interaction.watchLater = !interaction.watchLater;
            await interaction.save();

            res.json({
                success: true,
                watchLater: interaction.watchLater
            });
        } else {
            interaction = new UserInteraction({
                user: userId,
                video: videoId,
                watchLater: true
            });
            await interaction.save();

            res.json({
                success: true,
                watchLater: true
            });
        }
    } catch (error) {
        console.error('Watch later error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Toggle favorite
exports.toggleFavorite = async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.user.id;

        let interaction = await UserInteraction.findOne({ user: userId, video: videoId });

        if (interaction) {
            interaction.favorite = !interaction.favorite;
            await interaction.save();

            res.json({
                success: true,
                favorite: interaction.favorite
            });
        } else {
            interaction = new UserInteraction({
                user: userId,
                video: videoId,
                favorite: true
            });
            await interaction.save();

            res.json({
                success: true,
                favorite: true
            });
        }
    } catch (error) {
        console.error('Favorite error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get user interactions
exports.getUserInteractions = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const interactions = await UserInteraction.find({ user: userId })
            .populate('video')
            .sort({ createdAt: -1 });

        res.json({ success: true, interactions });
    } catch (error) {
        console.error('Get user interactions error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get user's liked videos
exports.getUserLikes = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const likedVideos = await UserInteraction.find({ 
            user: userId, 
            liked: true 
        }).populate('video').sort({ createdAt: -1 });

        // Filter out any interactions where video might be null (deleted videos)
        const validVideos = likedVideos
            .filter(interaction => interaction.video !== null)
            .map(interaction => interaction.video);

        res.json({ success: true, videos: validVideos });
    } catch (error) {
        console.error('Get user likes error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get user's watch later videos
exports.getUserWatchLater = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const watchLaterInteractions = await UserInteraction.find({ 
            user: userId, 
            watchLater: true 
        }).populate('video').sort({ createdAt: -1 });

        // Filter out any interactions where video might be null (deleted videos)
        const validVideos = watchLaterInteractions
            .filter(interaction => interaction.video !== null)
            .map(interaction => interaction.video);

        res.json({ success: true, videos: validVideos });
    } catch (error) {
        console.error('Get watch later error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get user's favorite videos
exports.getUserFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const favoriteVideos = await UserInteraction.find({ 
            user: userId, 
            favorite: true 
        }).populate('video').sort({ createdAt: -1 });

        // Filter out any interactions where video might be null (deleted videos)
        const validVideos = favoriteVideos
            .filter(interaction => interaction.video !== null)
            .map(interaction => interaction.video);

        res.json({ success: true, videos: validVideos });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};