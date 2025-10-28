const multer = require('multer');

// Use memory storage to store the file buffer, which is necessary for direct upload to Cloudinary
const storage = multer.memoryStorage();

// File filter function to ensure correct file types are uploaded
const fileFilter = (req, file, cb) => {
    // Check if the field name is 'video'
    if (file.fieldname === 'video') {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true); // Accept video
        } else {
            cb(new Error('Only video files are allowed in the "video" field.'), false);
        }
    // Check if the field name is 'thumbnail'
    } else if (file.fieldname === 'thumbnail') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true); // Accept image
        } else {
            cb(new Error('Only image files are allowed in the "thumbnail" field.'), false);
        }
    } else {
        cb(new Error('Unexpected file field name.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        // Set a high limit (500MB) suitable for video uploads
        fileSize: 500 * 1024 * 1024, 
    }
});

module.exports = upload;
