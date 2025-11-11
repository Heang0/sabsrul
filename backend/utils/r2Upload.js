const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { S3Client } = require('@aws-sdk/client-s3'); // ADD THIS
const crypto = require('crypto');

// ✅ ADD R2 CLIENT CONFIGURATION HERE:
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const uploadToR2 = async (file, folder = 'avatars') => {
  try {
    // Check if required environment variables are set
    if (!process.env.R2_BUCKET_NAME) {
      throw new Error('R2_BUCKET_NAME environment variable is not set');
    }
    if (!process.env.R2_ACCOUNT_ID) {
      throw new Error('R2_ACCOUNT_ID environment variable is not set');
    }

    const fileName = generateFileName();
    const fileExtension = file.mimetype.split('/')[1] || 'jpg';
    const key = `${folder}/${fileName}.${fileExtension}`;

    console.log(`📤 Uploading to R2: ${key}`);
    console.log(`🏪 Bucket: ${process.env.R2_BUCKET_NAME}`);
    console.log(`📁 File size: ${(file.buffer.length / 1024).toFixed(1)}KB`);

    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    console.log('🔄 Sending upload command to R2...');
    await r2Client.send(new PutObjectCommand(uploadParams));
    console.log('✅ File uploaded to R2 successfully');
    
    // Use R2_PUBLIC_URL if provided, otherwise construct it
    const publicUrl = process.env.R2_PUBLIC_URL 
      ? `${process.env.R2_PUBLIC_URL}/${key}`
      : `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;
    
    console.log(`🔗 Public URL: ${publicUrl}`);
    
    return {
      success: true,
      url: publicUrl,
      key: key
    };
  } catch (error) {
    console.error('❌ R2 Upload Error:', error.message);
    console.error('📋 Error details:', {
      bucket: process.env.R2_BUCKET_NAME,
      accountId: process.env.R2_ACCOUNT_ID,
      hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY
    });
    
    return {
      success: false,
      error: error.message
    };
  }
};

const deleteFromR2 = async (key) => {
  try {
    if (!process.env.R2_BUCKET_NAME) {
      throw new Error('R2_BUCKET_NAME environment variable is not set');
    }

    const deleteParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    };

    console.log(`🗑️ Attempting to delete from R2: ${key}`);
    
    await r2Client.send(new DeleteObjectCommand(deleteParams));
    console.log(`✅ Successfully deleted from R2: ${key}`);
    return { success: true };
  } catch (error) {
    console.error('❌ R2 Delete Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  uploadToR2,
  deleteFromR2,
  generateFileName
};