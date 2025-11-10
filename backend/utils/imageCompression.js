const sharp = require('sharp');

const compressAndResizeImage = async (buffer, options = {}) => {
    try {
        const {
            maxWidth = 400,
            maxHeight = 400,
            quality = 80,
            format = 'jpeg'
        } = options;

        console.log(`🖼️ Compressing image: ${buffer.length} bytes -> ${maxWidth}x${maxHeight}, ${quality}% quality`);

        const compressedImage = await sharp(buffer)
            .resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ 
                quality: quality,
                mozjpeg: true // Better compression
            })
            .toBuffer();

        const originalSize = buffer.length;
        const compressedSize = compressedImage.length;
        const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        console.log(`✅ Image compressed: ${(originalSize / 1024).toFixed(1)}KB -> ${(compressedSize / 1024).toFixed(1)}KB (${savings}% savings)`);

        return {
            success: true,
            buffer: compressedImage,
            originalSize,
            compressedSize,
            savings
        };
    } catch (error) {
        console.error('❌ Image compression error:', error);
        return {
            success: false,
            error: error.message,
            buffer: buffer // Return original buffer if compression fails
        };
    }
};

// Alternative WebP compression (even smaller files)
const compressToWebP = async (buffer, options = {}) => {
    try {
        const {
            maxWidth = 400,
            maxHeight = 400,
            quality = 75
        } = options;

        console.log(`🖼️ Compressing to WebP: ${buffer.length} bytes`);

        const compressedImage = await sharp(buffer)
            .resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ 
                quality: quality,
                effort: 4 // Better compression (slower but smaller files)
            })
            .toBuffer();

        const originalSize = buffer.length;
        const compressedSize = compressedImage.length;
        const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        console.log(`✅ WebP compressed: ${(originalSize / 1024).toFixed(1)}KB -> ${(compressedSize / 1024).toFixed(1)}KB (${savings}% savings)`);

        return {
            success: true,
            buffer: compressedImage,
            originalSize,
            compressedSize,
            savings,
            format: 'webp'
        };
    } catch (error) {
        console.error('❌ WebP compression error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    compressAndResizeImage,
    compressToWebP
};