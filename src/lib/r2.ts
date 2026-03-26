import { S3Client, PutObjectCommand, DeleteObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';

// R2 Client configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const generateFileName = (bytes = 32) => {
  const crypto = require('crypto');
  return crypto.randomBytes(bytes).toString('hex');
};

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export async function uploadToR2(
  file: Buffer,
  fileName: string,
  folder: string = 'uploads',
  contentType?: string
): Promise<UploadResult> {
  try {
    if (!process.env.R2_BUCKET_NAME) {
      throw new Error('R2_BUCKET_NAME environment variable is not set');
    }
    if (!process.env.R2_ACCOUNT_ID) {
      throw new Error('R2_ACCOUNT_ID environment variable is not set');
    }

    const key = `${folder}/${fileName}`;

    console.log(`📤 Uploading to R2: ${key}`);
    console.log(`🏪 Bucket: ${process.env.R2_BUCKET_NAME}`);
    console.log(`📁 File size: ${(file.length / 1024).toFixed(1)}KB`);

    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType || 'application/octet-stream',
      ACL: 'public-read' as ObjectCannedACL,
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
      key: key,
    };
  } catch (error) {
    console.error('❌ R2 Upload Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteFromR2(key: string): Promise<UploadResult> {
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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteMultipleFromR2(keys: string[]): Promise<UploadResult[]> {
  const results = await Promise.all(keys.map((key) => deleteFromR2(key)));
  return results;
}
