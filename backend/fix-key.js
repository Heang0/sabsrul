const fs = require('fs');
const path = require('path');

// Read your current service account key
const keyPath = path.join(__dirname, 'service-account-key.json');
const serviceAccount = require(keyPath);

console.log('Current private key format:');
console.log(serviceAccount.private_key.substring(0, 100) + '...');

// Try to fix the key by ensuring proper newlines
const fixedPrivateKey = serviceAccount.private_key.replace(/\\n/g, '\n');

// Create a new key file with the fixed private key
const fixedServiceAccount = {
    ...serviceAccount,
    private_key: fixedPrivateKey
};

// Write the fixed key to a new file
const fixedKeyPath = path.join(__dirname, 'service-account-key-fixed.json');
fs.writeFileSync(fixedKeyPath, JSON.stringify(fixedServiceAccount, null, 2));

console.log('✅ Created fixed key file: service-account-key-fixed.json');
console.log('Fixed private key format:');
console.log(fixedPrivateKey.substring(0, 100) + '...');