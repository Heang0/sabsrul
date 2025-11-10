const Playlist = require('../models/Playlist');
const Video = require('../models/Video');

// Create a new playlist
exports.createPlaylist = async (req, res) => {
    try {
        const { name, description, isPublic } = req.body;
        const userId = req.user.id;

        const playlist = new Playlist({
            name,
            description,
            isPublic: isPublic || false,
            user: userId,
            videos: []
        });

        await playlist.save();
        await playlist.populate('videos');

        res.json({ success: true, playlist });
    } catch (error) {
        console.error('Create playlist error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get user's playlists
exports.getUserPlaylists = async (req, res) => {
    try {
        const userId = req.user.id;

        const playlists = await Playlist.find({ user: userId })
            .populate('videos')
            .sort({ updatedAt: -1 });

        res.json({ success: true, playlists });
    } catch (error) {
        console.error('Get user playlists error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get playlist details
exports.getPlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const userId = req.user.id;

        const playlist = await Playlist.findOne({ _id: playlistId, user: userId })
            .populate('videos');

        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist not found' });
        }

        res.json({ success: true, playlist });
    } catch (error) {
        console.error('Get playlist error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update playlist
exports.updatePlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { name, description, isPublic } = req.body;
        const userId = req.user.id;

        const playlist = await Playlist.findOne({ _id: playlistId, user: userId });

        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist not found' });
        }

        if (name) playlist.name = name;
        if (description !== undefined) playlist.description = description;
        if (isPublic !== undefined) playlist.isPublic = isPublic;

        await playlist.save();
        await playlist.populate('videos');

        res.json({ success: true, playlist });
    } catch (error) {
        console.error('Update playlist error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete playlist
exports.deletePlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const userId = req.user.id;

        const playlist = await Playlist.findOne({ _id: playlistId, user: userId });

        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist not found' });
        }

        await Playlist.findByIdAndDelete(playlistId);

        res.json({ success: true, message: 'Playlist deleted successfully' });
    } catch (error) {
        console.error('Delete playlist error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add video to playlist
exports.addVideoToPlaylist = async (req, res) => {
    try {
        const { playlistId, videoId } = req.params;
        const userId = req.user.id;

        const playlist = await Playlist.findOne({ _id: playlistId, user: userId });
        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist not found' });
        }

        // Check if video exists
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        // Check if video already in playlist
        if (playlist.videos.includes(videoId)) {
            return res.status(400).json({ success: false, message: 'Video already in playlist' });
        }

        playlist.videos.push(videoId);
        await playlist.save();
        await playlist.populate('videos');

        res.json({ success: true, playlist });
    } catch (error) {
        console.error('Add video to playlist error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Remove video from playlist
exports.removeVideoFromPlaylist = async (req, res) => {
    try {
        const { playlistId, videoId } = req.params;
        const userId = req.user.id;

        const playlist = await Playlist.findOne({ _id: playlistId, user: userId });
        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist not found' });
        }

        playlist.videos = playlist.videos.filter(vid => vid.toString() !== videoId);
        await playlist.save();
        await playlist.populate('videos');

        res.json({ success: true, playlist });
    } catch (error) {
        console.error('Remove video from playlist error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};