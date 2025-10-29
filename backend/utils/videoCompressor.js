const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

class VideoCompressor {
    static async compressVideo(inputBuffer, quality = 'medium') {
        return new Promise((resolve, reject) => {
            const tempInput = path.join(__dirname, '../temp', `input_${Date.now()}.mp4`);
            const tempOutput = path.join(__dirname, '../temp', `output_${Date.now()}.mp4`);

            // Ensure temp directory exists
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Write buffer to temp file
            fs.writeFileSync(tempInput, inputBuffer);

            const command = ffmpeg(tempInput);

            // Quality settings that maintain visual quality
            const qualitySettings = {
                high: {
                    videoBitrate: '2000k',
                    audioBitrate: '192k',
                    size: '1920x1080'
                },
                medium: {
                    videoBitrate: '1500k', 
                    audioBitrate: '128k',
                    size: '1280x720'
                },
                low: {
                    videoBitrate: '800k',
                    audioBitrate: '96k',
                    size: '854x480'
                }
            };

            const settings = qualitySettings[quality] || qualitySettings.medium;

            command
                .videoBitrate(settings.videoBitrate)
                .audioBitrate(settings.audioBitrate)
                .size(settings.size)
                .outputOptions([
                    '-preset fast', // Faster encoding with good quality
                    '-crf 23',      // Constant Rate Factor (18-28 is good, lower=better quality)
                    '-movflags +faststart', // Enable streaming
                    '-pix_fmt yuv420p',     // Wide compatibility
                    '-c:a aac'              // Audio codec
                ])
                .on('start', (commandLine) => {
                    console.log('🎬 FFmpeg started:', commandLine);
                })
                .on('progress', (progress) => {
                    console.log(`📊 Compression progress: ${Math.round(progress.percent)}%`);
                })
                .on('end', () => {
                    console.log('✅ Compression completed');
                    const compressedBuffer = fs.readFileSync(tempOutput);
                    
                    // Cleanup temp files
                    fs.unlinkSync(tempInput);
                    fs.unlinkSync(tempOutput);
                    
                    resolve(compressedBuffer);
                })
                .on('error', (err) => {
                    console.error('❌ Compression error:', err);
                    
                    // Cleanup temp files on error
                    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                    if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
                    
                    reject(err);
                })
                .save(tempOutput);
        });
    }

    static async getVideoDuration(inputBuffer) {
        return new Promise((resolve, reject) => {
            const tempFile = path.join(__dirname, '../temp', `duration_${Date.now()}.mp4`);
            
            // Ensure temp directory exists
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            fs.writeFileSync(tempFile, inputBuffer);

            ffmpeg.ffprobe(tempFile, (err, metadata) => {
                // Cleanup
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                
                if (err) {
                    reject(err);
                } else {
                    resolve(Math.round(metadata.format.duration));
                }
            });
        });
    }
}

module.exports = VideoCompressor;