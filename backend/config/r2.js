const { S3Client } = require('@aws-sdk/client-s3');

// Validate required environment variables
const requiredEnvVars = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID', 
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
  }
}

console.log('🔧 R2 Configuration Check:', {
  accountId: process.env.R2_ACCOUNT_ID ? '✅ Set' : '❌ Missing',
  accessKey: process.env.R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing', 
  bucketName: process.env.R2_BUCKET_NAME ? '✅ Set' : '❌ Missing',
  hasSecretKey: process.env.R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'
});

// Log the actual values (mask secrets for security)
console.log('📋 R2 Config Details:', {
  accountId: process.env.R2_ACCOUNT_ID ? process.env.R2_ACCOUNT_ID.substring(0, 8) + '...' : 'Missing',
  accessKey: process.env.R2_ACCESS_KEY_ID ? process.env.R2_ACCESS_KEY_ID.substring(0, 8) + '...' : 'Missing',
  bucketName: process.env.R2_BUCKET_NAME || 'Missing',
  hasSecretKey: process.env.R2_SECRET_ACCESS_KEY ? '✅ Present' : '❌ Missing'
});

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

module.exports = r2Client;